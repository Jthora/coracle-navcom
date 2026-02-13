import {describe, expect, it, vi} from "vitest"
import {Router} from "src/util/router"

describe("util/router lazy registration", () => {
  it("registers lazy routes with loader metadata and matching", () => {
    const router = new Router()
    const loadComponent = vi.fn(async () => ({default: {name: "LazyView"}}))

    router.registerLazy("/lazy/:id", loadComponent, {
      required: ["id"],
      requireSigner: true,
      guard: () => ({ok: true}),
    })

    const match = router.getMatch("/lazy/abc")

    expect(match.params.id).toBe("abc")
    expect(match.route.component).toBeUndefined()
    expect(match.route.loadComponent).toBe(loadComponent)
    expect(match.route.required).toEqual(["id"])
    expect(match.route.requireSigner).toBe(true)
    expect(typeof match.route.guard).toBe("function")
  })

  it("preserves eager route behavior when using register", () => {
    const router = new Router()
    const component = {name: "EagerView"}

    router.register("/eager", component)

    const match = router.getMatch("/eager")

    expect(match.route.component).toBe(component)
    expect(match.route.loadComponent).toBeUndefined()
  })
})
