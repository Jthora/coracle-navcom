const GRANULARITY_CHECK_ID = "2.2.2.1.3"

const toFiniteNumber = value => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const toMissingSliceLabels = evidence => {
  const missing = []

  if (!evidence?.hasNetworkGranularity) {
    missing.push("network")
  }

  if (!evidence?.hasReductionGranularity) {
    missing.push("reduction")
  }

  if (!evidence?.hasRenderGranularity) {
    missing.push("render")
  }

  return missing
}

const toGranularityEvidence = usefulness => {
  const checks = Array.isArray(usefulness?.checks) ? usefulness.checks : []
  const granularityCheck = checks.find(check => check?.id === GRANULARITY_CHECK_ID)

  if (!granularityCheck || granularityCheck.pass) {
    return null
  }

  const evidence = granularityCheck?.evidence || {}
  const runCount = toFiniteNumber(evidence.runCount)
  const unknownRate = toFiniteNumber(evidence.unknownRate)

  return {
    runCount,
    unknownRate,
    classifierDistinguishes: Boolean(evidence.classifierDistinguishes),
    missingSliceLabels: toMissingSliceLabels(evidence),
  }
}

export const buildUsefulnessGranularityAction = usefulness => {
  const evidence = toGranularityEvidence(usefulness)

  if (!evidence) {
    return "Capture missing diagnostic evidence called out in baseline-telemetry-usefulness.md."
  }

  const actionParts = []

  if (evidence.runCount === null || evidence.runCount <= 0) {
    actionParts.push("capture baseline runs with `pnpm benchmark:loader:baseline:capture-next`")
  }

  if (evidence.missingSliceLabels.length > 0) {
    actionParts.push(`record ${evidence.missingSliceLabels.join("/")} delay slice evidence`)
  }

  if (!evidence.classifierDistinguishes) {
    actionParts.push("capture at least one classified delay signature (network/reduction/render)")
  }

  if (evidence.unknownRate !== null && evidence.unknownRate > 20) {
    actionParts.push(`reduce unknown classifications to <=20% (currently ${evidence.unknownRate}%)`)
  }

  if (actionParts.length === 0) {
    return "Capture missing diagnostic evidence called out in baseline-telemetry-usefulness.md."
  }

  return `Close telemetry granularity gap (2.2.2.1.3): ${actionParts.join("; ")}.`
}

export const buildUsefulnessGranularityDetail = usefulness => {
  const evidence = toGranularityEvidence(usefulness)

  if (!evidence) {
    return "Telemetry usefulness gate requires additional diagnostic evidence."
  }

  const detailParts = []

  if (evidence.runCount !== null) {
    detailParts.push(`runs=${evidence.runCount}`)
  }

  if (evidence.missingSliceLabels.length > 0) {
    detailParts.push(`missing-slices=${evidence.missingSliceLabels.join("/")}`)
  }

  if (evidence.unknownRate !== null) {
    detailParts.push(`unknown-rate=${evidence.unknownRate}%`)
  }

  if (!evidence.classifierDistinguishes) {
    detailParts.push("no classified delay signatures")
  }

  if (detailParts.length === 0) {
    return "Telemetry usefulness gate requires additional diagnostic evidence."
  }

  return `Granularity evidence gap (${GRANULARITY_CHECK_ID}): ${detailParts.join(", ")}.`
}
