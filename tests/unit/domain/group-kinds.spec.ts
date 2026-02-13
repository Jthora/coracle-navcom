import {describe, expect, it} from "vitest"
import {
  GROUP_KINDS,
  classifyGroupEventKind,
  isGroupKind,
  isNip29GroupKind,
  isNipEeGroupKind,
} from "src/domain/group-kinds"

describe("group-kinds", () => {
  it("detects NIP-29 kinds", () => {
    expect(isNip29GroupKind(GROUP_KINDS.NIP29.METADATA)).toBe(true)
    expect(isNip29GroupKind(GROUP_KINDS.NIP29.PUT_USER)).toBe(true)
    expect(isNip29GroupKind(1)).toBe(false)
  })

  it("detects NIP-EE kinds", () => {
    expect(isNipEeGroupKind(GROUP_KINDS.NIP_EE.KEY_PACKAGE)).toBe(true)
    expect(isNipEeGroupKind(GROUP_KINDS.NIP_EE.GROUP_EVENT)).toBe(true)
    expect(isNipEeGroupKind(1)).toBe(false)
  })

  it("detects group kind across protocols", () => {
    expect(isGroupKind(GROUP_KINDS.NIP29.EDIT_METADATA)).toBe(true)
    expect(isGroupKind(GROUP_KINDS.NIP_EE.WELCOME)).toBe(true)
    expect(isGroupKind(31990)).toBe(false)
  })

  it("classifies event types", () => {
    expect(classifyGroupEventKind(GROUP_KINDS.NIP29.METADATA)).toBe("metadata")
    expect(classifyGroupEventKind(GROUP_KINDS.NIP29.PUT_USER)).toBe("membership")
    expect(classifyGroupEventKind(GROUP_KINDS.NIP29.DELETE_EVENT)).toBe("moderation")
    expect(classifyGroupEventKind(GROUP_KINDS.NIP_EE.GROUP_EVENT)).toBe("message")
    expect(classifyGroupEventKind(GROUP_KINDS.NIP_EE.KEY_PACKAGE)).toBe("key-package")
    expect(classifyGroupEventKind(1)).toBe("unknown")
  })
})
