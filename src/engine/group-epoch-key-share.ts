import {GROUP_KINDS} from "src/domain/group-kinds"
import {
  mlKemEncapsulate,
  mlKemDecapsulate,
  hkdfDeriveKey,
  aesGcmEncrypt,
  aesGcmDecrypt,
  importAesGcmKey,
  randomNonce,
  bytesToBase64,
  base64ToBytes,
  stringToBytes,
} from "src/engine/pqc/crypto-provider"
import {resolvePeerPqPublicKey} from "src/engine/pqc/pq-key-lifecycle"

export type EpochKeyShareEnvelope = {
  v: 1
  group_id: string
  epoch_id: string
  epoch_sequence: number
  shares: EpochKeyShareRecipientBundle[]
  created_at: number
}

export type EpochKeyShareRecipientBundle = {
  pk_ref: string
  kem_alg: "mlkem768"
  kem_ct: string
  wrapped_key: string
  wrap_nonce: string
}

export type PublishEpochKeyShareInput = {
  groupId: string
  epochId: string
  epochSequence: number
  epochMasterKey: Uint8Array
  recipients: string[]
}

export type BuildEpochKeyShareResult = {
  ok: true
  template: {kind: number; content: string; tags: string[][]}
  sharedTo: string[]
  missingPqKey: string[]
}

export type ReceiveEpochKeyShareResult =
  | {ok: true; epochId: string; epochSequence: number; groupId: string; masterKey: Uint8Array}
  | {ok: false; reason: string}

const HKDF_INFO = "navcom-epoch-key-share-v1"

const wrapKeyForRecipient = async (
  epochMasterKey: Uint8Array,
  recipientPqPubKey: Uint8Array,
  recipientPubkey: string,
  groupId: string,
): Promise<EpochKeyShareRecipientBundle> => {
  const {cipherText, sharedSecret} = mlKemEncapsulate(recipientPqPubKey)

  const salt = stringToBytes(`navcom-epoch-key-share:${groupId}:${recipientPubkey}`)
  const info = stringToBytes(HKDF_INFO)
  let wrapKeyBytes: Uint8Array
  try {
    wrapKeyBytes = await hkdfDeriveKey(sharedSecret, salt, info, 32)
  } finally {
    sharedSecret.fill(0)
    salt.fill(0)
  }

  const nonce = randomNonce()
  const wrapKey = await importAesGcmKey(wrapKeyBytes)
  const wrappedKey = await aesGcmEncrypt(epochMasterKey, wrapKey, nonce)

  return {
    pk_ref: recipientPubkey,
    kem_alg: "mlkem768",
    kem_ct: bytesToBase64(cipherText),
    wrapped_key: bytesToBase64(wrappedKey),
    wrap_nonce: bytesToBase64(nonce),
  }
}

export const buildEpochKeyShareEvent = async (
  input: PublishEpochKeyShareInput,
): Promise<BuildEpochKeyShareResult> => {
  const sharedTo: string[] = []
  const missingPqKey: string[] = []
  const shares: EpochKeyShareRecipientBundle[] = []

  for (const recipient of input.recipients) {
    const pqPubKey = await resolvePeerPqPublicKey(recipient)

    if (!pqPubKey) {
      missingPqKey.push(recipient)
      continue
    }

    const bundle = await wrapKeyForRecipient(
      input.epochMasterKey,
      pqPubKey,
      recipient,
      input.groupId,
    )
    shares.push(bundle)
    sharedTo.push(recipient)
  }

  const envelope: EpochKeyShareEnvelope = {
    v: 1,
    group_id: input.groupId,
    epoch_id: input.epochId,
    epoch_sequence: input.epochSequence,
    shares,
    created_at: Math.floor(Date.now() / 1000),
  }

  const tags: string[][] = [
    ["h", input.groupId],
    ["epoch", input.epochId],
    ["epoch_seq", String(input.epochSequence)],
    ...sharedTo.map(pk => ["p", pk]),
  ]

  return {
    ok: true,
    template: {
      kind: GROUP_KINDS.NIP_EE.EPOCH_KEY_SHARE,
      content: JSON.stringify(envelope),
      tags,
    },
    sharedTo,
    missingPqKey,
  }
}

export const receiveEpochKeyShare = async (
  content: string,
  recipientPubkey: string,
  recipientPqSecretKey: Uint8Array,
): Promise<ReceiveEpochKeyShareResult> => {
  let envelope: EpochKeyShareEnvelope
  try {
    envelope = JSON.parse(content)
  } catch {
    return {ok: false, reason: "Invalid JSON in key share event content"}
  }

  if (!envelope || envelope.v !== 1) {
    return {ok: false, reason: "Unsupported key share envelope version"}
  }

  if (!Array.isArray(envelope.shares)) {
    return {ok: false, reason: "Missing shares array"}
  }

  const bundle = envelope.shares.find(s => s.pk_ref === recipientPubkey)

  if (!bundle) {
    return {ok: false, reason: "Not a recipient of this key share"}
  }

  try {
    const kemCt = base64ToBytes(bundle.kem_ct)
    const sharedSecret = mlKemDecapsulate(kemCt, recipientPqSecretKey)

    const salt = stringToBytes(`navcom-epoch-key-share:${envelope.group_id}:${recipientPubkey}`)
    const info = stringToBytes(HKDF_INFO)
    let wrapKeyBytes: Uint8Array
    try {
      wrapKeyBytes = await hkdfDeriveKey(sharedSecret, salt, info, 32)
    } finally {
      sharedSecret.fill(0)
      salt.fill(0)
    }

    const wrapKey = await importAesGcmKey(wrapKeyBytes)
    const wrappedKey = base64ToBytes(bundle.wrapped_key)
    const nonce = base64ToBytes(bundle.wrap_nonce)
    const masterKey = await aesGcmDecrypt(wrappedKey, wrapKey, nonce)

    return {
      ok: true,
      epochId: envelope.epoch_id,
      epochSequence: envelope.epoch_sequence,
      groupId: envelope.group_id,
      masterKey: new Uint8Array(masterKey),
    }
  } catch (error) {
    console.warn("[PQC] Key share unwrap failed:", error)
    return {
      ok: false,
      reason: "Key share unwrap failed",
    }
  }
}
