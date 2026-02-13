import {parseGroupAddress} from "src/domain/group-id"

const decodeAs = (name: string, decode: (v: string) => unknown) => (v: string) => ({
  [name]: decode(v),
})

const decodeOptional = (value: string) => decodeURIComponent(value || "").trim()

export const asGroupAddress = {
  encode: (groupId: string) => encodeURIComponent(groupId),
  decode: decodeAs("groupId", value => {
    const parsed = parseGroupAddress(decodeURIComponent(value))

    return parsed?.canonicalId || ""
  }),
}

export const asGroupPath = {
  encode: (groupPath: string) => encodeURIComponent(groupPath),
  decode: decodeAs("groupPath", value => decodeURIComponent(value || "")),
}

export const asGroupInviteMode = {
  encode: (value: string) => encodeURIComponent(value || ""),
  decode: decodeAs("preferredMode", value => {
    const mode = decodeOptional(value)

    if (mode === "baseline-nip29" || mode === "secure-nip-ee") return mode

    return ""
  }),
}

export const asGroupInviteTier = {
  encode: (value: number | string) => encodeURIComponent(String(value ?? "")),
  decode: decodeAs("missionTier", value => {
    const parsed = Number(decodeOptional(value))

    if (parsed === 0 || parsed === 1 || parsed === 2) return parsed

    return null
  }),
}

export const asGroupInviteLabel = {
  encode: (value: string) => encodeURIComponent(value || ""),
  decode: decodeAs("label", value => {
    const decoded = decodeOptional(value)

    return decoded.slice(0, 120)
  }),
}
