import {describe, expect, it} from "vitest"
import {errTransportResult, okTransportResult} from "../../../src/engine/group-transport-contracts"

describe("engine/group-transport-contracts", () => {
  it("creates deterministic success results", () => {
    expect(okTransportResult({id: "value"})).toEqual({
      ok: true,
      value: {id: "value"},
    })
  })

  it("creates deterministic failure results", () => {
    expect(
      errTransportResult("GROUP_TRANSPORT_VALIDATION_FAILED", "Validation failed", false, {
        field: "groupId",
      }),
    ).toEqual({
      ok: false,
      code: "GROUP_TRANSPORT_VALIDATION_FAILED",
      message: "Validation failed",
      retryable: false,
      details: {field: "groupId"},
    })
  })
})
