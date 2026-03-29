import {synced, localStorageProvider} from "@welshman/store"
import {writable, derived} from "svelte/store"

export type NavComMode = "comms" | "map" | "ops"

export const navcomMode = synced<NavComMode>({
  key: "ui/navcom-mode",
  defaultValue: "comms",
  storage: localStorageProvider,
})

export function setMode(mode: NavComMode) {
  navcomMode.set(mode)
}

/** Active channel ID persisted per mode so switching back restores context */
export const activeChannelByMode = synced<Record<NavComMode, string | null>>({
  key: "ui/navcom-active-channel",
  defaultValue: {comms: null, map: null, ops: null},
  storage: localStorageProvider,
})

/** Currently active channel, derived from mode + per-mode active channel */
export const activeChannel = derived(
  [navcomMode, activeChannelByMode],
  ([$mode, $byMode]) => $byMode[$mode] ?? null,
)

/** Set the active channel for the current mode */
export function setActiveChannel(channelId: string | null) {
  activeChannelByMode.update($byMode => {
    const mode = navcomMode as any
    const currentMode = mode.get?.() ?? "comms"
    return {...$byMode, [currentMode]: channelId}
  })
}

/** Compose draft text persisted per channel so switching modes doesn't lose work */
export const composeDrafts = synced<Record<string, string>>({
  key: "ui/navcom-compose-drafts",
  defaultValue: {},
  storage: localStorageProvider,
})

/** In-memory scroll positions per mode (no need to persist across reloads) */
export const scrollPositions = writable<Record<NavComMode, number>>({
  comms: 0,
  map: 0,
  ops: 0,
})

/** Store stubs for marker-message linking (Phase 3) */
export const selectedMarkerId = writable<string | null>(null)
export const selectedMessageId = writable<string | null>(null)

/** Map viewport state persisted across mode switches */
export const mapViewport = synced<{center: [number, number]; zoom: number}>({
  key: "ui/navcom-map-viewport",
  defaultValue: {center: [18, 0], zoom: 2},
  storage: localStorageProvider,
})

/** Map layer visibility toggles (persisted) */
export type MapLayerConfig = {
  checkIns: boolean
  alerts: boolean
  sitreps: boolean
  spotreps: boolean
  memberPositions: boolean
}

export const mapLayers = synced<MapLayerConfig>({
  key: "ui/map-layers",
  defaultValue: {
    checkIns: true,
    alerts: true,
    sitreps: true,
    spotreps: true,
    memberPositions: false,
  },
  storage: localStorageProvider,
})

/** Map tile set selection (persisted) */
export type TileSetId = "street" | "satellite" | "terrain"

export const mapTileSet = synced<TileSetId>({
  key: "ui/map-tileset",
  defaultValue: "street",
  storage: localStorageProvider,
})

/** Map temporal filter (persisted) */
export type TimeRange = "1h" | "24h" | "7d" | "all"

export const mapTimeRange = synced<TimeRange>({
  key: "ui/map-time-range",
  defaultValue: "24h",
  storage: localStorageProvider,
})
