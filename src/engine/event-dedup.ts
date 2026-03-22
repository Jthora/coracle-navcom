/**
 * Bounded event deduplication set for replay attack mitigation.
 *
 * Tracks event IDs with timestamps. When at capacity, evicts the
 * oldest entries first. Also rejects events with `created_at`
 * outside a configurable time window (causal ordering).
 *
 * Supports optional IndexedDB persistence to survive page reloads.
 */

import {openDB} from "idb"
import type {IDBPDatabase} from "idb"

const DEFAULT_MAX_SIZE = 10_000
const DEFAULT_MAX_AGE_S = 600 // 10-minute window for stale event rejection
const DEDUP_DB_NAME = "navcom-event-dedup"
const DEDUP_DB_VERSION = 1
const DEDUP_STORE = "seen"

export class EventDedup {
  private seen = new Map<string, number>() // eventId → created_at
  private maxSize: number
  private maxAgeS: number
  private dbPromise: Promise<IDBPDatabase> | null = null
  private persistEnabled: boolean

  constructor(maxSize = DEFAULT_MAX_SIZE, maxAgeS = DEFAULT_MAX_AGE_S, persist = false) {
    this.maxSize = maxSize
    this.maxAgeS = maxAgeS
    this.persistEnabled = persist
  }

  private getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DEDUP_DB_NAME, DEDUP_DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(DEDUP_STORE)) {
            db.createObjectStore(DEDUP_STORE, {keyPath: "id"})
          }
        },
      })
    }
    return this.dbPromise
  }

  /**
   * Check and record an event. Returns true if the event is new and
   * within the acceptable time window.
   */
  add(eventId: string, createdAt: number, relayUrl?: string): boolean {
    if (this.seen.has(eventId)) {
      console.warn(
        `[SecurityAudit] Replay detected: event ${eventId.slice(0, 8)}… already seen` +
          (relayUrl ? ` (relay: ${relayUrl})` : ""),
      )
      return false
    }

    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - createdAt) > this.maxAgeS) {
      console.warn(
        `[SecurityAudit] Stale/future event rejected: ${eventId.slice(0, 8)}… created_at=${createdAt} (drift=${now - createdAt}s, max=${this.maxAgeS}s)` +
          (relayUrl ? ` (relay: ${relayUrl})` : ""),
      )
      return false
    }

    if (this.seen.size >= this.maxSize) {
      this.evictOldest()
    }

    this.seen.set(eventId, createdAt)
    return true
  }

  has(eventId: string): boolean {
    return this.seen.has(eventId)
  }

  get size(): number {
    return this.seen.size
  }

  clear(): void {
    this.seen.clear()
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, time] of this.seen) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) this.seen.delete(oldestKey)
  }

  /** Persist current dedup set to IndexedDB (no-op if persistence disabled). */
  async save(): Promise<void> {
    if (!this.persistEnabled) return
    try {
      const db = await this.getDb()
      const tx = db.transaction(DEDUP_STORE, "readwrite")
      const store = tx.objectStore(DEDUP_STORE)
      await store.clear()
      for (const [id, createdAt] of this.seen) {
        await store.put({id, createdAt})
      }
      await tx.done
    } catch {
      console.warn("[EventDedup] Failed to persist dedup set to IndexedDB")
    }
  }

  /** Load persisted dedup set from IndexedDB (no-op if persistence disabled). */
  async load(): Promise<void> {
    if (!this.persistEnabled) return
    try {
      const db = await this.getDb()
      const all = await db.getAll(DEDUP_STORE)
      const now = Math.floor(Date.now() / 1000)
      for (const entry of all) {
        // Only restore entries still within the time window
        if (Math.abs(now - entry.createdAt) <= this.maxAgeS) {
          this.seen.set(entry.id, entry.createdAt)
        }
      }
    } catch {
      console.warn("[EventDedup] Failed to load dedup set from IndexedDB")
    }
  }
}

/** Shared instance for group event deduplication (persisted across reloads). */
export const groupEventDedup = new EventDedup(DEFAULT_MAX_SIZE, DEFAULT_MAX_AGE_S, true)
