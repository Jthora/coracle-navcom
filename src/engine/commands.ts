import {nwc} from "@getalby/sdk"
import {
  follow as baseFollow,
  unfollow as baseUnfollow,
  userMessagingRelayList,
  pubkey,
  repository,
  session,
  signer,
  tagPubkey,
  userRelayList,
  publishThunk,
  sendWrapped,
} from "@welshman/app"
import {append, sha256, remove, nthNe, uniq} from "@welshman/lib"
import {Nip01Signer} from "@welshman/signer"
import type {TrustedEvent} from "@welshman/util"
import {Router, addMaximalFallbacks, addMinimalFallbacks} from "@welshman/router"
import {
  Address,
  DELETE,
  FEEDS,
  FOLLOWS,
  MESSAGING_RELAYS,
  PROFILE,
  RELAYS,
  DIRECT_MESSAGE,
  addToListPublicly,
  makeEvent,
  getAddress,
  isSignedEvent,
  makeList,
  uploadBlob,
  makeBlossomAuthEvent,
  normalizeRelayUrl,
  removeFromList,
  getRelaysFromList,
} from "@welshman/util"
import {
  anonymous,
  getClientTags,
  getSetting,
  sign,
  userFeedFavorites,
  withIndexers,
} from "src/engine/state"
import {buildDmPqcEnvelope} from "src/engine/pqc/dm-envelope"
import {recordPqcDmFallback} from "src/engine/pqc/dm-fallback-history"
import {resolveDmSendPolicy} from "src/engine/pqc/dm-send-policy"
import {runDmPayloadSizePreflight} from "src/engine/pqc/dm-size-preflight"
import {ensureOwnPqcKey, resolvePeerPqPublicKey} from "src/engine/pqc/pq-key-lifecycle"
import {enqueue as enqueueOffline} from "src/engine/offline/outbox"
import {registerSendMessage} from "src/engine/offline/queue-drain"
import {stripExifData} from "src/util/html"
import {appDataKeys} from "src/util/nostr"
import {get} from "svelte/store"

// Helpers

export const updateRecord = (record, timestamp, updates) => {
  for (const [field, value] of Object.entries(updates)) {
    const tsField = `${field}_updated_at`
    const lastUpdated = record?.[tsField] || -1

    if (timestamp > lastUpdated) {
      record = {
        ...record,
        [field]: value,
        [tsField]: timestamp,
        updated_at: Math.max(timestamp, record?.updated_at || 0),
      }
    }
  }

  return record
}

export const updateStore = (store, timestamp, updates) =>
  store.set(updateRecord(store.get(), timestamp, updates))

export const nip44EncryptToSelf = (payload: string) =>
  signer.get().nip44.encrypt(pubkey.get(), payload)

// Files

export const uploadFile = async (server: string, file: File, compressorOpts = {}) => {
  if (!file.type.match("image/(webp|gif)")) {
    file = await stripExifData(file, compressorOpts)
  }

  const hashes = [await sha256(await file.arrayBuffer())]
  const $signer = signer.get() || Nip01Signer.ephemeral()
  const authEvent = await $signer.sign(makeBlossomAuthEvent({action: "upload", server, hashes}))
  const res = await uploadBlob(server, file, {authEvent})

  return res.json()
}

// Key state management

export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  const relays = Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()

  return await publishThunk({event, relays})
}

// Deletes

export const publishDeletion = ({kind, address = null, id = null}) => {
  const tags = [["k", String(kind)]]

  if (address) {
    tags.push(["a", address])
  }

  if (id) {
    tags.push(["e", id])
  }

  return publishThunk({
    event: makeEvent(DELETE, {tags}),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}

export const deleteEvent = (event: TrustedEvent) =>
  publishDeletion({id: event.id, address: getAddress(event), kind: event.kind})

export const deleteEventByAddress = (address: string) =>
  publishDeletion({address, kind: Address.from(address).kind})

// Follows

export const unfollow = async (value: string) =>
  signer.get()
    ? baseUnfollow(value)
    : anonymous.update($a => ({...$a, follows: $a.follows.filter(nthNe(1, value))}))

export const follow = async (tag: string[]) =>
  signer.get()
    ? baseFollow(tag)
    : anonymous.update($a => ({...$a, follows: append(tag, $a.follows)}))

// Feed favorites

export const removeFeedFavorite = async (address: string) => {
  const list = get(userFeedFavorites) || makeList({kind: FEEDS})

  return publishThunk({
    event: await removeFromList(list, address).reconcile(nip44EncryptToSelf),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}

export const addFeedFavorite = async (address: string) => {
  const list = get(userFeedFavorites) || makeList({kind: FEEDS})

  return publishThunk({
    event: await addToListPublicly(list, ["a", address]).reconcile(nip44EncryptToSelf),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}

// Relays

export const requestRelayAccess = async (url: string, claim: string) =>
  publishThunk({event: makeEvent(28934, {tags: [["claim", claim]]}), relays: [url]})

export const setOutboxPolicies = async (modifyTags: (tags: string[][]) => string[][]) => {
  if (signer.get()) {
    const list = get(userRelayList) || makeList({kind: RELAYS})

    publishThunk({
      event: makeEvent(list.kind, {
        content: list.event?.content || "",
        tags: modifyTags(list.publicTags),
      }),
      relays: withIndexers(Router.get().FromUser().policy(addMaximalFallbacks).getUrls()),
    })
  } else {
    anonymous.update($a => ({...$a, relays: modifyTags($a.relays)}))
  }
}

export const setMessagingPolicies = async (modifyTags: (tags: string[][]) => string[][]) => {
  const list = get(userMessagingRelayList) || makeList({kind: MESSAGING_RELAYS})

  publishThunk({
    event: makeEvent(list.kind, {
      content: list.event?.content || "",
      tags: modifyTags(list.publicTags),
    }),
    relays: withIndexers(Router.get().FromUser().policy(addMaximalFallbacks).getUrls()),
  })
}

export const setMessagingPolicy = (url: string, enabled: boolean) => {
  const urls = getRelaysFromList(get(userMessagingRelayList))

  // Only update messaging policies if they already exist or we're adding them
  if (enabled || urls.includes(url)) {
    setMessagingPolicies($tags => {
      $tags = $tags.filter(t => normalizeRelayUrl(t[1]) !== url)

      if (enabled) {
        $tags.push(["relay", url])
      }

      return $tags
    })
  }
}

export const setOutboxPolicy = (url: string, read: boolean, write: boolean) =>
  setOutboxPolicies($tags => {
    $tags = $tags.filter(t => normalizeRelayUrl(t[1]) !== url)

    if (read && write) {
      $tags.push(["r", url])
    } else if (read) {
      $tags.push(["r", url, "read"])
    } else if (write) {
      $tags.push(["r", url, "write"])
    }

    return $tags
  })

export const leaveRelay = async (url: string) => {
  await Promise.all([setMessagingPolicy(url, false), setOutboxPolicy(url, false, false)])

  // Make sure the new relay selections get to the old relay
  if (pubkey.get()) {
    broadcastUserData([url])
  }
}

export const joinRelay = async (url: string, claim?: string) => {
  url = normalizeRelayUrl(url)

  if (claim && signer.get()) {
    await requestRelayAccess(url, claim)
  }

  await setOutboxPolicy(url, true, true)

  // Re-publish user meta to the new relay
  if (pubkey.get()) {
    broadcastUserData([url])
  }
}

// Messages

// Flag to prevent queue-drain re-sends from being re-queued
let _sendingFromQueue = false

export const sendMessage = async (channelId: string, content: string, delay: number) => {
  // If offline and not draining the queue, enqueue for later
  if (!_sendingFromQueue && typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueueOffline(channelId, content)
    return
  }

  const senderPubkey = pubkey.get()
  const recipients = uniq(channelId.split(",").concat(senderPubkey))
  const dmRecipients = remove(senderPubkey, recipients)

  const policyMode = getSetting("pqc_dm_policy_mode") === "strict" ? "strict" : "compatibility"
  const preferredHybridAlg = getSetting("pqc_dm_preferred_hybrid_alg")
  const configuredLocalAlgs = getSetting("pqc_dm_local_supported_algs")
  const localSupportedAlgs = Array.isArray(configuredLocalAlgs)
    ? configuredLocalAlgs
    : ["hybrid-mlkem768+x25519-aead-v1"]

  const preflight = resolveDmSendPolicy({
    recipients: dmRecipients,
    policyMode,
    preferredHybridAlg,
    localSupportedAlgs,
    allowClassicalFallback: getSetting("pqc_dm_allow_fallback") !== false,
  })

  if (preflight.allowed === false) {
    throw new Error(
      `DM send blocked by PQC policy: ${preflight.blockReason || "DM_POLICY_BLOCKED"}`,
    )
  }

  const fallbackReason = preflight.recipientDecisions.find(
    decision => decision.negotiation.mode === "classical",
  )?.telemetryReason

  let nextContent = content
  const extraTags: string[][] = []

  if (getSetting("pqc_dm_enabled") === true) {
    const envelopeMode = preflight.mode === "hybrid" ? "hybrid" : "classical"

    // Ensure our own PQ key is published so peers can reply with PQC
    await ensureOwnPqcKey()

    // Resolve each recipient's PQ public key
    const recipientPqPublicKeys = new Map<string, Uint8Array>()
    if (envelopeMode === "hybrid") {
      const resolutions = await Promise.all(
        dmRecipients.map(async r => {
          const pk = await resolvePeerPqPublicKey(r)
          return [r, pk] as const
        }),
      )
      for (const [r, pk] of resolutions) {
        if (pk) recipientPqPublicKeys.set(r, pk)
      }
    }

    const envelope = await buildDmPqcEnvelope({
      plaintext: content,
      senderPubkey,
      recipients: dmRecipients,
      mode: envelopeMode,
      algorithm: envelopeMode === "hybrid" ? preferredHybridAlg : "classical-x25519-aead-v1",
      recipientPqPublicKeys,
      fallbackReasonCode: fallbackReason,
    })

    if (envelope.ok === false) {
      if (policyMode === "strict") {
        throw new Error(`DM send blocked by PQC envelope encode failure: ${envelope.reason}`)
      }

      extraTags.push(["pqc", "encode-fallback"])
      extraTags.push(["pqc_reason", envelope.reason])

      if (getSetting("pqc_dm_enable_fallback_history") !== false) {
        recordPqcDmFallback({
          direction: "send",
          mode: "encode-fallback",
          reason: envelope.reason,
          timestamp: Math.floor(Date.now() / 1000),
          peerPubkey: dmRecipients.length === 1 ? dmRecipients[0] : "multi-recipient",
        })
      }
    } else {
      const sizePreflight = runDmPayloadSizePreflight({
        content: envelope.content,
        maxBytes: Number(getSetting("pqc_dm_max_payload_bytes") || 4096),
        policyMode,
        allowClassicalFallback: getSetting("pqc_dm_allow_fallback") !== false,
      })

      if (!sizePreflight.allowed) {
        throw new Error(`DM send blocked by PQC payload preflight: ${sizePreflight.reason}`)
      }

      if (sizePreflight.shouldFallback) {
        nextContent = content
        extraTags.push(["pqc", "size-fallback"])
        extraTags.push(["pqc_reason", sizePreflight.reason])

        if (getSetting("pqc_dm_enable_fallback_history") !== false) {
          recordPqcDmFallback({
            direction: "send",
            mode: "size-fallback",
            reason: sizePreflight.reason,
            timestamp: Math.floor(Date.now() / 1000),
            peerPubkey: dmRecipients.length === 1 ? dmRecipients[0] : "multi-recipient",
          })
        }
      } else {
        nextContent = envelope.content
        extraTags.push(["pqc", preflight.mode])
        extraTags.push([
          "pqc_alg",
          preflight.mode === "hybrid" ? preferredHybridAlg : "classical-x25519-aead-v1",
        ])

        if (preflight.mode === "classical" && fallbackReason) {
          extraTags.push(["pqc_reason", fallbackReason])
        }

        if (
          preflight.mode === "classical" &&
          getSetting("pqc_dm_enable_fallback_history") !== false
        ) {
          recordPqcDmFallback({
            direction: "send",
            mode: "classical-fallback",
            reason: fallbackReason || "DM_POLICY_FALLBACK",
            timestamp: Math.floor(Date.now() / 1000),
            peerPubkey: dmRecipients.length === 1 ? dmRecipients[0] : "multi-recipient",
          })
        }
      }
    }
  }

  return sendWrapped({
    delay,
    recipients,
    event: makeEvent(DIRECT_MESSAGE, {
      content: nextContent,
      tags: [...remove(pubkey.get(), recipients).map(tagPubkey), ...extraTags, ...getClientTags()],
    }),
  })
}

// Settings

export const setAppData = async (d: string, data: any) => {
  if (signer.get()) {
    const {pubkey} = session.get()
    const content = await signer.get().nip04.encrypt(pubkey, JSON.stringify(data))

    return publishThunk({
      event: makeEvent(30078, {tags: [["d", d]], content}),
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    })
  }
}

export const publishSettings = ($settings: Record<string, any>) =>
  setAppData(appDataKeys.USER_SETTINGS, $settings)

export const broadcastUserRelays = async (relays: string[]) => {
  const authors = [pubkey.get()]
  const kinds = [RELAYS]
  const events = repository.query([{kinds, authors}])

  for (const event of events) {
    if (isSignedEvent(event)) {
      await publishThunk({event, relays})
    }
  }
}

export const broadcastUserData = async (relays: string[]) => {
  const authors = [pubkey.get()]
  const kinds = [RELAYS, MESSAGING_RELAYS, FOLLOWS, PROFILE]
  const events = repository.query([{kinds, authors}])

  for (const event of events) {
    if (isSignedEvent(event)) {
      await publishThunk({event, relays})
    }
  }
}

// Lightning

export const getWebLn = () => (window as any).webln

export const payInvoice = async (invoice: string) => {
  const {wallet} = session.get()

  if (!wallet) {
    return alert(invoice)
  }

  if (wallet.type === "nwc") {
    return new nwc.NWCClient(wallet.info).payInvoice({invoice})
  } else if (wallet.type === "webln") {
    return getWebLn()
      .enable()
      .then(() => getWebLn().sendPayment(invoice))
  }
}

// Register sendMessage for offline queue drain (wrapper prevents re-queuing)
registerSendMessage(async (channelId, content, delay) => {
  _sendingFromQueue = true
  try {
    return await sendMessage(channelId, content, delay)
  } finally {
    _sendingFromQueue = false
  }
})
