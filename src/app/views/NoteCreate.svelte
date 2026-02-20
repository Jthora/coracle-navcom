<script lang="ts">
  import {onMount} from "svelte"
  import {dateToSeconds, now} from "@welshman/lib"
  import {own, hash} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {Router, addMinimalFallbacks} from "@welshman/router"
  import {makeEvent, DVM_REQUEST_PUBLISH_SCHEDULE} from "@welshman/util"
  import type {Thunk} from "@welshman/app"
  import {request} from "@welshman/net"
  import {
    session,
    publishThunk,
    thunkIsComplete,
    tagPubkey,
    signer,
    abortThunk,
  } from "@welshman/app"
  import {writable} from "svelte/store"
  import {makePow} from "src/util/pow"
  import type {ProofOfWork} from "src/util/pow"
  import {warn} from "src/util/logger"
  import {showInfo, showPublishInfo, showToast, showWarning} from "src/partials/Toast.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import type {Values} from "src/app/shared/NoteOptions.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import GeoModal from "src/app/shared/GeoModal.svelte"
  import NoteCreateComposer from "src/app/views/note-create/NoteCreateComposer.svelte"
  import {makeEditor} from "src/app/editor"
  import {drafts} from "src/app/state"
  import {normalizeEditorTags} from "src/app/util/tags"
  import {trackFirstPostAfterOnboarding} from "src/app/util/onboarding-first-post"
  import {router} from "src/app/util/router"
  import {defaultGeointState} from "src/app/util/geoint"
  import type {GeointState} from "src/app/util/geoint"
  import {shapePostForSubmit} from "src/app/util/post-assembly"
  import {
    assemblePreviewData,
    ensureDefaultTypedDraft,
    getDraftForType,
    getNoteCreateDraftKeys,
    isValidGeoState,
    normalizeGeoState,
  } from "src/app/views/note-create/state"
  import {createPubkeyEncoder, prefillNoteCreateContent} from "src/app/views/note-create/prefill"
  import type {NoteCreatePreviewData, NoteCreateType} from "src/app/views/note-create/state"
  import {env, getClientTags, sign, userSettings, broadcastUserRelays} from "src/engine"

  export let quote = null
  export let pubkey = null

  const uploading = writable(false)
  const wordCount = writable(0)
  const charCount = writable(0)
  const SHIPYARD_PUBKEY = "5f13f66425c39afa13afd82870952e10d584cebd87f9d02f00ccd871aaaae9eb"
  const nsecWarning = writable(null)
  let selectedType: NoteCreateType = "default"
  let geointState: GeointState = defaultGeointState()
  let showGeoModal = false
  let geoError: string | null = null
  let sizeWarning: string | null = null
  let sizeBlocked: string | null = null
  let showGeoJsonPreview = true
  let previewData: NoteCreatePreviewData = {human: "", payload: null}
  let extraJsonWarning: string | null = null
  let geohashWarning: string | null = null

  const openOptions = () => {
    showOptions = true
  }

  const closeOptions = () => {
    showOptions = false
  }

  const setOptions = values => {
    options = {...options, ...values}
    showOptions = false
  }

  const {baseDraftKey, typedDraftKey, geoDraftKey} = getNoteCreateDraftKeys(pubkey, quote?.id)

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    onSubmit({skipNsecWarning: true})
  }

  const assemblePreview = () => {
    const baseText = editor.getText({blockSeparator: "\n"}).trim()

    return assemblePreviewData({
      baseText,
      selectedType,
      geointState,
      hasValidGeo: hasValidGeo(),
    })
  }

  const onSubmit = async ({skipNsecWarning = false} = {}) => {
    // prevent sending before media are uploaded
    if ($uploading || publishing) return

    sizeWarning = null
    sizeBlocked = null
    geoError = null
    geohashWarning = null

    const baseText = editor.getText({blockSeparator: "\n"}).trim()

    if (selectedType === "default" && !baseText) return showWarning("Please provide a description.")

    if (!skipNsecWarning && baseText.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const tags = [...normalizeEditorTags(editor.storage.nostr.getEditorTags()), ...getClientTags()]

    if (!tags.some(t => t[0] === "client")) {
      tags.push(["client", "navcom"])
    }

    if (options.warning) {
      tags.push(["content-warning", options.warning])
    }

    if (options.expiration) {
      tags.push(["expiration", String(dateToSeconds(options.expiration))])
    }

    if (quote) {
      tags.push(tagPubkey(quote.pubkey))
    }

    const shaped = shapePostForSubmit({
      type: selectedType,
      baseText,
      tags,
      geointState,
    })

    geohashWarning = shaped.geohashWarning ?? null
    sizeWarning = shaped.sizeWarning ?? null

    if (shaped.error) {
      if (selectedType === "geoint") {
        geoError = shaped.error
      }

      return showWarning(shaped.error)
    }

    if (shaped.sizeBlocked) {
      sizeBlocked = shaped.sizeBlocked

      return showWarning(shaped.sizeBlocked)
    }

    if (sizeWarning) {
      showWarning(sizeWarning)
    }

    const created_at = options.publish_at ? dateToSeconds(options.publish_at) : now()
    const ownedEvent = own(
      makeEvent(1, {content: shaped.content ?? "", tags: shaped.tags, created_at}),
      $session.pubkey,
    )

    let hashedEvent = hash(ownedEvent)

    if (options.pow_difficulty) {
      publishing = "pow"

      pow?.worker.terminate()
      pow = makePow(ownedEvent, options.pow_difficulty)

      hashedEvent = await pow.result
    }

    publishing = "signing"

    const signedEvent = await sign(hashedEvent, options)
    const ACTIVE_DRAFT_KEY = typedDraftKey(selectedType)

    const relays =
      options.relays?.length > 0
        ? options.relays
        : Router.get().PublishEvent(signedEvent).policy(addMinimalFallbacks).getUrls()

    let thunk: Thunk

    router.clearModals()
    drafts.delete(ACTIVE_DRAFT_KEY)

    if (selectedType === "geoint") {
      drafts.delete(geoDraftKey(selectedType))
    }

    if (options.publish_at) {
      const dvmContent = await $signer.nip04.encrypt(
        SHIPYARD_PUBKEY,
        JSON.stringify([
          ["i", JSON.stringify(signedEvent), "text"],
          ["param", "relays", ...relays],
        ]),
      )

      const dvmEvent = await sign(
        makeEvent(DVM_REQUEST_PUBLISH_SCHEDULE, {
          content: dvmContent,
          tags: [["p", SHIPYARD_PUBKEY], ["encrypted"]],
        }),
      )

      thunk = publishThunk({
        event: dvmEvent,
        relays: env.DVM_RELAYS,
        delay: $userSettings.send_delay,
      })

      const abortController = new AbortController()

      await request({
        relays: env.DVM_RELAYS,
        signal: AbortSignal.any([abortController.signal, AbortSignal.timeout(30_000)]),
        filters: [{kinds: [dvmEvent.kind + 1000, 7000], since: now() - 30, "#e": [dvmEvent.id]}],
        onEvent: (event: TrustedEvent, url: string) => {
          if (event.kind === 7000) {
            $signer.nip04.decrypt(SHIPYARD_PUBKEY, event.content).then(data => {
              try {
                data = JSON.parse(data)[0]
                showInfo(data[2] || "Your note is " + data[1] + "!")
              } catch (e) {
                warn(e)
              }
            })
          } else {
            abortController.abort()
          }
        },
      })
    } else {
      router.clearModals()

      thunk = publishThunk({relays, event: signedEvent, delay: $userSettings.send_delay})
    }

    trackFirstPostAfterOnboarding(thunk)

    new Promise<void>(resolve => {
      thunk.subscribe(t => {
        if (thunkIsComplete(t)) {
          resolve()
        }
      })
    }).then(() => {
      charCount.set(0)
      wordCount.set(0)
    })

    let aborted = false

    if ($userSettings.send_delay > 0) {
      await showToast({
        type: "delay",
        timeout: $userSettings.send_delay / 1000,
        onCancel: () => {
          aborted = true
          abortThunk(thunk)
          router.at("notes/create").open()
          drafts.set(ACTIVE_DRAFT_KEY, editor.getJSON())

          if (selectedType === "geoint") {
            drafts.set(geoDraftKey(selectedType), geointState)
          }
        },
      })
    }

    if (!aborted) {
      showPublishInfo(thunk)
      broadcastUserRelays(relays)

      if (selectedType === "geoint") {
        geointState = defaultGeointState()
      }
    }

    publishing = null
  }

  const togglePreview = () => {
    showPreview = !showPreview
  }

  const toggleGeoJsonPreview = () => {
    showGeoJsonPreview = !showGeoJsonPreview
  }

  const onOpenGeoModal = () => {
    showGeoModal = true
  }

  const onUploadClick = () => {
    editor.chain().selectFiles().run()
  }

  const pubkeyEncoder = createPubkeyEncoder()
  ensureDefaultTypedDraft(drafts, typedDraftKey, baseDraftKey)

  const draft = getDraftForType(drafts, selectedType, typedDraftKey, baseDraftKey)
  geointState = (drafts.get(geoDraftKey("geoint")) as GeointState) ?? defaultGeointState()

  const editor = makeEditor({
    autofocus: true,
    content: draft,
    submit: onSubmit,
    onUpdate: () => {
      drafts.set(typedDraftKey(selectedType), editor.getJSON())
      previewData = assemblePreview()
    },
    onUploadError: task => showWarning(`Failed to upload file: ${task.error}`),
    uploading,
    charCount,
    wordCount,
  })

  previewData = assemblePreview()

  const persistGeoDraft = () => {
    if (selectedType === "geoint") {
      drafts.set(geoDraftKey(selectedType), geointState)
    }
  }

  const persistContentDraft = () => {
    drafts.set(typedDraftKey(selectedType), editor.getJSON())
  }

  const refreshCounts = () => {
    const text = editor.getText({blockSeparator: "\n"})
    const trimmed = text.trim()

    charCount.set(text.length)
    wordCount.set(trimmed ? trimmed.split(/\s+/).length : 0)
  }

  const switchType = (type: NoteCreateType) => {
    if (type === selectedType) return

    persistContentDraft()
    persistGeoDraft()

    selectedType = type

    const nextDraft = getDraftForType(drafts, type, typedDraftKey, baseDraftKey) || ""

    editor.commands.setContent(nextDraft)
    refreshCounts()
    previewData = assemblePreview()

    geointState =
      type === "geoint"
        ? ((drafts.get(geoDraftKey(type)) as GeointState) ?? defaultGeointState())
        : defaultGeointState()

    geoError = null
    sizeWarning = null
    sizeBlocked = null
    extraJsonWarning = null
    geohashWarning = null
  }

  const handleGeoSave = (state: GeointState) => {
    const normalizedState = normalizeGeoState(state)

    geointState = normalizedState
    drafts.set(geoDraftKey("geoint"), normalizedState)
    geoError = null
    showGeoModal = false
    extraJsonWarning = null
    geohashWarning = null
  }

  const handleGeoCancel = () => {
    showGeoModal = false
    extraJsonWarning = null
    geohashWarning = null
  }

  const handleGeoClear = () => {
    geointState = defaultGeointState()
    drafts.delete(geoDraftKey("geoint"))
    showGeoModal = false
    extraJsonWarning = null
    geohashWarning = null
  }

  const hasValidGeo = () => {
    if (isValidGeoState(geointState)) {
      return true
    }

    const draftState = drafts.get(geoDraftKey("geoint")) as GeointState | undefined

    return isValidGeoState(draftState)
  }

  let showPreview = false
  let showOptions = false
  let publishing: "signing" | "pow" | null = null
  let pow: ProofOfWork
  let options: Values = {
    warning: "",
    anonymous: false,
    publish_at: null,
    pow_difficulty: $userSettings.pow_difficulty,
  }

  onMount(() => {
    prefillNoteCreateContent({
      editor,
      quote,
      pubkey,
      sessionPubkey: $session.pubkey,
      pubkeyEncoder,
    })

    setTimeout(() => editor.commands.focus("end"))

    return () => {
      pow?.worker.terminate()
      editor.destroy()
    }
  })
</script>

<NoteCreateComposer
  {selectedType}
  {geointState}
  {geoError}
  {extraJsonWarning}
  {geohashWarning}
  {sizeWarning}
  {sizeBlocked}
  {showPreview}
  {showGeoJsonPreview}
  {previewData}
  {editor}
  uploading={$uploading}
  {publishing}
  {options}
  charCount={$charCount}
  wordCount={$wordCount}
  {hasValidGeo}
  onSubmit={() => onSubmit()}
  onSwitchType={switchType}
  {onOpenGeoModal}
  onClearGeo={handleGeoClear}
  onToggleGeoJsonPreview={toggleGeoJsonPreview}
  onTogglePreview={togglePreview}
  onOpenOptions={openOptions}
  {onUploadClick} />

{#if showOptions}
  <NoteOptions onClose={closeOptions} onSubmit={setOptions} initialValues={options} publishAt />
{/if}

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}

{#if showGeoModal}
  <GeoModal
    value={geointState}
    on:warn={e => (extraJsonWarning = e.detail)}
    onSave={handleGeoSave}
    onCancel={handleGeoCancel}
    onClear={handleGeoClear} />
{/if}
