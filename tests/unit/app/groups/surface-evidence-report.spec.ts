import {describe, expect, it} from "vitest"
import {
  buildSurfaceSeparatedEvidenceReport,
  toSurfaceEvidenceMarkdown,
} from "src/app/groups/surface-evidence-report"

describe("app/groups surface-evidence-report", () => {
  it("keeps DM and Group claim readiness separated", () => {
    const result = buildSurfaceSeparatedEvidenceReport({
      dmChecks: [
        {
          id: "dm-strict-send",
          label: "DM strict send pass",
          status: "pass",
          source: "tests/unit/engine/pqc/secure-path-integration.spec.ts",
        },
      ],
      groupChecks: [],
    })

    expect(result.dmClaimReady).toBe(true)
    expect(result.groupClaimReady).toBe(false)
    expect(result.group.claimBlockReason).toBe("EVIDENCE_MISSING")
  })

  it("requires group-specific checks for group claim readiness", () => {
    const result = buildSurfaceSeparatedEvidenceReport({
      dmChecks: [
        {
          id: "dm-strict-send",
          label: "DM strict send pass",
          status: "pass",
          source: "tests/unit/engine/pqc/secure-path-integration.spec.ts",
        },
      ],
      groupChecks: [
        {
          id: "group-max-create-join-chat",
          label: "Group Max create/join/chat strict flow",
          status: "pass",
          source: "tests/unit/engine/group-transport.spec.ts",
        },
        {
          id: "group-tier-policy-telemetry",
          label: "Tier-policy mission-tier and override telemetry visibility",
          status: "pass",
          source: "tests/unit/engine/group-transport.spec.ts",
        },
      ],
    })

    expect(result.dmClaimReady).toBe(true)
    expect(result.groupClaimReady).toBe(true)
    expect(result.group.claimBlockReason).toBeUndefined()
  })

  it("renders explicit surface-separated markdown sections", () => {
    const report = buildSurfaceSeparatedEvidenceReport({
      dmChecks: [
        {
          id: "dm-strict-send",
          label: "DM strict send pass",
          status: "pass",
          source: "tests/unit/engine/pqc/secure-path-integration.spec.ts",
        },
      ],
      groupChecks: [
        {
          id: "group-strict-chat",
          label: "Group strict chat pass",
          status: "pending",
          source: "tests/unit/engine/group-transport.spec.ts",
        },
      ],
    })

    const dmMarkdown = toSurfaceEvidenceMarkdown(report.dm)
    const groupMarkdown = toSurfaceEvidenceMarkdown(report.group)

    expect(dmMarkdown).toContain("## DM Evidence Section")
    expect(groupMarkdown).toContain("## Group Evidence Section")
    expect(groupMarkdown).toContain("Claim readiness: blocked")
    expect(groupMarkdown).toContain("EVIDENCE_INCOMPLETE")
  })
})
