export type EvidenceSurface = "dm" | "group"

export type EvidenceCheckStatus = "pass" | "fail" | "pending"

export type EvidenceCheck = {
  id: string
  label: string
  status: EvidenceCheckStatus
  source: string
}

export type SurfaceEvidenceSection = {
  surface: EvidenceSurface
  checks: EvidenceCheck[]
  checkCount: number
  passCount: number
  failCount: number
  pendingCount: number
  claimReady: boolean
  claimBlockReason?: "EVIDENCE_MISSING" | "EVIDENCE_INCOMPLETE"
}

const toSurfaceEvidenceSection = (
  surface: EvidenceSurface,
  checks: EvidenceCheck[],
): SurfaceEvidenceSection => {
  const checkCount = checks.length
  const passCount = checks.filter(check => check.status === "pass").length
  const failCount = checks.filter(check => check.status === "fail").length
  const pendingCount = checks.filter(check => check.status === "pending").length
  const claimReady = checkCount > 0 && failCount === 0 && pendingCount === 0

  return {
    surface,
    checks,
    checkCount,
    passCount,
    failCount,
    pendingCount,
    claimReady,
    claimBlockReason: claimReady
      ? undefined
      : checkCount === 0
        ? "EVIDENCE_MISSING"
        : "EVIDENCE_INCOMPLETE",
  }
}

export const buildSurfaceSeparatedEvidenceReport = ({
  dmChecks,
  groupChecks,
}: {
  dmChecks: EvidenceCheck[]
  groupChecks: EvidenceCheck[]
}) => {
  const dm = toSurfaceEvidenceSection("dm", dmChecks)
  const group = toSurfaceEvidenceSection("group", groupChecks)

  return {
    dm,
    group,
    dmClaimReady: dm.claimReady,
    groupClaimReady: group.claimReady,
  }
}

const toStatusMarker = (status: EvidenceCheckStatus) => {
  if (status === "pass") return "✅"
  if (status === "pending") return "⏳"

  return "❌"
}

const toTitle = (surface: EvidenceSurface) =>
  surface === "dm" ? "DM Evidence Section" : "Group Evidence Section"

export const toSurfaceEvidenceMarkdown = (section: SurfaceEvidenceSection) => {
  const heading = `## ${toTitle(section.surface)}`
  const summary = `Claim readiness: ${section.claimReady ? "ready" : "blocked"}`
  const reason = section.claimReady
    ? ""
    : `Block reason: ${section.claimBlockReason || "EVIDENCE_INCOMPLETE"}`
  const checks =
    section.checks.length === 0
      ? "- No evidence checks recorded yet."
      : section.checks
          .map(
            check =>
              `- ${toStatusMarker(check.status)} ${check.label} (${check.id}) — source: ${check.source}`,
          )
          .join("\n")

  return [heading, summary, reason, checks].filter(Boolean).join("\n")
}
