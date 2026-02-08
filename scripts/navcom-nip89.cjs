const fs = require('fs')
const {generateSecretKey, getPublicKey, finalizeEvent, nip19} = require('nostr-tools')
const {Relay} = require('nostr-tools/relay')

const identifier = 'navcom'
const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.mutinywallet.com',
  'wss://offchain.pub',
  'wss://purplepag.es',
]

async function main() {
  const sk = generateSecretKey()
  const pk = getPublicKey(sk)
  const npub = nip19.npubEncode(pk)
  const nsec = nip19.nsecEncode(sk)

  const content = {
    name: 'Navcom',
    about: 'Navcom Nostr client by Archangel',
    homepage: 'https://navcom.app',
  }

  const unsigned = {
    kind: 31990,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', identifier],
    ],
    content: JSON.stringify(content),
  }

  const event = finalizeEvent(unsigned, sk)

  fs.writeFileSync('./.navcom-app-key.txt', `npub=${npub}\nnsec=${nsec}\npubhex=${pk}\nclient_id=31990:${pk}:${identifier}\nevent=${JSON.stringify(event, null, 2)}\n`)

  console.log('npub:', npub)
  console.log('pubkey hex:', pk)
  console.log('VITE_CLIENT_ID:', `31990:${pk}:${identifier}`)
  console.log('Event ID:', event.id)
  console.log('secret saved to .navcom-app-key.txt')

  const failures = []
  const successes = []

  for (const url of relays) {
    try {
      const relay = await Relay.connect(url)
      await relay.publish(event)
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

main().catch(err => {
  console.error(err)
  process.exit(1)
})
