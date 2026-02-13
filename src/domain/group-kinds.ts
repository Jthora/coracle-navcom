export const GROUP_KINDS = {
  NIP29: {
    METADATA: 39000,
    ADMINS: 39001,
    MEMBERS: 39002,
    ROLES: 39003,
    PUT_USER: 9000,
    REMOVE_USER: 9001,
    EDIT_METADATA: 9002,
    DELETE_EVENT: 9005,
    CREATE_GROUP: 9007,
    DELETE_GROUP: 9008,
    CREATE_INVITE: 9009,
    JOIN_REQUEST: 9021,
    LEAVE_REQUEST: 9022,
  },
  NIP_EE: {
    KEY_PACKAGE: 443,
    WELCOME: 444,
    GROUP_EVENT: 445,
    KEY_PACKAGE_RELAYS: 10051,
  },
} as const

export type GroupProtocol = "nip29" | "nip-ee"
export type GroupEventClass =
  | "metadata"
  | "membership"
  | "moderation"
  | "message"
  | "key-package"
  | "invite"
  | "unknown"

const nip29MetadataKinds = new Set<number>([
  GROUP_KINDS.NIP29.METADATA,
  GROUP_KINDS.NIP29.ADMINS,
  GROUP_KINDS.NIP29.MEMBERS,
  GROUP_KINDS.NIP29.ROLES,
])

const nip29MembershipKinds = new Set<number>([
  GROUP_KINDS.NIP29.PUT_USER,
  GROUP_KINDS.NIP29.REMOVE_USER,
  GROUP_KINDS.NIP29.JOIN_REQUEST,
  GROUP_KINDS.NIP29.LEAVE_REQUEST,
])

const nip29ModerationKinds = new Set<number>([
  GROUP_KINDS.NIP29.EDIT_METADATA,
  GROUP_KINDS.NIP29.DELETE_EVENT,
  GROUP_KINDS.NIP29.CREATE_GROUP,
  GROUP_KINDS.NIP29.DELETE_GROUP,
  GROUP_KINDS.NIP29.CREATE_INVITE,
])

const nipEeKinds = new Set<number>([
  GROUP_KINDS.NIP_EE.KEY_PACKAGE,
  GROUP_KINDS.NIP_EE.WELCOME,
  GROUP_KINDS.NIP_EE.GROUP_EVENT,
  GROUP_KINDS.NIP_EE.KEY_PACKAGE_RELAYS,
])

export const isNip29GroupKind = (kind: number) =>
  nip29MetadataKinds.has(kind) || nip29MembershipKinds.has(kind) || nip29ModerationKinds.has(kind)

export const isNipEeGroupKind = (kind: number) => nipEeKinds.has(kind)

export const isGroupKind = (kind: number) => isNip29GroupKind(kind) || isNipEeGroupKind(kind)

export const classifyGroupEventKind = (kind: number): GroupEventClass => {
  if (nip29MetadataKinds.has(kind)) return "metadata"
  if (nip29MembershipKinds.has(kind)) return "membership"
  if (nip29ModerationKinds.has(kind)) return "moderation"

  if (kind === GROUP_KINDS.NIP_EE.GROUP_EVENT) return "message"
  if (kind === GROUP_KINDS.NIP_EE.KEY_PACKAGE || kind === GROUP_KINDS.NIP_EE.KEY_PACKAGE_RELAYS) {
    return "key-package"
  }
  if (kind === GROUP_KINDS.NIP_EE.WELCOME) return "invite"

  return "unknown"
}
