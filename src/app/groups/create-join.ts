import {parseGroupAddressResult} from "src/domain/group-id"

export type GroupPolicyPrompt = {
  level: "info" | "warning"
  message: string
}

export const buildCreatePolicyPrompts = (groupId: string): GroupPolicyPrompt[] => {
  const parsed = parseGroupAddressResult(groupId)

  if (!parsed.ok) {
    return [{level: "warning", message: "Use a valid group address before creating."}]
  }

  const prompts: GroupPolicyPrompt[] = [
    {level: "info", message: "Baseline mode publishes relay-managed group events (NIP-29 lane)."},
  ]

  if (parsed.value.kind !== "relay") {
    prompts.push({
      level: "warning",
      message: "Moderation and settings routes are limited for non-relay group identifiers.",
    })
  }

  return prompts
}

export const buildJoinPolicyPrompts = (groupAddress: string): GroupPolicyPrompt[] => {
  const parsed = parseGroupAddressResult(groupAddress)

  if (!parsed.ok) {
    return [
      {level: "warning", message: "Join requires a valid group address from an invite or relay."},
    ]
  }

  return [
    {
      level: "info",
      message: "Join requests use relay-managed membership events and await relay acknowledgement.",
    },
  ]
}
