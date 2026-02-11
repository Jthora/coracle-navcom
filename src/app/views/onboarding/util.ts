export const uniqueRelays = (relays: string[][]) => {
  const seen = new Set<string>()
  return relays.filter(([, url]) => {
    const key = url.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const uniqueFollowTags = (pubkeys: string[], tagger: (pk: string) => string[]) => {
  const seen = new Set<string>()
  const tags: string[][] = []

  for (const pk of pubkeys) {
    const key = pk.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tagger(pk))
  }

  return tags
}
