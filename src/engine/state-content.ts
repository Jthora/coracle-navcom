import {
  asDecryptedEvent,
  FEED,
  FEEDS,
  getAddress,
  getAddressTagValues,
  getIdFilters,
  getIdentifier,
  getListTags,
  getTagValues,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
  LABEL,
  NAMED_BOOKMARKS,
  readList,
} from "@welshman/util"
import {deriveEvents, deriveItems, deriveItemsByKey, withGetter} from "@welshman/store"
import {derived} from "svelte/store"
import {repository, pubkey, plaintext, getFollows} from "@welshman/app"
import {groupBy, first, identity, pushToMapKey, simpleCache, sortBy} from "@welshman/lib"
import Fuse from "fuse.js"
import type {PublishedFeed, PublishedListFeed, PublishedList, PublishedUserList} from "src/domain"
import {
  CollectionSearch,
  EDITABLE_LIST_KINDS,
  UserListSearch,
  displayFeed,
  getHandlerAddress,
  makeFeed,
  mapListToFeed,
  normalizeFeedDefinition,
  readCollections,
  readFeed,
  readHandlers,
  readUserList,
} from "src/domain"
import {makeAuthorFeed, makeScopeFeed, Scope} from "@welshman/feeds"
import {SearchHelper} from "src/util/misc"

export const createStateContent = ({
  env,
  userFollows,
  myLoad,
}: {
  env: any
  userFollows: any
  myLoad: any
}) => {
  const listsById = deriveItemsByKey({
    repository,
    getKey: list => list.event.id,
    filters: [{kinds: EDITABLE_LIST_KINDS}],
    eventToItem: event => (event.tags.length > 1 ? readUserList(event) : null),
  })

  const lists = deriveItems(listsById)

  const userLists = derived([lists, pubkey], ([$lists, $pubkey]: [PublishedUserList[], string]) =>
    sortBy(
      l => l.title.toLowerCase(),
      $lists.filter(list => list.event.pubkey === $pubkey),
    ),
  )

  const listSearch = derived(lists, $lists => new UserListSearch($lists))

  const feedsById = deriveItemsByKey({
    repository,
    getKey: feed => feed.event.id,
    filters: [{kinds: [FEED]}],
    eventToItem: readFeed,
  })

  const feeds = deriveItems(feedsById)

  const userFeeds = derived([feeds, pubkey], ([$feeds, $pubkey]: [PublishedFeed[], string]) =>
    $feeds.filter(feed => feed.event.pubkey === $pubkey),
  )

  const defaultFeed = derived([userFollows, userFeeds], ([$userFollows, $userFeeds]) => {
    let definition
    if ($userFollows?.size > 0) {
      definition = makeScopeFeed(Scope.Follows)
    } else {
      definition = makeAuthorFeed(...env.DEFAULT_FOLLOWS)
    }

    return makeFeed({definition: normalizeFeedDefinition(definition)})
  })

  const feedFavoriteEvents = deriveEvents({repository, filters: [{kinds: [FEEDS]}]})

  const feedFavorites = derived(
    [plaintext, feedFavoriteEvents],
    ([$plaintext, $feedFavoriteEvents]) =>
      $feedFavoriteEvents.map(event =>
        readList(
          asDecryptedEvent(event, {
            content: $plaintext[event.id],
          }),
        ),
      ),
  )

  const feedFavoritesByAddress = withGetter(
    derived(feedFavorites, $feedFavorites => {
      const $feedFavoritesByAddress = new Map<string, PublishedList[]>()

      for (const list of $feedFavorites) {
        for (const address of getAddressTagValues(getListTags(list))) {
          pushToMapKey($feedFavoritesByAddress, address, list)
        }
      }

      return $feedFavoritesByAddress
    }),
  )

  const userFeedFavorites = derived(
    [feedFavorites, pubkey],
    ([$lists, $pubkey]: [PublishedList[], string]) =>
      $lists.find(list => list.event.pubkey === $pubkey),
  )

  const userFavoritedFeeds = derived(userFeedFavorites, $list =>
    getAddressTagValues(getListTags($list)).map(repository.getEvent).filter(identity).map(readFeed),
  )

  class FeedSearch extends SearchHelper<PublishedFeed, string> {
    getSearch = () => {
      const $feedFavoritesByAddress = feedFavoritesByAddress.get()
      const getScore = feed => $feedFavoritesByAddress.get(getAddress(feed.event))?.length || 0
      const options = this.options.map(feed => ({feed, score: getScore(feed)}))
      const fuse = new Fuse(options, {
        keys: ["feed.title", "feed.description"],
        shouldSort: false,
        includeScore: true,
      })

      return (term: string) => {
        if (!term) {
          return sortBy(item => -item.score, options).map(item => item.feed)
        }

        return sortBy(
          (r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100),
          fuse.search(term),
        ).map((r: any) => r.item.feed)
      }
    }

    getValue = (option: PublishedFeed) => getAddress(option.event)

    displayValue = (address: string) => displayFeed(this.getOption(address))
  }

  const feedSearch = derived(feeds, $feeds => new FeedSearch($feeds))

  const listFeedsById = deriveItemsByKey({
    repository,
    getKey: feed => feed.event.id,
    filters: [{kinds: [NAMED_BOOKMARKS]}],
    eventToItem: event => (event.tags.length > 1 ? mapListToFeed(readUserList(event)) : undefined),
  })

  const listFeeds = deriveItems(listFeedsById)

  const userListFeeds = derived(
    [listFeeds, pubkey],
    ([$listFeeds, $pubkey]: [PublishedListFeed[], string]) =>
      sortBy(
        l => l.title.toLowerCase(),
        $listFeeds.filter(feed => feed.list.event.pubkey === $pubkey),
      ),
  )

  const handlers = derived(
    deriveEvents({repository, filters: [{kinds: [HANDLER_INFORMATION]}]}),
    $events => $events.flatMap(readHandlers),
  )

  const handlersByKind = derived(handlers, $handlers => groupBy(handler => handler.kind, $handlers))

  const recommendations = deriveEvents({repository, filters: [{kinds: [HANDLER_RECOMMENDATION]}]})

  const deriveRecommendations = simpleCache(([address]: [string]) => {
    myLoad({
      relays: env.DEFAULT_RELAYS,
      filters: [
        {
          kinds: [HANDLER_RECOMMENDATION],
          authors: getFollows(pubkey.get()),
          "#a": [address],
        },
      ],
    })

    return derived(recommendations, $events =>
      $events.filter(e => getHandlerAddress(e) === address),
    )
  })

  const deriveHandlersForKind = simpleCache(([kind]: [number]) => {
    myLoad({
      relays: env.DEFAULT_RELAYS,
      filters: [
        {
          kinds: [HANDLER_RECOMMENDATION],
          authors: getFollows(pubkey.get()),
          "#d": [String(kind)],
        },
        {
          kinds: [HANDLER_INFORMATION],
          "#k": [String(kind)],
        },
      ],
    })

    return derived([handlers, recommendations], ([$handlers, $recs]) =>
      sortBy(
        h => -h.recommendations.length,
        $handlers
          .filter(h => h.kind === kind)
          .map(h => ({
            ...h,
            recommendations: $recs.filter(e => getHandlerAddress(e) === getAddress(h.event)),
          })),
      ),
    )
  })

  const deriveHandlerEvent = simpleCache(([address]: [string]) => {
    const filters = getIdFilters([address])

    myLoad({relays: env.DEFAULT_RELAYS, filters})

    return derived(deriveEvents({repository, filters}), first)
  })

  const collections = derived(
    deriveEvents({repository, filters: [{kinds: [LABEL], "#L": ["#t"]}]}),
    readCollections,
  )

  const deriveCollections = pubkey =>
    derived(collections, $collections =>
      sortBy(
        f => f.name.toLowerCase(),
        $collections.filter(collection => collection.pubkey === pubkey),
      ),
    )

  const collectionSearch = derived(collections, $collections => new CollectionSearch($collections))

  return {
    listsById,
    lists,
    userLists,
    listSearch,
    feedsById,
    feeds,
    userFeeds,
    defaultFeed,
    feedFavoriteEvents,
    feedFavorites,
    feedFavoritesByAddress,
    userFeedFavorites,
    userFavoritedFeeds,
    feedSearch,
    listFeedsById,
    listFeeds,
    userListFeeds,
    handlers,
    handlersByKind,
    recommendations,
    deriveRecommendations,
    deriveHandlersForKind,
    deriveHandlerEvent,
    collections,
    deriveCollections,
    collectionSearch,
  }
}
