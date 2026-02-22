import {
  displayProfileByPubkey,
  followListsByPubkey,
  getMaxWot,
  getNetwork,
  getUserWotScore,
  profilesByPubkey,
  pubkey,
  repository,
  tracker,
  userMuteList,
  userPinList,
} from "@welshman/app"
import {cached, max, sort, sortBy, tryCatch, uniq, on, remove, call} from "@welshman/lib"
import {deriveEvents, localStorageProvider, synced, withGetter} from "@welshman/store"
import {LOCAL_RELAY_URL} from "@welshman/net"
import type {TrustedEvent, HashedEvent} from "@welshman/util"
import {
  DIRECT_MESSAGE,
  FOLLOWS,
  getAncestors,
  getIdAndAddress,
  getListTags,
  getPubkeyTagValues,
  getTag,
  getTagValues,
  makeList,
} from "@welshman/util"
import {getPow} from "nostr-tools/nip13"
import type {Channel} from "src/engine/model"
import {derived, readable} from "svelte/store"

export const createStateSocial = ({
  anonymous,
  getSetting,
  userSettings,
}: {
  anonymous: any
  getSetting: any
  userSettings: any
}) => {
  const getMinWot = () => getSetting("min_wot_score") / getMaxWot()

  const userFollowList = derived([followListsByPubkey, pubkey, anonymous], ([$m, $pk, $anon]) => {
    const anonState = ($anon || {}) as {follows?: string[][]}

    return $pk ? $m.get($pk) : makeList({kind: FOLLOWS, publicTags: anonState.follows || []})
  })

  const userFollows = withGetter(
    derived(userFollowList, l => new Set(getPubkeyTagValues(getListTags(l)))),
  )

  const userNetwork = derived(userFollowList, l => getNetwork(l.event.pubkey))

  const userMutedPubkeys = derived(userMuteList, l => new Set(getTagValues("p", getListTags(l))))

  const userMutedEvents = derived(
    userMuteList,
    l => new Set(getTagValues(["a", "e"], getListTags(l))),
  )

  const userMutedWords = derived(userMuteList, l => new Set(getTagValues("word", getListTags(l))))

  const userMutedTopics = derived(userMuteList, l => new Set(getTagValues("t", getListTags(l))))

  const userPins = derived(userPinList, l => new Set(getTagValues(["e"], getListTags(l))))

  const isEventMuted = withGetter(
    derived(
      [
        userMutedEvents,
        userMutedPubkeys,
        userMutedWords,
        userMutedTopics,
        userFollows,
        userSettings,
        profilesByPubkey,
        pubkey,
      ],
      ([
        $userMutedEvents,
        $userMutedPubkeys,
        $userMutedWords,
        $userMutedTopics,
        $userFollows,
        $userSettings,
        $profilesByPubkey,
        $pubkey,
      ]) => {
        const settings = ($userSettings || {}) as {
          muted_words?: string[]
          min_wot_score?: number
          min_pow_difficulty?: number
        }
        const words = [...(settings.muted_words || []), ...$userMutedWords]
        const minWot = settings.min_wot_score || 0
        const minPow = settings.min_pow_difficulty || 0
        const regex =
          words.length > 0
            ? new RegExp(`\\b(${words.map(w => w.toLowerCase().trim()).join("|")})\\b`)
            : null

        return cached({
          maxSize: 5000,
          getKey: ([e, strict = false]: [e: HashedEvent, strict?: boolean]) => `${e.id}:${strict}`,
          getValue: ([e, strict = false]: [e: HashedEvent, strict?: boolean]) => {
            if (!$pubkey || !e.pubkey || $pubkey === e.pubkey) return false

            if ($userMutedPubkeys.has(e.pubkey)) {
              return true
            }

            const {roots, replies} = getAncestors(e)

            if ([...getIdAndAddress(e), ...roots, ...replies].some(x => $userMutedEvents.has(x))) {
              return true
            }

            if (getTagValues("t", e.tags).some(t => $userMutedTopics.has(t))) {
              return true
            }

            if (regex) {
              if (e.content?.toLowerCase().match(regex)) return true
              if (displayProfileByPubkey(e.pubkey).toLowerCase().match(regex)) return true
              if (tryCatch(() => $profilesByPubkey.get(e.pubkey)?.nip05?.match(regex))) return true
            }

            if (strict || $userFollows.has(e.pubkey)) return false

            const wotScore = getUserWotScore(e.pubkey)
            const okWot = wotScore >= minWot
            const powDifficulty = Number(getTag("nonce", e.tags)?.[2] || "0")
            const isValidPow = getPow(e.id) >= powDifficulty
            const okPow = isValidPow && powDifficulty > minPow

            return !okWot && !okPow
          },
        })
      },
    ),
  )

  const checked = synced<Record<string, number>>({
    key: "checked",
    defaultValue: {},
    storage: localStorageProvider,
  })

  const deriveChecked = (key: string) => derived(checked, $checked => $checked[key])

  const getSeenAt = derived([checked], ([$checked]) => (path: string, event: TrustedEvent) => {
    const ts = max([$checked[path], $checked[path.split("/")[0] + "/*"], $checked["*"]])

    if (ts >= event.created_at) return ts

    return 0
  })

  const getChannelId = (pubkeys: string[]) => sort(uniq(pubkeys)).join(",")

  const getChannelIdFromEvent = (event: TrustedEvent) =>
    getChannelId([event.pubkey, ...getPubkeyTagValues(event.tags)])

  const messages = deriveEvents({repository, filters: [{kinds: [4, DIRECT_MESSAGE]}]})

  const channels = derived([pubkey, messages, getSeenAt], ([$pubkey, $messages, $getSeenAt]) => {
    const channelsById: Record<string, Channel> = {}

    for (const e of $messages) {
      const id = getChannelIdFromEvent(e)

      if (!id.includes($pubkey)) {
        continue
      }

      const chan = channelsById[id] || {
        id,
        last_sent: 0,
        last_received: 0,
        last_checked: 0,
        messages: [],
      }

      chan.messages.push(e)
      chan.last_checked = Math.max(chan.last_checked, $getSeenAt("channels/" + id, e))

      if (e.pubkey === $pubkey) {
        chan.last_sent = Math.max(chan.last_sent, e.created_at)
      } else {
        chan.last_received = Math.max(chan.last_received, e.created_at)
      }

      channelsById[id] = chan
    }

    return sortBy(c => -Math.max(c.last_sent, c.last_received), Object.values(channelsById))
  })

  const channelHasNewMessages = (channel: Channel) =>
    channel.last_received > Math.max(channel.last_sent, channel.last_checked)

  const hasNewMessages = derived(channels, $channels => $channels.some(channelHasNewMessages))

  const deriveRelaysForEvent = (event: TrustedEvent) => {
    const urls = new Set(remove(LOCAL_RELAY_URL, Array.from(tracker.getRelays(event.id))))

    return readable(urls, set => {
      const unsubscribers = [
        on(tracker, "add", (id: string, url: string) => {
          if (id === event.id && url !== LOCAL_RELAY_URL) {
            urls.add(url)
            set(urls)
          }
        }),
        on(tracker, "remove", (id: string, url: string) => {
          if (id === event.id && url !== LOCAL_RELAY_URL) {
            urls.delete(url)
            set(urls)
          }
        }),
      ]

      return () => unsubscribers.forEach(call)
    })
  }

  return {
    getMinWot,
    userFollowList,
    userFollows,
    userNetwork,
    userMutedPubkeys,
    userMutedEvents,
    userMutedWords,
    userMutedTopics,
    userPins,
    isEventMuted,
    checked,
    deriveChecked,
    getSeenAt,
    getChannelId,
    getChannelIdFromEvent,
    messages,
    channels,
    channelHasNewMessages,
    hasNewMessages,
    deriveRelaysForEvent,
  }
}
