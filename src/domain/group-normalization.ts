import type {TrustedEvent} from "@welshman/util"

export type GroupTag = string[]

const sortTagValue = (value?: string) => (value || "").trim().toLowerCase()

export const normalizeGroupTag = (tag: GroupTag): GroupTag => {
  const [key = "", ...values] = tag

  return [key.trim().toLowerCase(), ...values.map(v => (v || "").trim())]
}

export const normalizeGroupTags = (tags: GroupTag[]): GroupTag[] => {
  const normalized = tags.map(normalizeGroupTag)
  const deduped = new Map<string, GroupTag>()

  for (const tag of normalized) {
    deduped.set(tag.join("\u0000"), tag)
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (a[0] !== b[0]) {
      return sortTagValue(a[0]).localeCompare(sortTagValue(b[0]))
    }

    const av = sortTagValue(a[1])
    const bv = sortTagValue(b[1])

    if (av !== bv) {
      return av.localeCompare(bv)
    }

    return a.join("\u0001").localeCompare(b.join("\u0001"))
  })
}

export const normalizeGroupEvent = (event: TrustedEvent): TrustedEvent => ({
  ...event,
  tags: normalizeGroupTags(event.tags as GroupTag[]),
})
