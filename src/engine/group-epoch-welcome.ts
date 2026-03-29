import type {TrustedEvent} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"

export type SecureGroupWelcomePayload = {
  v: 1
  group_id: string
  epoch_id: string
  epoch_sequence: number
  transport_mode: "secure-nip-ee"
  creator_pubkey: string
  creator_pq_key_id: string
  created_at: number
}

export type PublishSecureGroupWelcomeInput = {
  groupId: string
  epochId: string
  epochSequence: number
  creatorPubkey: string
  creatorPqKeyId: string
}

export type ParseSecureGroupWelcomeResult =
  | {ok: true; payload: SecureGroupWelcomePayload}
  | {ok: false; reason: string}

export const buildSecureGroupWelcomeEvent = (input: PublishSecureGroupWelcomeInput) => {
  const now = Math.floor(Date.now() / 1000)

  const payload: SecureGroupWelcomePayload = {
    v: 1,
    group_id: input.groupId,
    epoch_id: input.epochId,
    epoch_sequence: input.epochSequence,
    transport_mode: "secure-nip-ee",
    creator_pubkey: input.creatorPubkey,
    creator_pq_key_id: input.creatorPqKeyId,
    created_at: now,
  }

  return {
    kind: GROUP_KINDS.NIP_EE.WELCOME,
    content: JSON.stringify(payload),
    tags: [
      ["h", input.groupId],
      ["d", input.groupId],
      ["epoch", input.epochId],
      ["epoch_seq", String(input.epochSequence)],
      ["transport", "secure-nip-ee"],
    ],
  }
}

export const parseSecureGroupWelcome = (event: TrustedEvent): ParseSecureGroupWelcomeResult => {
  if (event.kind !== GROUP_KINDS.NIP_EE.WELCOME) {
    return {ok: false, reason: `Expected kind ${GROUP_KINDS.NIP_EE.WELCOME}, got ${event.kind}`}
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(event.content)
  } catch {
    return {ok: false, reason: "Invalid JSON in WELCOME event content"}
  }

  if (!parsed || typeof parsed !== "object") {
    return {ok: false, reason: "WELCOME content is not an object"}
  }

  const candidate = parsed as Record<string, unknown>

  if (candidate.v !== 1) {
    return {ok: false, reason: `Unsupported WELCOME version: ${candidate.v}`}
  }

  if (typeof candidate.group_id !== "string" || !candidate.group_id) {
    return {ok: false, reason: "Missing or invalid group_id"}
  }

  if (typeof candidate.epoch_id !== "string" || !candidate.epoch_id) {
    return {ok: false, reason: "Missing or invalid epoch_id"}
  }

  if (typeof candidate.epoch_sequence !== "number" || candidate.epoch_sequence < 1) {
    return {ok: false, reason: "Missing or invalid epoch_sequence"}
  }

  if (candidate.transport_mode !== "secure-nip-ee") {
    return {ok: false, reason: `Unsupported transport_mode: ${candidate.transport_mode}`}
  }

  if (typeof candidate.creator_pubkey !== "string" || !candidate.creator_pubkey) {
    return {ok: false, reason: "Missing or invalid creator_pubkey"}
  }

  if (typeof candidate.creator_pq_key_id !== "string" || !candidate.creator_pq_key_id) {
    return {ok: false, reason: "Missing or invalid creator_pq_key_id"}
  }

  if (typeof candidate.created_at !== "number") {
    return {ok: false, reason: "Missing or invalid created_at"}
  }

  return {
    ok: true,
    payload: {
      v: 1,
      group_id: candidate.group_id,
      epoch_id: candidate.epoch_id,
      epoch_sequence: candidate.epoch_sequence,
      transport_mode: "secure-nip-ee",
      creator_pubkey: candidate.creator_pubkey,
      creator_pq_key_id: candidate.creator_pq_key_id,
      created_at: candidate.created_at,
    },
  }
}
