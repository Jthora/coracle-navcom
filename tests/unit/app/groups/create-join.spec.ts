import {describe, expect, it} from "vitest"
import {buildCreatePolicyPrompts, buildJoinPolicyPrompts} from "src/app/groups/create-join"

describe("app/groups create-join prompts", () => {
  it("returns warning prompt for invalid create input", () => {
    const prompts = buildCreatePolicyPrompts("bad group id")

    expect(prompts[0].level).toBe("warning")
  })

  it("returns baseline info and relay warning for opaque create ids", () => {
    const prompts = buildCreatePolicyPrompts("ops")

    expect(prompts.some(prompt => prompt.level === "info")).toBe(true)
    expect(prompts.some(prompt => prompt.level === "warning")).toBe(true)
  })

  it("returns join warning for invalid join input", () => {
    const prompts = buildJoinPolicyPrompts("")

    expect(prompts[0].level).toBe("warning")
  })

  it("returns informational join prompt for valid input", () => {
    const prompts = buildJoinPolicyPrompts("relay.example'ops")

    expect(prompts[0].level).toBe("info")
  })
})
