type Listener = (...args: any[]) => void

export class EventEmitter {
  private handlerMap = new Map<string | symbol, Set<Listener>>()

  on(event: string | symbol, listener: Listener) {
    const group = this.handlerMap.get(event) || new Set<Listener>()

    group.add(listener)
    this.handlerMap.set(event, group)

    return this
  }

  addListener(event: string | symbol, listener: Listener) {
    return this.on(event, listener)
  }

  once(event: string | symbol, listener: Listener) {
    const wrapper: Listener = (...args: any[]) => {
      this.off(event, wrapper)
      listener(...args)
    }

    return this.on(event, wrapper)
  }

  off(event: string | symbol, listener: Listener) {
    const group = this.handlerMap.get(event)

    if (!group) {
      return this
    }

    group.delete(listener)

    if (group.size === 0) {
      this.handlerMap.delete(event)
    }

    return this
  }

  removeListener(event: string | symbol, listener: Listener) {
    return this.off(event, listener)
  }

  removeAllListeners(event?: string | symbol) {
    if (event === undefined) {
      this.handlerMap.clear()
      return this
    }

    this.handlerMap.delete(event)

    return this
  }

  emit(event: string | symbol, ...args: any[]) {
    const group = this.handlerMap.get(event)

    if (!group || group.size === 0) {
      return false
    }

    for (const listener of [...group]) {
      listener(...args)
    }

    return true
  }

  listenerCount(event: string | symbol) {
    return this.handlerMap.get(event)?.size || 0
  }

  listeners(event: string | symbol) {
    return [...(this.handlerMap.get(event) || [])]
  }
}

export default EventEmitter
