import {
  displayProfileByPubkey,
  ensurePlaintext,
  followListsByPubkey,
  profilesByPubkey,
  getNetwork,
  getPlaintext,
  getSession,
  getSigner,
  getUserWotScore,
  loadRelay,
  getMaxWot,
  userMuteList,
  plaintext,
  userPinList,
  sessions,
  pubkey,
  repository,
  session,
  setPlaintext,
  signer,
  tracker,
  appContext,
  wrapManager,
  shouldUnwrap,
  getFollows,
} from "@welshman/app"
import {makeAuthorFeed, makeScopeFeed, Scope} from "@welshman/feeds"
import {
  TaskQueue,
  groupBy,
  identity,
  now,
  pushToMapKey,
  simpleCache,
  cached,
  sort,
  uniq,
  prop,
  sortBy,
  max,
  always,
  tryCatch,
  first,
} from "@welshman/lib"
import {routerContext} from "@welshman/router"
import type {Socket, RequestOptions} from "@welshman/net"
import {
  SocketEvent,
  Pool,
  load,
  request,
  makeSocketPolicyAuth,
  defaultSocketPolicies,
  LOCAL_RELAY_URL,
} from "@welshman/net"
import {Nip01Signer} from "@welshman/signer"
import {
  deriveEvents,
  deriveItemsByKey,
  deriveItems,
  synced,
  localStorageProvider,
  withGetter,
  sync,
} from "@welshman/store"
import type {
  EventTemplate,
  PublishedList,
  SignedEvent,
  TrustedEvent,
  HashedEvent,
  StampedEvent,
} from "@welshman/util"
import {
  APP_DATA,
  DIRECT_MESSAGE,
  FEED,
  FEEDS,
  FOLLOWS,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
  LABEL,
  MUTES,
  NAMED_BOOKMARKS,
  asDecryptedEvent,
  getAddress,
  getAddressTagValues,
  getIdentifier,
  getListTags,
  getPubkeyTagValues,
  getTagValue,
  getTagValues,
  makeList,
  normalizeRelayUrl,
  readList,
  getAncestors,
  getTag,
  getIdAndAddress,
  getIdFilters,
} from "@welshman/util"
import Fuse from "fuse.js"
import {getPow} from "nostr-tools/nip13"
import type {PublishedFeed, PublishedListFeed, PublishedUserList} from "src/domain"
import {
  CollectionSearch,
  EDITABLE_LIST_KINDS,
  UserListSearch,
  displayFeed,
  getHandlerAddress,
  mapListToFeed,
  readCollections,
  readFeed,
  readHandlers,
  readUserList,
  subscriptionNotices,
  makeFeed,
  normalizeFeedDefinition,
} from "src/domain"
import type {AnonymousUserState, Channel, SessionWithMeta} from "src/engine/model"
import {
  RelaysStorageAdapter,
  HandlesStorageAdapter,
  ZappersStorageAdapter,
  PlaintextStorageAdapter,
  TrackerStorageAdapter,
  WrapManagerStorageAdapter,
  EventsStorageAdapter,
  rankEventByRetentionClass,
  initStorage,
} from "src/engine/storage"
import {SearchHelper, fromCsv, parseJson, ensureProto} from "src/util/misc"
import {appDataKeys, noteKinds, reactionKinds, metaKinds} from "src/util/nostr"
import {createStateSocial} from "src/engine/state-social"
import {createStateContent} from "src/engine/state-content"
import {createStateStorageInit} from "src/engine/state-storage-init"
import {resolveMessagePlaintext} from "src/engine/state-message-plaintext"
import {readable, derived, writable} from "svelte/store"

export const env = {
  CLIENT_ID: import.meta.env.VITE_CLIENT_ID as string,
  CLIENT_NAME: import.meta.env.VITE_CLIENT_NAME as string,
  DEFAULT_TOPICS: fromCsv(import.meta.env.VITE_DEFAULT_TOPICS) as string[],
  OPS_TAG: (import.meta.env.VITE_OPS_TAG as string) || "starcom_ops",
  INTEL_TAG: (import.meta.env.VITE_INTEL_TAG as string) || "starcom_intel",
  DEFAULT_FOLLOWS: fromCsv(import.meta.env.VITE_DEFAULT_FOLLOWS) as string[],
  DEFAULT_RELAYS: fromCsv(import.meta.env.VITE_DEFAULT_RELAYS).map(normalizeRelayUrl) as string[],
  INDEXER_RELAYS: fromCsv(import.meta.env.VITE_INDEXER_RELAYS).map(normalizeRelayUrl) as string[],
  DUFFLEPUD_URL: import.meta.env.VITE_DUFFLEPUD_URL as string,
  DVM_RELAYS: fromCsv(import.meta.env.VITE_DVM_RELAYS).map(normalizeRelayUrl) as string[],
  ENABLE_MARKET: JSON.parse(import.meta.env.VITE_ENABLE_MARKET) as boolean,
  ENABLE_ZAPS: JSON.parse(import.meta.env.VITE_ENABLE_ZAPS) as boolean,
  ENABLE_GUIDED_SIGNUP: JSON.parse(import.meta.env.VITE_ENABLE_GUIDED_SIGNUP ?? "true") as boolean,
  ENABLE_GUIDED_SIGNUP_SHADOW: JSON.parse(
    import.meta.env.VITE_ENABLE_GUIDED_SIGNUP_SHADOW ?? "false",
  ) as boolean,
  ENABLE_SECURE_GROUP_PILOT: JSON.parse(
    import.meta.env.VITE_ENABLE_SECURE_GROUP_PILOT ?? "true",
  ) as boolean,
  DISABLE_SECURE_GROUP_PILOT: JSON.parse(
    import.meta.env.VITE_DISABLE_SECURE_GROUP_PILOT ?? "false",
  ) as boolean,
  BLUR_CONTENT: JSON.parse(import.meta.env.VITE_BLUR_CONTENT) as boolean,
  BLOSSOM_URLS: fromCsv(import.meta.env.VITE_BLOSSOM_URLS) as string[],
  ONBOARDING_LISTS: fromCsv(import.meta.env.VITE_ONBOARDING_LISTS) as string[],
  PLATFORM_PUBKEY: import.meta.env.VITE_PLATFORM_PUBKEY as string,
  DEFAULT_CHANNEL: import.meta.env.VITE_DEFAULT_CHANNEL as string,
  PLATFORM_ZAP_SPLIT: parseFloat(import.meta.env.VITE_PLATFORM_ZAP_SPLIT) as number,
  SEARCH_RELAYS: fromCsv(import.meta.env.VITE_SEARCH_RELAYS).map(normalizeRelayUrl) as string[],
  SIGNER_RELAYS: fromCsv(import.meta.env.VITE_SIGNER_RELAYS).map(normalizeRelayUrl) as string[],
  APP_URL: import.meta.env.VITE_APP_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME,
  APP_LOGO: import.meta.env.VITE_APP_LOGO,
}

export const sessionWithMeta = withGetter(derived(session, $s => $s as SessionWithMeta))

export const hasNip44 = derived(signer, $signer => Boolean($signer?.nip44))

export const anonymous = withGetter(writable<AnonymousUserState>({follows: [], relays: []}))

// Plaintext

export const ensureMessagePlaintext = async (e: TrustedEvent) => {
  if (!e.content) return undefined
  if (!getPlaintext(e)) {
    const recipient = getTagValue("p", e.tags)
    const session = getSession(e.pubkey) || getSession(recipient)
    const other = e.pubkey === session?.pubkey ? recipient : e.pubkey
    const signer = getSigner(session)

    if (signer) {
      const result = await signer.nip04.decrypt(other, e.content)

      if (result) {
        setPlaintext(
          e,
          resolveMessagePlaintext({
            event: e,
            decryptedContent: result,
            policyMode: getSetting("pqc_dm_policy_mode") === "strict" ? "strict" : "compatibility",
            allowLegacyFallback: getSetting("pqc_dm_allow_fallback") !== false,
            enableFallbackHistory: getSetting("pqc_dm_enable_fallback_history") !== false,
            localPubkey: session?.pubkey,
          }),
        )
      }
    }
  }

  return getPlaintext(e)
}

// Decrypt stuff as it comes in

const decrypter = new TaskQueue<TrustedEvent>({
  batchSize: 10,
  processItem: ensurePlaintext,
})

const decryptKinds = [APP_DATA, FOLLOWS, MUTES]

repository.on("update", ({added}: {added: TrustedEvent[]}) => {
  for (const event of added) {
    if (decryptKinds.includes(event.kind)) {
      decrypter.push(event)
    }
  }
})

// Settings

export const defaultSettings = {
  relay_limit: 3,
  default_zap: 21,
  show_media: true,
  send_delay: 0, // undo send delay in ms
  pow_difficulty: 0,
  muted_words: [], // Deprecated
  hide_sensitive: true,
  report_analytics: true,
  min_wot_score: 0,
  min_pow_difficulty: 0,
  enable_client_tag: false,
  auto_authenticate2: true,
  note_actions: ["zaps", "replies", "reactions", "recommended_apps"],
  upload_type: "blossom",
  pqc_dm_enabled: false,
  pqc_dm_policy_mode: "compatibility",
  pqc_dm_allow_fallback: true,
  pqc_dm_enable_fallback_history: true,
  pqc_dm_max_payload_bytes: 4096,
  pqc_dm_preferred_hybrid_alg: "hybrid-mlkem768+x25519-aead-v1",
  pqc_dm_local_supported_algs: ["hybrid-mlkem768+x25519-aead-v1"],
  imgproxy_url: "",
  dufflepud_url: env.DUFFLEPUD_URL,
  platform_zap_split: env.PLATFORM_ZAP_SPLIT,
}

export const settingsEvents = deriveEvents({repository, filters: [{kinds: [APP_DATA]}]})

export const userSettingsEvent = derived([pubkey, settingsEvents], ([$pubkey, $settingsEvents]) =>
  $settingsEvents.find(e => e.pubkey === $pubkey && getIdentifier(e) === appDataKeys.USER_SETTINGS),
)

export const userSettingsPlaintext = derived(
  [plaintext, userSettingsEvent],
  ([$plaintext, $userSettingsEvent]) => $plaintext[$userSettingsEvent?.id],
)

export const userSettings = withGetter<typeof defaultSettings>(
  derived(userSettingsPlaintext, $userSettingsPlaintext => {
    const overrides = parseJson($userSettingsPlaintext) || {}

    return {...defaultSettings, ...overrides}
  }),
)

export function getSetting<T = any>(k: string): T {
  return userSettings.get()[k] as T
}

export const imgproxy = (url: string, {w = 640, h = 1024} = {}) => {
  const base = getSetting("imgproxy_url")

  if (!base || !url || url.match("gif$")) {
    return url
  }

  url = url.split("?")[0]

  try {
    return base && url ? `${ensureProto(base)}/x/s:${w}:${h}/${btoa(url)}` : url
  } catch (e) {
    return url
  }
}

export const dufflepud = (path: string) => {
  const base = getSetting("dufflepud_url")

  if (!base) {
    throw new Error("Dufflepud is not enabled")
  }

  return `${base}/${path}`
}

const socialState = createStateSocial({
  anonymous,
  getSetting,
  userSettings,
})

export const getMinWot = socialState.getMinWot
export const userFollowList = socialState.userFollowList
export const userFollows = socialState.userFollows
export const userNetwork = socialState.userNetwork
export const userMutedPubkeys = socialState.userMutedPubkeys
export const userMutedEvents = socialState.userMutedEvents
export const userMutedWords = socialState.userMutedWords
export const userMutedTopics = socialState.userMutedTopics
export const userPins = socialState.userPins
export const isEventMuted = socialState.isEventMuted
export const checked = socialState.checked
export const deriveChecked = socialState.deriveChecked
export const getSeenAt = socialState.getSeenAt
export const getChannelId = socialState.getChannelId
export const getChannelIdFromEvent = socialState.getChannelIdFromEvent
export const messages = socialState.messages
export const channels = socialState.channels
export const channelHasNewMessages = socialState.channelHasNewMessages
export const hasNewMessages = socialState.hasNewMessages
export const deriveRelaysForEvent = socialState.deriveRelaysForEvent

export const forceRelays = (relays: string[], forceRelays: string[]) =>
  forceRelays.length > 0 ? forceRelays : relays

export const withRelays = (relays: string[], otherRelays: string[]) =>
  uniq([...relays, ...otherRelays])

export const withIndexers = (relays: string[]) => withRelays(relays, env.INDEXER_RELAYS)

// Network

export type MyRequestOptions = RequestOptions & {
  skipCache?: boolean
}

export const myRequest = ({skipCache, ...options}: MyRequestOptions) => {
  if (!skipCache) {
    options.relays = [...options.relays, LOCAL_RELAY_URL]
  }

  return request(options)
}

export const myLoad = ({skipCache, ...options}: MyRequestOptions) => {
  if (!skipCache) {
    options.relays = [...options.relays, LOCAL_RELAY_URL]
  }

  return load(options)
}

const contentState = createStateContent({env, userFollows, myLoad})

export const listsById = contentState.listsById
export const lists = contentState.lists
export const userLists = contentState.userLists
export const listSearch = contentState.listSearch
export const feedsById = contentState.feedsById
export const feeds = contentState.feeds
export const userFeeds = contentState.userFeeds
export const defaultFeed = contentState.defaultFeed
export const feedFavoriteEvents = contentState.feedFavoriteEvents
export const feedFavorites = contentState.feedFavorites
export const feedFavoritesByAddress = contentState.feedFavoritesByAddress
export const userFeedFavorites = contentState.userFeedFavorites
export const userFavoritedFeeds = contentState.userFavoritedFeeds
export const feedSearch = contentState.feedSearch
export const listFeedsById = contentState.listFeedsById
export const listFeeds = contentState.listFeeds
export const userListFeeds = contentState.userListFeeds
export const handlers = contentState.handlers
export const handlersByKind = contentState.handlersByKind
export const recommendations = contentState.recommendations
export const deriveRecommendations = contentState.deriveRecommendations
export const deriveHandlersForKind = contentState.deriveHandlersForKind
export const deriveHandlerEvent = contentState.deriveHandlerEvent
export const collections = contentState.collections
export const deriveCollections = contentState.deriveCollections
export const collectionSearch = contentState.collectionSearch

export const sign = (
  template,
  opts: {anonymous?: boolean; sk?: string} = {},
): Promise<SignedEvent> => {
  if (opts.anonymous) {
    return Nip01Signer.ephemeral().sign(template)
  }

  if (opts.sk) {
    return Nip01Signer.fromSecret(opts.sk).sign(template)
  }

  return signer.get().sign(template)
}

export const getClientTags = () => {
  if (!getSetting("enable_client_tag")) {
    return []
  }

  const {CLIENT_NAME = "", CLIENT_ID} = env
  const tag = ["client", CLIENT_NAME]

  if (CLIENT_ID) {
    tag.push(CLIENT_ID)
  }

  return [tag]
}

export const addClientTags = <T extends Partial<EventTemplate>>({tags = [], ...event}: T) => ({
  ...event,
  tags: tags.filter(t => t[0] !== "client").concat(getClientTags()),
})

// Storage

const {ready} = createStateStorageInit({
  env,
  signer,
  appContext,
  routerContext,
  pubkey,
  sessions,
  shouldUnwrap,
  userSettings,
  getSetting,
  loadRelay,
  defaultSocketPolicies,
  subscriptionNotices,
  initStorage,
  adapters: {
    relays: new RelaysStorageAdapter({name: "relays"}),
    handles: new HandlesStorageAdapter({name: "handles"}),
    zappers: new ZappersStorageAdapter({name: "zappers"}),
    plaintext: new PlaintextStorageAdapter({name: "plaintext"}),
    tracker: new TrackerStorageAdapter({name: "tracker", tracker}),
    wraps: new WrapManagerStorageAdapter({name: "wraps", wrapManager}),
    events: new EventsStorageAdapter({
      repository,
      name: "events",
      limit: 10_000,
      rankEvent: (e: TrustedEvent) => {
        const $sessions = sessions.get()
        const follows = userFollows.get() || new Set<string>()
        const isSessionRelated = Boolean($sessions[e.pubkey] || e.tags.some(t => $sessions[t[1]]))
        const isIntel = e.tags.some(t => t[0] === "t" && t[1] === env.INTEL_TAG)
        const isClassA = isSessionRelated || isIntel || noteKinds.includes(e.kind)
        const isClassB =
          reactionKinds.includes(e.kind) || (metaKinds.includes(e.kind) && follows.has(e.pubkey))
        const isClassC = follows.has(e.pubkey)

        if (isClassA) return rankEventByRetentionClass(e, "high")
        if (isClassB) return rankEventByRetentionClass(e, "medium")
        if (isClassC) return rankEventByRetentionClass(e, "low")

        return rankEventByRetentionClass(e, "drop")
      },
    }),
  },
})

export {ready}
