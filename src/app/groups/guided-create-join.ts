import {parseGroupAddressResult} from "src/domain/group-id"

export type GuidedCreateJoinFlow = "start" | "create" | "join"

export const toGroupSlug = (value: string) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")

export const toRelayHost = (value: string) => (value || "").trim().toLowerCase()

export const buildRelayGroupAddress = (relayHost: string, roomName: string) => {
  const host = toRelayHost(relayHost)
  const slug = toGroupSlug(roomName)

  return host && slug ? `${host}'${slug}` : ""
}

export const getCreateGroupAddressResult = (params: {
  relayHost: string
  roomName: string
  manualAddress: string
}) => {
  const token =
    (params.manualAddress || "").trim() || buildRelayGroupAddress(params.relayHost, params.roomName)

  if (!token) {
    return {
      ok: false as const,
      message: "Add a room name and relay host to continue.",
      canonicalId: "",
    }
  }

  const parsed = parseGroupAddressResult(token)

  if (!parsed.ok) {
    return {
      ok: false as const,
      message: "Enter a valid group address format before creating.",
      canonicalId: "",
    }
  }

  return {
    ok: true as const,
    message: "",
    canonicalId: parsed.value.canonicalId,
  }
}
