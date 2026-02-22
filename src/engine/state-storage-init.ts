import {SocketEvent, Pool, makeSocketPolicyAuth} from "@welshman/net"
import type {Socket} from "@welshman/net"
import type {StampedEvent, TrustedEvent} from "@welshman/util"
import {always, now, pushToMapKey} from "@welshman/lib"
import {sync, localStorageProvider} from "@welshman/store"

export const createStateStorageInit = ({
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
  adapters,
}: any) => {
  let ready: Promise<any> = Promise.resolve()
  let initialized = false

  if (!initialized) {
    initialized = true
    const noticeVerbs = ["NOTICE", "CLOSED", "OK", "NEG-MSG"]
    const initialRelays = [
      ...env.DEFAULT_RELAYS,
      ...env.DVM_RELAYS,
      ...env.INDEXER_RELAYS,
      ...env.SEARCH_RELAYS,
    ]

    let autoAuthenticate = false

    defaultSocketPolicies.push(
      makeSocketPolicyAuth({
        sign: (event: StampedEvent) => signer.get()?.sign(event),
        shouldAuth: (socket: Socket) => autoAuthenticate,
      }),
    )

    appContext.dufflepudUrl = env.DUFFLEPUD_URL

    routerContext.getDefaultRelays = always(env.DEFAULT_RELAYS)
    routerContext.getIndexerRelays = always(env.INDEXER_RELAYS)
    routerContext.getSearchRelays = always(env.SEARCH_RELAYS)
    routerContext.getLimit = () => getSetting("relay_limit")

    sync({
      key: "pubkey",
      store: pubkey,
      storage: localStorageProvider,
    })

    sync({
      key: "sessions",
      store: sessions,
      storage: localStorageProvider,
    })

    sync({
      key: "shouldUnwrap",
      store: shouldUnwrap,
      storage: localStorageProvider,
    })

    userSettings.subscribe($settings => {
      autoAuthenticate = $settings.auto_authenticate2
      appContext.dufflepudUrl = getSetting("dufflepud_url")
    })

    Pool.get().subscribe((socket: Socket) => {
      socket.on(SocketEvent.Receive, (message, url) => {
        if (noticeVerbs.includes(message[0])) {
          subscriptionNotices.update($notices => {
            pushToMapKey($notices, url, {url, created_at: now(), notice: message})

            return $notices
          })
        }
      })
    })

    ready = initStorage("navcom", 9, adapters)

    ready.then(() => Promise.all(initialRelays.map(url => loadRelay(url))))
  }

  return {ready}
}
