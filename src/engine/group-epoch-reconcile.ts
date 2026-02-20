import {adoptSecureGroupEpochState, type SecureGroupEpochState} from "src/engine/group-epoch-state"
import {getGroupMessageEpochId} from "src/engine/group-epoch-message"

const parseEpochSequence = (epochId: string) => {
  const parts = epochId.split(":")

  if (parts.length < 4) {
    return null
  }

  const sequence = Number(parts[2])

  return Number.isInteger(sequence) && sequence > 0 ? sequence : null
}

const resolveHighestReceivedEpoch = (events: Array<{kind: number; tags: string[][]}>) => {
  let highest: {epochId: string; sequence: number} | null = null

  for (const event of events) {
    const epochId = getGroupMessageEpochId(event)

    if (!epochId) {
      continue
    }

    const sequence = parseEpochSequence(epochId)

    if (
      typeof sequence === "number" &&
      (highest === null ||
        sequence > highest.sequence ||
        (sequence === highest.sequence && epochId > highest.epochId))
    ) {
      highest = {epochId, sequence}
    }
  }

  return highest
}

export const repairSecureGroupEpochStateFromEvents = ({
  groupId,
  currentState,
  events,
}: {
  groupId: string
  currentState: SecureGroupEpochState
  events: Array<{kind: number; tags: string[][]}>
}) => {
  const currentSequence = parseEpochSequence(currentState.epochId) || currentState.sequence
  const highestReceived = resolveHighestReceivedEpoch(events)

  if (!highestReceived || highestReceived.sequence <= currentSequence) {
    return {repaired: false, state: currentState}
  }

  const nextState = adoptSecureGroupEpochState(groupId, {
    epochId: highestReceived.epochId,
    sequence: highestReceived.sequence,
  })

  return {repaired: true, state: nextState}
}
