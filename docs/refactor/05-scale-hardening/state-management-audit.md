# State Management Audit — Store Inventory

> Generated as part of step 4.5.2 of the NavCom refactor.
> 93 store declarations across 33 files.

---

## Summary

| Type | Count |
|------|-------|
| `writable` | 28 |
| `derived` | 52 |
| `synced` | 5 |
| **Total** | 93 |

93 stores is high but most are local `derived` stores in Svelte components (auto-cleaned on destroy). The real concern is the 28 writables and 5 synced stores that persist or hold shared state.

---

## Store Inventory by Domain

### UI State (`src/app/`, `src/partials/`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `menuIsOpen` | `src/app/state.ts:40` | writable | No | Global |
| `searchTerm` | `src/app/state.ts:42` | writable | No | Global |
| `slowConnections` | `src/app/state.ts:53` | writable | No | Global |
| `installPrompt` | `src/partials/state.ts:17` | writable | No | Global |
| `theme` | `src/partials/state.ts:36` | synced | Yes (`ui/theme`) | Global |
| `themeColors` | `src/partials/state.ts:52` | derived(theme) | No | Auto |
| `themeVariables` | `src/partials/state.ts:67` | derived(themeColors) | No | Auto |
| `themeBackgroundGradient` | `src/partials/state.ts:73` | derived(themeColors) | No | Auto |
| `toast` | `src/partials/Toast.svelte:5` | writable | No | Global |
| `navcomMode` | `src/app/navcom-mode.ts:5` | synced | Yes (`ui/navcom-mode`) | Global |
| `onboardingState` | `src/app/state/onboarding.ts:33` | synced | Yes (`onboarding/state`) | Global |
| `onboardingReturnTo` | `src/app/state/onboarding.ts:39` | writable | No | Global |
| `promptDismissed` (Feed) | `src/app/shared/Feed.svelte:55` | synced | Yes | Component |

### Groups (`src/app/groups/`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `groupProjections` | `src/app/groups/state.ts:14` | writable | No | Global |
| `groupsHydrated` | `src/app/groups/state.ts:16` | writable | No | Global |
| `groupSummaries` | `src/app/groups/state.ts:46` | derived(groupProjections, pubkey) | No | Auto |
| `unreadGroupMessageCounts` | `src/app/groups/state.ts:56` | derived | No | Auto |
| `hasUnreadGroupMessages` | `src/app/groups/state.ts:79` | derived(unreadGroupMessageCounts) | No | Auto |
| `totalUnreadGroupMessages` | `src/app/groups/state.ts:87` | derived(unreadGroupMessageCounts) | No | Auto |

### Loader Status (`src/app/status/`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `activeByOperation` | `src/app/status/loader-status.ts:246` | writable | No | Manual (enter/exit paired) |
| `clock` | `src/app/status/loader-status.ts:247` | writable | No | Timer |
| `activeLoaderStatus` | `src/app/status/loader-status.ts:267` | derived | No | Auto |

### Router (`src/util/router.ts`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `history` | `src/util/router.ts:259` | writable | No | Manual |
| `nonVirtual` | `src/util/router.ts:260` | derived(history) | No | Auto |
| `pages` | `src/util/router.ts:261` | derived(nonVirtual) | No | Auto |
| `page` | `src/util/router.ts:262` | derived(nonVirtual) | No | Auto |
| `modals` | `src/util/router.ts:263` | derived(nonVirtual) | No | Auto |
| `modal` | `src/util/router.ts:274` | derived(nonVirtual) | No | Auto |
| `current` | `src/util/router.ts:275` | derived(nonVirtual) | No | Auto |

### Engine — Identity/Social (`src/engine/`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `hasNip44` | `src/engine/state.ts:178` | derived(signer) | No | Auto |
| `userSettingsEvent` | `src/engine/state.ts:262` | derived(pubkey, settingsEvents) | No | Auto |
| `userSettingsPlaintext` | `src/engine/state.ts:266` | derived | No | Auto |
| `userFollowList` | `src/engine/state-social.ts:44` | derived(followListsByPubkey, pubkey, anonymous) | No | Auto |
| `userNetwork` | `src/engine/state-social.ts:54` | derived(userFollowList) | No | Auto |
| `userMutedPubkeys` | `src/engine/state-social.ts:56` | derived(userMuteList) | No | Auto |
| `userMutedEvents` | `src/engine/state-social.ts:58` | derived | No | Auto |
| `userMutedWords` | `src/engine/state-social.ts:63` | derived(userMuteList) | No | Auto |
| `userMutedTopics` | `src/engine/state-social.ts:65` | derived(userMuteList) | No | Auto |
| `userPins` | `src/engine/state-social.ts:67` | derived(userPinList) | No | Auto |
| `checked` | `src/engine/state-social.ts:145` | synced | Yes | Global |
| `getSeenAt` | `src/engine/state-social.ts:153` | derived(checked) | No | Auto |
| `channels` | `src/engine/state-social.ts:168` | derived(pubkey, messages, getSeenAt) | No | Auto |
| `hasNewMessages` | `src/engine/state-social.ts:204` | derived(channels) | No | Auto |

### Engine — Content (`src/engine/`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `userLists` | `src/engine/state-content.ts:59` | derived(lists, pubkey) | No | Auto |
| `listSearch` | `src/engine/state-content.ts:66` | derived(lists) | No | Auto |
| `userFeeds` | `src/engine/state-content.ts:77` | derived(feeds, pubkey) | No | Auto |
| `defaultFeed` | `src/engine/state-content.ts:81` | derived(userFollows, userFeeds) | No | Auto |
| `feedFavorites` | `src/engine/state-content.ts:95` | derived | No | Auto |
| `userFeedFavorites` | `src/engine/state-content.ts:121` | derived(feedFavorites, pubkey) | No | Auto |
| `userFavoritedFeeds` | `src/engine/state-content.ts:125` | derived(userFeedFavorites) | No | Auto |
| `feedSearch` | `src/engine/state-content.ts:157` | derived(feeds) | No | Auto |
| `userListFeeds` | `src/engine/state-content.ts:168` | derived(listFeeds, pubkey) | No | Auto |
| `handlers` | `src/engine/state-content.ts:175` | derived | No | Auto |
| `handlersByKind` | `src/engine/state-content.ts:180` | derived(handlers) | No | Auto |
| `collections` | `src/engine/state-content.ts:238` | derived | No | Auto |
| `collectionSearch` | `src/engine/state-content.ts:251` | derived(collections) | No | Auto |

### Engine — Notifications (`src/engine/`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `isSeen` | `src/engine/notifications.ts:11` | derived | No | Auto |
| `mainNotifications` | `src/engine/notifications.ts:23` | derived | No | Auto |
| `unreadMainNotifications` | `src/engine/notifications.ts:36` | derived(isSeen, mainNotifications) | No | Auto |
| `hasNewNotifications` | `src/engine/notifications.ts:40` | derived | No | Auto |
| `reactionNotifications` | `src/engine/notifications.ts:60` | derived | No | Auto |
| `unreadReactionNotifications` | `src/engine/notifications.ts:77` | derived | No | Auto |

### Engine — Network (`src/domain/`, `src/engine/`)

| Store | File | Type | Persisted | Cleanup |
|-------|------|------|-----------|---------|
| `subscriptionNotices` | `src/domain/connection.ts:16` | writable | No | Global |
| `subscriptionNoticesByRelay` | `src/domain/connection.ts:18` | derived(subscriptionNotices) | No | Auto |
| `cacheMetrics` | `src/engine/cache.ts:119` | writable | No | Global |

### Component-Local Stores (auto-cleanup — low risk)

| Store | Component | Type |
|-------|-----------|------|
| `following` | PersonActions, PersonSummary, PersonDetail | derived(userFollows) |
| `muted` | PersonActions | derived(userMutedPubkeys) |
| `search` | PersonSelect | derived(profileSearch) |
| `results` | SearchResults | derived |
| `pubkeysWithoutMessaging` | Channel, ChannelsDetail | derived |
| `replies` | FeedItem | derived |
| `nsecWarning` | NoteReply | writable |
| `uploading` | NoteReply, NoteCreate | writable |
| `wordCount` | NoteCreate | writable |
| `charCount` | NoteCreate | writable |
| `messages` | ChannelsDetail | derived |
| `searchRelays` | RelayList | derived |
| `membersDisplay` | ChannelsListItem | derived |
| `loading` (2x) | requests.ts | writable |
| Zap store | zaps.ts | writable |
| `partials/utils.ts` (3x) | utils.ts | writable (createBooleanStore, createTimerStore) |

---

## Dependency Graph

```
theme ──→ themeColors ──→ themeVariables
                      ──→ themeBackgroundGradient

pubkey + followListsByPubkey + anonymous ──→ userFollowList ──→ userNetwork
userMuteList ──→ userMutedPubkeys / userMutedEvents / userMutedWords / userMutedTopics
userPinList ──→ userPins

groupProjections + pubkey ──→ groupSummaries
                          ──→ unreadGroupMessageCounts ──→ hasUnreadGroupMessages
                                                       ──→ totalUnreadGroupMessages

pubkey + messages + getSeenAt ──→ channels ──→ hasNewMessages
checked ──→ getSeenAt

history ──→ nonVirtual ──→ pages, page, modals, modal, current

lists + pubkey ──→ userLists, listSearch
feeds + pubkey ──→ userFeeds, feedSearch
userFollows + userFeeds ──→ defaultFeed

activeByOperation + clock ──→ activeLoaderStatus
```

---

## Key Findings

### 1. No Orphaned Subscriptions Detected
All `derived` stores auto-clean on unsubscribe. Component-local stores (21 of 93) are tied to component lifecycle. The 5 `synced` stores persist to localStorage intentionally.

### 2. Near-Duplicates (Low Risk)
- `userFollowList` → `userNetwork`: semantically distinct (list vs expanded network). No action needed.
- `unreadGroupMessageCounts` → `totalUnreadGroupMessages` → `hasUnreadGroupMessages`: proper derived chain, not duplication.

### 3. Global Writables Without Cleanup (Acceptable)
These 8 global writables live for the app lifecycle — they're singletons, not leaks:
- `menuIsOpen`, `searchTerm`, `slowConnections`, `installPrompt`, `toast`, `groupProjections`, `groupsHydrated`, `cacheMetrics`, `subscriptionNotices`

### 4. Source of Truth by Domain

| Domain | Source of Truth | Derived From |
|--------|----------------|-------------|
| Identity | `@welshman/app` `pubkey`, `session`, `signer` | External library |
| Theme | `theme` (synced to `ui/theme`) | `themeColors` → `themeVariables` |
| Mode | `navcomMode` (synced to `ui/navcom-mode`) | — |
| Groups | `groupProjections` (writable) | `groupSummaries`, unread counts |
| Social | `followListsByPubkey`, `userMuteList` (welshman) | `userFollowList`, muted sets |
| Notifications | `repository.on("update")` | derived chains |
| Content | `lists`, `feeds` (welshman) | derived searches, collections |
| Router | `history` (writable) | `page`, `modal`, `current` |
| Loader | `activeByOperation` | `activeLoaderStatus` |

### 5. Potential Improvement: `groupProjections` Growth
`groupProjections` is an ever-growing `Map<string, GroupProjection>` (writable). If a user joins many groups over time, this map grows without bounds. Consider adding an eviction policy in a future pass.

---

## Conventions for New Stores

1. **Prefer `derived` over `writable`** — derive from existing sources of truth
2. **Component-local stores** — define inside `<script>` block, auto-cleaned on destroy
3. **Global stores** — export from a domain-specific `state.ts` file
4. **Persisted stores** — use `synced({ key, storage: localStorageProvider })`
5. **Key format** — use `domain/name` pattern (e.g., `ui/theme`, `ui/navcom-mode`)
6. **Cleanup** — no manual cleanup needed for `derived`; writables in singleton modules are acceptable; only manually subscribed stores need `onDestroy(unsub)`
