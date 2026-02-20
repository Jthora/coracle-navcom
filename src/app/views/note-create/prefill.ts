import {last} from "@welshman/lib"
import {Router} from "@welshman/router"
import {Address, isReplaceable, toNostrURI} from "@welshman/util"
import * as nip19 from "nostr-tools/nip19"

export const createPubkeyEncoder = () => ({
  encode: (pubkey: string) => {
    const relays = Router.get().FromPubkeys([pubkey]).limit(3).getUrls()
    const nprofile = nip19.nprofileEncode({pubkey, relays})

    return toNostrURI(nprofile)
  },
  decode: (link: string) => {
    // @ts-ignore
    return nip19.decode(last(link.split(":"))).data.pubkey
  },
})

export const prefillNoteCreateContent = ({
  editor,
  quote,
  pubkey,
  sessionPubkey,
  pubkeyEncoder,
}: {
  editor: any
  quote: any
  pubkey: string | null
  sessionPubkey: string
  pubkeyEncoder: {encode: (pubkey: string) => string}
}) => {
  if (quote && isReplaceable(quote)) {
    const relays = Router.get().Event(quote).limit(3).getUrls()
    const naddr = Address.fromEvent(quote, relays).toNaddr()

    editor.commands.insertContent("\n")
    editor.commands.insertNAddr({bech32: toNostrURI(naddr)})

    return
  }

  if (quote) {
    const nevent = nip19.neventEncode({
      id: quote.id,
      kind: quote.kind,
      author: quote.pubkey,
      relays: Router.get().Event(quote).limit(3).getUrls(),
    })

    editor.commands.insertContent("\n")
    editor.commands.insertNEvent({bech32: toNostrURI(nevent)})

    return
  }

  if (pubkey && pubkey !== sessionPubkey && !editor.getText({blockSeparator: "\n"}).trim()) {
    editor.commands.insertNProfile({bech32: pubkeyEncoder.encode(pubkey)})
  }
}
