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
  import {showWarning, showActionToast} from "src/partials/Toast.svelte"
  import ChatEnable from "src/app/views/ChatEnable.svelte"
  import Menu from "src/app/Menu.svelte"
  import Routes from "src/app/Routes.svelte"
  import ErrorBoundary from "src/app/ErrorBoundary.svelte"
  import Nav from "src/app/Nav.svelte"
  import ModeTabBar from "src/app/views/ModeTabBar.svelte"
  import MainStatusBar from "src/app/MainStatusBar.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"
  import LoaderStatusBanner from "src/app/shared/LoaderStatusBanner.svelte"
  import SwUpdateBanner from "src/app/shared/SwUpdateBanner.svelte"
  import {enterLoaderStatus, exitLoaderStatus} from "src/app/status/loader-status"
  import {announcement, announcementPriority, skipToMain} from "src/partials/accessibility"
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
  import UnlockScreen from "src/app/views/UnlockScreen.svelte"
  import {
    pqcUnlockNeeded,
    pqcUnlockSkipped,
    setActivePassphrase,
    skipPqcUnlock,
    checkPqcUnlockNeeded,
    migrateLegacyPqcKeys,
  } from "src/engine/pqc/pq-key-store"
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
  import {onMount, onDestroy} from "svelte"
  import {logUsage} from "src/app/state"
  import {setMode} from "src/app/navcom-mode"
  import type {NavComMode} from "src/app/navcom-mode"
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

  // NavCom mode keyboard shortcuts: Ctrl/Cmd+1=comms, Ctrl/Cmd+2=map, Ctrl/Cmd+3=ops
  const modeKeys: Record<string, NavComMode> = {"1": "comms", "2": "map", "3": "ops"}

  function handleModeShortcut(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return
    const mode = modeKeys[e.key]
    if (mode) {
      e.preventDefault()
      setMode(mode)
    }
  }

  window.addEventListener("keydown", handleModeShortcut)
  onDestroy(() => window.removeEventListener("keydown", handleModeShortcut))

  const APP_BOOTSTRAP_OPERATION = "app-bootstrap"

  enterLoaderStatus("app.bootstrap.engine", APP_BOOTSTRAP_OPERATION)
  ready
    .then(async () => {
      // Our stores are throttled by 300, so wait until they're populated
      // before loading app data
      enterLoaderStatus("app.bootstrap.store-settle", APP_BOOTSTRAP_OPERATION)
      await sleep(350)

      // Check if PQC secure store needs unlocking
      await checkPqcUnlockNeeded()

      if ($session) {
        enterLoaderStatus("app.bootstrap.user-data", APP_BOOTSTRAP_OPERATION)
        loadUserData()
      } else {
        enterLoaderStatus("app.bootstrap.readonly", APP_BOOTSTRAP_OPERATION)
      }
    })
    .catch(e => {
      console.error("engine init failed", e)
    })
    .finally(() => {
      exitLoaderStatus(APP_BOOTSTRAP_OPERATION)
    })
</script>

<div class="text-nc-text">
  <!-- Accessibility: Skip-to-content link (appears on Tab) -->
  <a class="sr-only focus:not-sr-only" href="#main-content" on:click|preventDefault={skipToMain}>
    Skip to content
  </a>

  <!-- Accessibility: Global ARIA live region for screen reader announcements -->
  <div aria-live={$announcementPriority} aria-atomic="true" class="sr-only" role="status">
    {$announcement}
  </div>

  {#if $pqcUnlockNeeded}
    <UnlockScreen
      on:unlock={async e => {
        setActivePassphrase(e.detail.passphrase)
        const result = await migrateLegacyPqcKeys()
        if (result.failed > 0) {
          showActionToast(
            `${result.failed} key(s) could not be re-encrypted with your passphrase`,
            "Retry",
            async () => {
              const retry = await migrateLegacyPqcKeys()
              if (retry.failed > 0) {
                showWarning(`${retry.failed} key(s) still failed to migrate`)
              }
            },
          )
        }
      }}
      on:skip={skipPqcUnlock} />
  {:else}
    <ErrorBoundary>
      <main id="main-content" tabindex="-1" aria-label="Main content">
        <Routes />
      </main>
    </ErrorBoundary>
  {/if}
  <LoaderStatusBanner />
  <SwUpdateBanner />
  {#if $pqcUnlockSkipped}
    <div class="fixed left-0 right-0 top-0 z-toast flex justify-center">
      <div
        class="border-amber-500 bg-amber-900/80 m-2 max-w-xl flex-grow rounded border p-3 text-center text-sm text-nc-text shadow-xl">
        <i class="fa fa-shield-halved mr-1" />
        Your encryption keys are not fully protected.
        <button
          class="ml-2 underline hover:text-white"
          on:click={() => {
            pqcUnlockNeeded.set(true)
            pqcUnlockSkipped.set(false)
          }}>
          Set passphrase
        </button>
      </div>
    </div>
  {/if}
  {#key $pubkey}
    <ForegroundButtons />
    <nav aria-label="Main navigation">
      <Nav />
    </nav>
    <nav aria-label="Mode navigation">
      <ModeTabBar />
    </nav>
    <Menu />
    <MainStatusBar />
    <BackupReminder />
    <ManagedExportPrompt />
    <Toast />
  {/key}
</div>
