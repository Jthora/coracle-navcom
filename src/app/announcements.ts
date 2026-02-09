import {toHex} from "src/util/nostr"

export const ANNOUNCEMENTS_PATH = "/announcements"
export const ANNOUNCEMENTS_TAG = "starcom_announcements"
export const ANNOUNCEMENTS_NPUB = "npub1n4ch3caz4w7gj3aswmvzmlj89grp390mnuu7yerlqecqx8999lmspgl00g"

const announcementsPubkey = toHex(ANNOUNCEMENTS_NPUB)

if (!announcementsPubkey) {
  throw new Error("Invalid announcements npub")
}

export const ANNOUNCEMENTS_PUBKEY = announcementsPubkey
