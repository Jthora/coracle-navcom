class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    const entries = Array.from(this.store.keys())
    return entries[index] ?? null
  }

  get length(): number {
    return this.store.size
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

if (typeof globalThis.localStorage === "undefined") {
  const memoryStorage = new MemoryStorage()
  // @ts-expect-error attaching to global for test env
  globalThis.localStorage = memoryStorage
  // @ts-expect-error aligning sessionStorage for tests
  globalThis.sessionStorage = memoryStorage
}
