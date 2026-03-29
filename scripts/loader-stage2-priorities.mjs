const sortTaskIds = (left, right) => {
  const leftParts = left.split(".").map(part => Number(part))
  const rightParts = right.split(".").map(part => Number(part))
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const leftValue = Number.isFinite(leftParts[index]) ? leftParts[index] : 0
    const rightValue = Number.isFinite(rightParts[index]) ? rightParts[index] : 0

    if (leftValue !== rightValue) {
      return leftValue - rightValue
    }
  }

  return 0
}

export const extractOutstandingStage2Tasks = trackerMarkdown => {
  if (typeof trackerMarkdown !== "string" || trackerMarkdown.length === 0) {
    return []
  }

  const stage2Heading = "## Stage 2 — Baseline and Observability"
  const stage3Heading = "## Stage 3 — Diagnosis and Prioritization"
  const stage2StartIndex = trackerMarkdown.indexOf(stage2Heading)

  if (stage2StartIndex < 0) {
    return []
  }

  const stage3StartIndex = trackerMarkdown.indexOf(stage3Heading, stage2StartIndex)
  const stage2Section =
    stage3StartIndex >= 0
      ? trackerMarkdown.slice(stage2StartIndex, stage3StartIndex)
      : trackerMarkdown.slice(stage2StartIndex)
  const regex = /^\s*- \[ \] \*\*(2\.\d+\.\d+\.\d+) Task:\*\*\s*(.+)$/gm
  const tasks = []
  const seenTaskIds = new Set()

  for (const match of stage2Section.matchAll(regex)) {
    const taskId = match[1]
    const title = match[2]

    if (!taskId || seenTaskIds.has(taskId)) {
      continue
    }

    seenTaskIds.add(taskId)
    tasks.push({
      id: taskId,
      title: typeof title === "string" ? title.trim() : "",
    })
  }

  return tasks.sort((left, right) => sortTaskIds(left.id, right.id))
}
