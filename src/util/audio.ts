import EventEmitter from "events"
import type Hls from "hls.js"

export class AudioController extends EventEmitter {
  completed = false
  progress = 0
  interval: any = null
  audio = new Audio()
  requiresHls = false
  loadingHls: Promise<void> | null = null
  hls?: Hls

  constructor(readonly url) {
    super()

    if (url.endsWith("m3u8")) {
      this.requiresHls = true
      this.audio.src = url
    } else {
      this.audio.src = url
    }
  }

  ensureHls = async () => {
    if (!this.requiresHls || this.hls) {
      return
    }

    if (!this.loadingHls) {
      this.loadingHls = import("hls.js")
        .then(({default: Hls}) => {
          this.hls = new Hls()
          this.hls.loadSource(this.url)
          this.hls.attachMedia(this.audio)
        })
        .catch(error => {
          this.emit("error", error)
          throw error
        })
        .finally(() => {
          this.loadingHls = null
        })
    }

    await this.loadingHls
  }

  reportProgress = () => {
    const {currentTime, duration} = this.audio

    this.progress = currentTime ? currentTime / duration : 0

    this.emit("progress", this.progress)

    if (this.progress === 1 && !this.completed) {
      this.completed = true
      this.emit("completed")
    }
  }

  setProgress = progress => {
    this.audio.currentTime = Math.round(this.audio.duration * progress)
    this.reportProgress()
  }

  play = async () => {
    if (!this.interval) {
      await this.ensureHls()
      await this.audio.play()
      this.emit("play")
      this.interval = setInterval(this.reportProgress, 30)
    }
  }

  pause = () => {
    if (this.interval) {
      this.audio.pause()
      this.emit("pause")

      clearInterval(this.interval as unknown as number)

      this.interval = null
    }
  }

  toggle = async () => {
    if (this.interval) {
      this.pause()
    } else {
      await this.play()
    }
  }

  cleanup() {
    clearInterval(this.interval as unknown as number)

    this.hls?.destroy()
    this.audio.pause()
  }
}
