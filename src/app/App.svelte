<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import * as nip19 from "nostr-tools/nip19"
  import {get} from "svelte/store"
  import {sleep, memoize} from "@welshman/lib"
  import * as lib from "@welshman/lib"
  import * as util from "@welshman/util"
  import * as content from "@welshman/content"
  import * as welshmanRouter from "@welshman/router"
  import * as signer from "@welshman/signer"
  import * as net from "@welshman/net"
  import * as app from "@welshman/app"
  import logger from "src/util/logger"
  import * as misc from "src/util/misc"
  import * as nostr from "src/util/nostr"
  import {ready} from "src/engine"
  import * as engine from "src/engine"
  import * as domain from "src/domain"
  import {loadUserData} from "src/app/state"
  import {themeVariables, appName} from "src/partials/state"
  import {ANNOUNCEMENTS_PATH} from "src/app/announcements"
  import {registerGroupRoutes} from "src/app/groups/routes"
  import Toast from "src/partials/Toast.svelte"
  import ChatEnable from "src/app/views/ChatEnable.svelte"
  import Menu from "src/app/Menu.svelte"
  import Routes from "src/app/Routes.svelte"
  import Nav from "src/app/Nav.svelte"
  import UplinkStatusBar from "src/app/UplinkStatusBar.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"
  import Bech32Entity from "src/app/views/Bech32Entity.svelte"
  import ChannelCreate from "src/app/views/ChannelCreate.svelte"
  import ChannelsDetail from "src/app/views/ChannelsDetail.svelte"
  import ChannelsList from "src/app/views/ChannelsList.svelte"
  import FeedCreate from "src/app/views/FeedCreate.svelte"
  import FeedEdit from "src/app/views/FeedEdit.svelte"
  import FeedList from "src/app/views/FeedList.svelte"
  import Announcements from "src/app/views/Announcements.svelte"
  import Home from "src/app/views/Home.svelte"
  import InviteAccept from "src/app/views/InviteAccept.svelte"
  import LabelCreate from "src/app/views/LabelCreate.svelte"
  import Login from "src/app/views/Login.svelte"
  import LoginBunker from "src/app/views/LoginBunker.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import Logout from "src/app/views/Logout.svelte"
  import NoteCreate from "src/app/views/NoteCreate.svelte"
  import NoteDelete from "src/app/views/NoteDelete.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import Notifications from "src/app/views/Notifications.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import BackupReminder from "src/app/views/onboarding/BackupReminder.svelte"
  import ManagedExportPrompt from "src/app/views/onboarding/ManagedExportPrompt.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import PersonFollowers from "src/app/views/PersonFollowers.svelte"
  import PersonFollows from "src/app/views/PersonFollows.svelte"
  import PersonInfo from "src/app/views/PersonInfo.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import ReportCreate from "src/app/views/ReportCreate.svelte"
  import Search from "src/app/views/Search.svelte"
  import ThreadDetail from "src/app/views/ThreadDetail.svelte"
  import Zap from "src/app/views/Zap.svelte"
  import {onMount} from "svelte"
  import {logUsage} from "src/app/state"
  import {
    router,
    asChannelId,
    asPerson,
    asNaddr,
    asCsv,
    asInviteGroups,
    asJson,
    asString,
    asUrlComponent,
    asNote,
    asRelay,
    asEntity,
  } from "src/app/util/router"

  const {session, pubkey} = app

  // Routes

  router.registerLazy("/about", () => import("src/app/views/About.svelte"))
  router.register("/search", Search)

  router.register("/channels", ChannelsList, {
    requireSigner: true,
  })
  router.register("/channels/enable", ChatEnable, {
    requireSigner: true,
  })
  router.register("/channels/create", ChannelCreate, {
    requireSigner: true,
  })
  router.register("/channels/requests", ChannelsList, {
    requireSigner: true,
  })
  router.register("/channels/:channelId", ChannelsDetail, {
    requireSigner: true,
    serializers: {
      channelId: asChannelId,
    },
  })

  registerGroupRoutes(router)

  router.registerLazy("/help/:topic", () => import("src/app/views/Help.svelte"))

  router.register("/invite", InviteAccept, {
    serializers: {
      people: asCsv("people"),
      relays: asCsv("relays"),
      groups: asInviteGroups,
    },
  })
  router.registerLazy("/invite/create", () => import("src/app/views/InviteCreate.svelte"), {
    serializers: {
      initialPubkey: asUrlComponent("initialPubkey"),
      initialGroupAddress: asUrlComponent("initialGroupAddress"),
    },
  })

  router.registerLazy("/intel/map", () => import("src/app/views/IntelNavMap.svelte"))

  router.register("/feeds", FeedList)
  router.register("/feeds/create", FeedCreate)
  router.register("/feeds/:address", FeedEdit, {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register(ANNOUNCEMENTS_PATH, Announcements)

  router.registerLazy("/lists", () => import("src/app/views/ListList.svelte"))
  router.registerLazy("/lists/create", () => import("src/app/views/ListCreate.svelte"))
  router.registerLazy("/lists/:address", () => import("src/app/views/ListDetail.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.registerLazy("/lists/:address/edit", () => import("src/app/views/ListEdit.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.registerLazy("/lists/select", () => import("src/app/views/ListSelect.svelte"), {
    serializers: {
      type: asString("type"),
      value: asString("value"),
    },
  })

  router.register("/login", Login)
  router.register("/login/bunker", LoginBunker)
  router.register("/login/connect", LoginConnect, {
    requireUser: true,
  })
  router.register("/logout", Logout)

  router.registerLazy("/media/:url", () => import("src/app/views/MediaDetail.svelte"), {
    serializers: {
      url: asUrlComponent("url"),
    },
  })

  router.register("/", Announcements)
  router.register("/open", Home)
  router.register("/topics/:topic", Home)
  router.register("/notes", Home)
  router.register("/notes/create", NoteCreate, {
    requireSigner: true,
    serializers: {
      pubkey: asPerson,
      type: asString("type"),
    },
  })
  router.register("/notes/:entity", NoteDetail, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/label", LabelCreate, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/report", ReportCreate, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/thread", ThreadDetail, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/delete", NoteDelete, {
    serializers: {
      entity: asNote,
      kind: asString("kind"),
    },
  })

  router.register("/notifications", Notifications, {
    requireUser: true,
  })
  router.register("/notifications/:activeTab", Notifications, {
    requireUser: true,
  })

  router.register("/signup", Onboarding, {
    serializers: {
      returnTo: asString("returnTo"),
    },
  })

  router.register("/people/list", PersonList, {
    serializers: {
      pubkeys: asCsv("pubkeys"),
    },
  })
  router.register("/people/:entity", PersonDetail, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/followers", PersonFollowers, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/follows", PersonFollows, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/info", PersonInfo, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })

  router.registerLazy("/qrcode/:code", () => import("src/app/views/QRCode.svelte"), {
    serializers: {
      code: asUrlComponent("code"),
    },
  })

  router.registerLazy("/publishes", () => import("src/app/views/Publishes.svelte"))

  router.registerLazy("/relays/:entity", () => import("src/app/views/RelayDetail.svelte"), {
    serializers: {
      entity: asRelay,
    },
  })
  router.registerLazy("/relays/:entity/review", () => import("src/app/views/RelayReview.svelte"), {
    serializers: {
      entity: asRelay,
    },
  })

  router.registerLazy("/settings", () => import("src/app/views/UserSettings.svelte"), {
    requireUser: true,
  })
  router.registerLazy("/settings/content", () => import("src/app/views/UserContent.svelte"), {
    requireUser: true,
  })
  router.registerLazy("/settings/data", () => import("src/app/views/UserData.svelte"), {
    requireUser: true,
  })
  router.registerLazy("/settings/wallet", () => import("src/app/views/UserWallet.svelte"), {
    requireUser: true,
  })
  router.registerLazy(
    "/settings/wallet/connect",
    () => import("src/app/views/WalletConnect.svelte"),
    {
      requireUser: true,
    },
  )
  router.registerLazy(
    "/settings/wallet/disconnect",
    () => import("src/app/views/WalletDisconnect.svelte"),
    {
      requireUser: true,
    },
  )
  router.registerLazy("/settings/data/export", () => import("src/app/views/DataExport.svelte"), {
    requireUser: true,
  })
  router.registerLazy("/settings/data/import", () => import("src/app/views/DataImport.svelte"), {
    requireUser: true,
  })
  router.registerLazy("/settings/keys", () => import("src/app/views/UserKeys.svelte"), {
    requireUser: true,
  })
  router.registerLazy("/settings/profile", () => import("src/app/views/UserProfile.svelte"), {
    requireUser: true,
  })
  router.registerLazy("/settings/relays", () => import("src/app/views/RelayList.svelte"))

  router.register("/zap", Zap, {
    required: ["splits"],
    serializers: {
      eventId: asNote,
      amount: asJson("amount"),
      splits: asJson("splits"),
      anonymous: asJson("anonymous"),
    },
  })

  router.register("/:entity", Bech32Entity, {
    serializers: {
      entity: asEntity,
    },
  })
  router.register("/:entity/*", Bech32Entity, {
    serializers: {
      entity: asEntity,
    },
  })

  router.init()

  // Globals
  Object.assign(window, {
    get,
    nip19,
    logger,
    router,
    content,
    ...welshmanRouter,
    ...nostr,
    ...misc,
    ...signer,
    ...lib,
    ...util,
    ...net,
    ...app,
    ...domain,
    ...engine,
  })

  // Theme

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${$themeVariables}; background: var(--neutral-800); }`

  // Scroll position

  let scrollY: number

  const unsubHistory = router.history.subscribe($history => {
    if ($history[0].modal) {
      // This is not idempotent, so don't duplicate it
      if (document.body.style.position !== "fixed") {
        scrollY = window.scrollY

        document.body.style.top = `-${scrollY}px`
        document.body.style.position = `fixed`
      }
    } else if (document.body.style.position === "fixed") {
      document.body.setAttribute("style", "")

      if (scrollY !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY)
          scrollY = undefined
        })
      }
    }
  })

  // Usage logging, router listener

  onMount(() => {
    const unsubPage = router.page.subscribe(
      memoize($page => {
        if ($page) {
          logUsage($page.path)
        }

        window.scrollTo(0, 0)
      }),
    )

    const unsubModal = router.modal.subscribe($modal => {
      if ($modal) {
        logUsage($modal.path)
      }
    })

    const unsubRouter = router.listen()

    return () => {
      unsubPage()
      unsubModal()
      unsubRouter()
      unsubHistory()
    }
  })

  // Protocol handler

  try {
    const handler = navigator.registerProtocolHandler as (
      scheme: string,
      handler: string,
      name: string,
    ) => void

    handler?.("web+nostr", `${location.origin}/%s`, appName)
    handler?.("nostr", `${location.origin}/%s`, appName)
  } catch (e) {
    // pass
  }

  // App data boostrap and relay meta fetching

  let initPending = true

  ready
    .then(async () => {
      // Our stores are throttled by 300, so wait until they're populated
      // before loading app data
      await sleep(350)

      if ($session) {
        loadUserData()
      }
    })
    .catch(e => {
      console.error("engine init failed", e)
    })
    .finally(() => {
      initPending = false
    })
</script>

<div class="text-neutral-100">
  <Routes />
  {#if initPending}
    <div class="pointer-events-none fixed inset-0 flex items-start justify-center p-4">
      <div class="bg-neutral-900/80 rounded px-3 py-2 text-sm text-neutral-200 shadow-lg">
        Loading app…
      </div>
    </div>
  {/if}
  {#key $pubkey}
    <ForegroundButtons />
    <Nav />
    <Menu />
    <UplinkStatusBar />
    <BackupReminder />
    <ManagedExportPrompt />
    <Toast />
  {/key}
</div>
