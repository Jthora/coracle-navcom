import type {CapacitorConfig} from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "app.navcom",
  appName: "Navcom",
  webDir: "dist",
  android: {
    adjustMarginsForEdgeToEdge: false,
  },
  // Use this for live reload https://capacitorjs.com/docs/guides/live-reload
  // server: {
  //   url: "http://192.168.1.115:5173",
  //   cleartext: true
  // },
}

export default config
