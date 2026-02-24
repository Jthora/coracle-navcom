import {beforeEach, describe, expect, it, vi} from "vitest"
import {clearGroupTelemetryDedupe} from "src/app/groups/telemetry"
import {reportGroupError} from "src/app/groups/error-reporting"
import {GROUP_ENGINE_ERROR_CODE, createGroupEngineError} from "src/domain/group-engine-error"

describe("app/groups error-reporting", () => {
  beforeEach(() => {
    clearGroupTelemetryDedupe()
    ;(window as any).plausible = vi.fn()
  })

  it("classifies permission failures deterministically", () => {
    const result = reportGroupError({
      context: "create",
      error: new Error("Permission denied for action: create"),
      flow: "create",
      groupId: "relay.example'ops",
      source: "test",
    })

    expect(result.code).toBe("GROUP_ERROR_PERMISSION_DENIED")
    expect(result.retryable).toBe(false)

    const [event, payload] = (window as any).plausible.mock.calls[0]

    expect(event).toBe("group_error_reported")
    expect(payload.props.context).toBe("create")
    expect(payload.props.error_code).toBe("GROUP_ERROR_PERMISSION_DENIED")
    expect(payload.props.retryable).toBe(false)
  })

  it("classifies encryption failures deterministically", () => {
    const result = reportGroupError({
      context: "secure-encryption",
      error: new Error("Secure group decrypt validation failed"),
      flow: "chat",
      source: "test",
    })

    expect(result.code).toBe("GROUP_ERROR_ENCRYPTION_FAILED")
    expect(result.retryable).toBe(true)
  })

  it("falls back to unknown code for unclassified errors", () => {
    const result = reportGroupError({
      context: "invite-create",
      error: {foo: "bar"},
      flow: "invite",
      source: "test",
    })

    expect(result.code).toBe("GROUP_ERROR_UNKNOWN")
    expect(result.retryable).toBe(true)
    expect(result.userMessage).toContain("Unknown group error")
  })

  it("maps typed engine codes to stable telemetry error codes", () => {
    const expectations: Array<{
      engineCode: (typeof GROUP_ENGINE_ERROR_CODE)[keyof typeof GROUP_ENGINE_ERROR_CODE]
      expectedErrorCode: string
      retryable: boolean
    }> = [
      {
        engineCode: GROUP_ENGINE_ERROR_CODE.PERMISSION_DENIED,
        expectedErrorCode: "GROUP_ERROR_PERMISSION_DENIED",
        retryable: false,
      },
      {
        engineCode: GROUP_ENGINE_ERROR_CODE.INVALID_INPUT,
        expectedErrorCode: "GROUP_ERROR_INVALID_INPUT",
        retryable: false,
      },
      {
        engineCode: GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED,
        expectedErrorCode: "GROUP_ERROR_CAPABILITY_BLOCKED",
        retryable: false,
      },
      {
        engineCode: GROUP_ENGINE_ERROR_CODE.POLICY_BLOCKED,
        expectedErrorCode: "GROUP_ERROR_POLICY_BLOCKED",
        retryable: false,
      },
      {
        engineCode: GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED,
        expectedErrorCode: "GROUP_ERROR_DISPATCH_FAILED",
        retryable: false,
      },
      {
        engineCode: GROUP_ENGINE_ERROR_CODE.DISPATCH_FAILED,
        expectedErrorCode: "GROUP_ERROR_DISPATCH_FAILED",
        retryable: true,
      },
    ]

    for (const entry of expectations) {
      reportGroupError({
        context: "group-send",
        error: createGroupEngineError({
          code: entry.engineCode,
          message: `engine-${entry.engineCode}`,
          retryable: entry.retryable,
        }),
        flow: "chat",
        source: "test-contract",
      })
    }

    const calls = (window as any).plausible.mock.calls as Array<
      [string, {props: Record<string, unknown>}]
    >

    expect(calls).toHaveLength(expectations.length)

    expectations.forEach((entry, index) => {
      const [event, payload] = calls[index]

      expect(event).toBe("group_error_reported")
      expect(payload.props.error_code).toBe(entry.expectedErrorCode)
      expect(payload.props.retryable).toBe(entry.retryable)
    })
  })
})
