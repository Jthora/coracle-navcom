const {Relay} = require('nostr-tools/relay')

const event = {
  kind: 31990,
  created_at: 1770523332,
  tags: [["d", "navcom"]],
  content: "{\"name\":\"Navcom\",\"about\":\"Navcom Nostr client by Archangel\",\"homepage\":\"https://navcom.app\"}",
  pubkey: "ed71ea1cea9e6afc11eedcbec9c6ca8f144c1709d0b10d3d9dd1f7c05dccf26f",
  id: "3b9a9369f559208f1758d39809f62943545c2ef767dd061893cde2ca6d98cf2a",
  sig: "4dddf49224f9add1d008f660f38932354fd188f4ad165bdf28a429d8d85ca298d2843cc474a19833607534b3e77344ddd604c9e29d703522a1694bbace5904e6",
}

const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.land',
  'wss://eden.nostr.land',
  'wss://relay.nostr.info',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://purplepag.es',
  'wss://nostr.wine',
  'wss://cache1.primal.net',
]

async function publishAll() {
  const successes = []
  const failures = []

  for (const url of relays) {
    try {
      const relay = await Relay.connect(url, {connectTimeout: 5000})
      await Promise.race([
        relay.publish(event),
        new Promise((_, rej) => setTimeout(() => rej(new Error('publish timeout')), 8000)),
      ])
      successes.push(url)
      relay.close()
    } catch (e) {
      failures.push({url, error: e.message})
    }
  }

  console.log('Published to:', successes)
  if (failures.length) {
    console.log('Failed relays:', failures)
  }
}

publishAll().catch(err => {
  console.error(err)
  process.exit(1)
})
