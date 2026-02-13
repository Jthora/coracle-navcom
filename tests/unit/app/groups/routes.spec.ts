import {describe, expect, it} from "vitest"
import {registerGroupRoutesWithComponent} from "src/app/groups/route-config"

describe("app/groups routes", () => {
  it("registers expected groups route tree", () => {
    const calls: Array<{path: string; component: unknown; opts: Record<string, unknown>}> = []

    const list = {name: "GroupList"}
    const create = {name: "GroupCreateJoin"}
    const detailComponent = {name: "GroupDetail"}
    const chatComponent = {name: "GroupConversation"}
    const adminComponent = {name: "GroupSettingsAdmin"}

    const router = {
      register: (path: string, component: unknown, opts: Record<string, unknown> = {}) => {
        calls.push({path, component, opts})
      },
    } as any

    registerGroupRoutesWithComponent(router, {
      list,
      create,
      detail: detailComponent,
      chat: chatComponent,
      admin: adminComponent,
    })

    expect(calls.map(c => c.path)).toEqual([
      "/groups",
      "/groups/create",
      "/groups/:groupId",
      "/groups/:groupId/chat",
      "/groups/:groupId/members",
      "/groups/:groupId/moderation",
      "/groups/:groupId/settings",
    ])

    const detail = calls.find(c => c.path === "/groups/:groupId")
    const chat = calls.find(c => c.path === "/groups/:groupId/chat")
    const moderation = calls.find(c => c.path === "/groups/:groupId/moderation")
    const settings = calls.find(c => c.path === "/groups/:groupId/settings")
    const groupsList = calls.find(c => c.path === "/groups")
    const groupsCreate = calls.find(c => c.path === "/groups/create")

    expect(detail?.opts.requireSigner).toBe(true)
    expect(detail?.opts.required).toEqual(["groupId"])
    expect(detail?.opts.serializers).toBeDefined()
    expect(groupsCreate?.opts.serializers).toBeDefined()
    expect(typeof detail?.opts.guard).toBe("function")
    expect(typeof moderation?.opts.guard).toBe("function")
    expect(groupsList?.component).toBe(list)
    expect(groupsCreate?.component).toBe(create)
    expect(detail?.component).toBe(detailComponent)
    expect(chat?.component).toBe(chatComponent)
    expect(moderation?.component).toBe(adminComponent)
    expect(settings?.component).toBe(adminComponent)
  })
})
