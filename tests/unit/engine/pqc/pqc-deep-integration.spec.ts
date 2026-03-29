/**
 * Deep PQC Integration Tests
 *
 * These tests verify the FULL end-to-end cryptographic pipeline:
 * - ML-KEM-768 key sizes match FIPS 203 spec
 * - Full DM encrypt → decrypt round-trip with real ML-KEM keys
 * - Wrong recipient key MUST fail decryption
 * - Tampered ciphertext MUST fail decryption
 * - Tampered AD MUST fail decryption
 * - Multi-recipient: each recipient can decrypt independently
 * - Group epoch: encrypt → decrypt round-trip with HKDF-derived keys
 * - Cross-epoch isolation: epoch-1 key CANNOT decrypt epoch-2 messages
 * - Nonces are unique per encryption
 * - Key material sizes match ML-KEM-768 spec
 */

import {describe, it, expect} from "vitest"
import {
  mlKemKeygen,
  mlKemEncapsulate,
  mlKemDecapsulate,
  randomBytes,
  aesGcmEncrypt,
  aesGcmDecrypt,
  importAesGcmKey,
  randomNonce,
  hkdfDeriveKey,
  stringToBytes,
  bytesToString,
  bytesToBase64,
  base64ToBytes,
} from "src/engine/pqc/crypto-provider"
import {buildDmPqcEnvelope} from "src/engine/pqc/dm-envelope"
import {parseDmPqcEnvelopeContent} from "src/engine/pqc/dm-receive-envelope"
import {
  encodeSecureGroupEpochContent,
  decodeSecureGroupEpochContent,
} from "src/engine/group-epoch-content"
import {
  generateEpochKey,
  deriveEpochContentKey,
  deriveEpochIntegrityKey,
} from "src/engine/pqc/epoch-key-manager"
import {generatePqcKeyPair} from "src/engine/pqc/key-publication"

describe("PQC Deep Integration — ML-KEM-768 FIPS 203 Compliance", () => {
  it("ML-KEM-768 key sizes match FIPS 203: pk=1184, sk=2400, ct=1088, ss=32", () => {
    const kp = mlKemKeygen()
    expect(kp.publicKey.length).toBe(1184) // FIPS 203 ML-KEM-768 pk size
    expect(kp.secretKey.length).toBe(2400) // FIPS 203 ML-KEM-768 sk size

    const {cipherText, sharedSecret} = mlKemEncapsulate(kp.publicKey)
    expect(cipherText.length).toBe(1088) // FIPS 203 ML-KEM-768 ct size
    expect(sharedSecret.length).toBe(32) // 256-bit shared secret
  })

  it("encapsulate/decapsulate are IND-CCA2 consistent (100 iterations)", () => {
    const kp = mlKemKeygen()
    for (let i = 0; i < 100; i++) {
      const {cipherText, sharedSecret: ss1} = mlKemEncapsulate(kp.publicKey)
      const ss2 = mlKemDecapsulate(cipherText, kp.secretKey)
      expect(ss1).toEqual(ss2)
    }
  })

  it("different keypairs produce different shared secrets for same ciphertext", () => {
    const kp1 = mlKemKeygen()
    const kp2 = mlKemKeygen()
    const {cipherText, sharedSecret: ss1} = mlKemEncapsulate(kp1.publicKey)
    const ss2 = mlKemDecapsulate(cipherText, kp2.secretKey)
    expect(ss1).not.toEqual(ss2) // IND-CCA2: wrong key → different SS
  })
})

describe("PQC Deep Integration — DM Envelope Full Round-Trip", () => {
  it("full pipeline: keygen → encapsulate → HKDF → AES-GCM encrypt → decrypt → plaintext", async () => {
    // Alice generates ML-KEM keypair
    const alice = mlKemKeygen()
    // Bob generates ML-KEM keypair
    const bob = mlKemKeygen()

    const recipientKeys = new Map<string, Uint8Array>([
      ["alice-pub", alice.publicKey],
      ["bob-pub", bob.publicKey],
    ])

    const originalMessage = "Top secret message: rendezvous at grid ref 51.5074,-0.1278"

    // Build envelope
    const built = await buildDmPqcEnvelope({
      plaintext: originalMessage,
      senderPubkey: "sender-pub",
      recipients: ["alice-pub", "bob-pub"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys: recipientKeys,
      createdAt: 1739836800,
      messageId: "deep-test-1",
    })

    expect(built.ok).toBe(true)
    if (!built.ok) return

    // Verify the ciphertext does NOT contain the plaintext
    expect(built.content).not.toContain(originalMessage)
    expect(built.content).not.toContain(btoa(originalMessage))

    // Alice decrypts
    const aliceParsed = await parseDmPqcEnvelopeContent(built.content, {
      recipientSecretKey: alice.secretKey,
      recipientPubkey: "alice-pub",
      senderPubkey: "sender-pub",
      expectedSenderPubkey: "sender-pub",
      expectedRecipientPubkey: "alice-pub",
    })
    expect(aliceParsed.ok).toBe(true)
    if (aliceParsed.ok) expect(aliceParsed.plaintext).toBe(originalMessage)

    // Bob decrypts
    const bobParsed = await parseDmPqcEnvelopeContent(built.content, {
      recipientSecretKey: bob.secretKey,
      recipientPubkey: "bob-pub",
      senderPubkey: "sender-pub",
      expectedSenderPubkey: "sender-pub",
      expectedRecipientPubkey: "bob-pub",
    })
    expect(bobParsed.ok).toBe(true)
    if (bobParsed.ok) expect(bobParsed.plaintext).toBe(originalMessage)
  })

  it("wrong recipient secret key CANNOT decrypt", async () => {
    const legitimate = mlKemKeygen()
    const attacker = mlKemKeygen()

    const recipientKeys = new Map<string, Uint8Array>([["target", legitimate.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "classified intel",
      senderPubkey: "sender",
      recipients: ["target"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys: recipientKeys,
      createdAt: 1739836800,
      messageId: "wrong-key-test",
    })

    expect(built.ok).toBe(true)
    if (!built.ok) return

    // Attacker tries to decrypt with their own secret key
    const attackerParsed = await parseDmPqcEnvelopeContent(built.content, {
      recipientSecretKey: attacker.secretKey,
      recipientPubkey: "target",
      senderPubkey: "sender",
      expectedSenderPubkey: "sender",
      expectedRecipientPubkey: "target",
    })

    // Must fail — AES-GCM decryption with wrong derived key
    expect(attackerParsed.ok).toBe(false)
  })

  it("tampered ciphertext fails decryption (AES-GCM authentication)", async () => {
    const recipient = mlKemKeygen()
    const recipientKeys = new Map<string, Uint8Array>([["r1", recipient.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "integrity test message",
      senderPubkey: "sender",
      recipients: ["r1"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys: recipientKeys,
      createdAt: 1739836800,
      messageId: "tamper-test",
    })

    expect(built.ok).toBe(true)
    if (!built.ok) return

    // Tamper with the ciphertext in the envelope
    const envelope = JSON.parse(built.content)
    const ctBytes = base64ToBytes(envelope.ct)
    ctBytes[0] ^= 0xff // flip a byte
    envelope.ct = bytesToBase64(ctBytes)

    const parsed = await parseDmPqcEnvelopeContent(JSON.stringify(envelope), {
      recipientSecretKey: recipient.secretKey,
      recipientPubkey: "r1",
      senderPubkey: "sender",
      expectedSenderPubkey: "sender",
      expectedRecipientPubkey: "r1",
    })

    expect(parsed.ok).toBe(false)
  })

  it("spoofed sender in AD binding fails validation", async () => {
    const recipient = mlKemKeygen()
    const recipientKeys = new Map<string, Uint8Array>([["r1", recipient.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "AD binding test",
      senderPubkey: "real-sender",
      recipients: ["r1"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys: recipientKeys,
      createdAt: 1739836800,
      messageId: "ad-spoof-test",
    })

    expect(built.ok).toBe(true)
    if (!built.ok) return

    // Try to parse claiming it's from a different sender
    const parsed = await parseDmPqcEnvelopeContent(built.content, {
      recipientSecretKey: recipient.secretKey,
      recipientPubkey: "r1",
      senderPubkey: "real-sender",
      expectedSenderPubkey: "spoofed-sender",
      expectedRecipientPubkey: "r1",
    })

    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.reason).toBe("DM_ENVELOPE_AD_BINDING_MISMATCH")
  })
})

describe("PQC Deep Integration — Group Epoch Encryption", () => {
  it("full group epoch encrypt → HKDF derive → decrypt round-trip", async () => {
    const masterKey = generateEpochKey()
    const contentKey = await deriveEpochContentKey(masterKey, "group-alpha", "epoch-42")

    const plaintext = "Group-wide tactical update: move to sector 7"

    const encoded = await encodeSecureGroupEpochContent({
      groupId: "group-alpha",
      epochId: "epoch-42",
      plaintext,
      senderPubkey: "a".repeat(64),
      recipients: ["b".repeat(64), "c".repeat(64)],
      epochKeyBytes: contentKey,
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    // Ciphertext must not contain plaintext
    expect(encoded.content).not.toContain(plaintext)

    const decoded = await decodeSecureGroupEpochContent(encoded.content, contentKey)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) expect(decoded.plaintext).toBe(plaintext)
  })

  it("cross-epoch isolation: epoch-1 key cannot decrypt epoch-2 message", async () => {
    const masterKey = generateEpochKey()
    const key1 = await deriveEpochContentKey(masterKey, "group-alpha", "epoch-1")
    const key2 = await deriveEpochContentKey(masterKey, "group-alpha", "epoch-2")

    const encoded = await encodeSecureGroupEpochContent({
      groupId: "group-alpha",
      epochId: "epoch-2",
      plaintext: "epoch-2 only message",
      senderPubkey: "a".repeat(64),
      recipients: ["b".repeat(64)],
      epochKeyBytes: key2,
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    // Try decrypting with epoch-1 key
    const decoded = await decodeSecureGroupEpochContent(encoded.content, key1)
    expect(decoded.ok).toBe(false)
  })

  it("PQ-versioned group epoch uses ml-kem-768-hkdf-aes256-gcm algorithm", async () => {
    const key = randomBytes(32)

    const encoded = await encodeSecureGroupEpochContent({
      groupId: "group-pq",
      epochId: "epoch-pq-1",
      plaintext: "PQ epoch message",
      senderPubkey: "a".repeat(64),
      recipients: ["b".repeat(64)],
      epochKeyBytes: key,
      pqDerived: true,
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    expect(encoded.envelope.v).toBe(2)
    expect(encoded.envelope.mode).toBe("group-epoch-pq-v1")
    expect(encoded.envelope.alg).toBe("ml-kem-768-hkdf-aes256-gcm")

    const decoded = await decodeSecureGroupEpochContent(encoded.content, key)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) expect(decoded.plaintext).toBe("PQ epoch message")
  })

  it("integrity vs content key derivation are domain-separated", async () => {
    const masterKey = generateEpochKey()
    const contentKey = await deriveEpochContentKey(masterKey, "g1", "e1")
    const integrityKey = await deriveEpochIntegrityKey(masterKey, "g1", "e1")

    expect(contentKey).not.toEqual(integrityKey)
    expect(contentKey.length).toBe(32)
    expect(integrityKey.length).toBe(32)
  })
})

describe("PQC Deep Integration — Key Publication", () => {
  it("generatePqcKeyPair produces real ML-KEM-768 keypair with valid record", () => {
    const {record, secretKey} = generatePqcKeyPair({userPubkey: "test-user-pubkey"})

    // Verify key sizes match FIPS 203 ML-KEM-768
    expect(secretKey.length).toBe(2400)
    const publicKeyBytes = base64ToBytes(record.pq_pub)
    expect(publicKeyBytes.length).toBe(1184)

    // Verify the keypair works for encapsulation
    const {cipherText, sharedSecret: ss1} = mlKemEncapsulate(publicKeyBytes)
    const ss2 = mlKemDecapsulate(cipherText, secretKey)
    expect(ss1).toEqual(ss2)

    // Verify record structure
    expect(record.pq_alg).toBe("mlkem768")
    expect(record.status).toBe("active")
    expect(record.schema).toBe(1)
    expect(record.expires_at).toBeGreaterThan(record.created_at)
  })

  it("separate users get independent keypairs", () => {
    const kp1 = generatePqcKeyPair({userPubkey: "user-1"})
    const kp2 = generatePqcKeyPair({userPubkey: "user-2"})

    expect(kp1.secretKey).not.toEqual(kp2.secretKey)
    expect(kp1.record.pq_pub).not.toBe(kp2.record.pq_pub)
    expect(kp1.record.key_id).not.toBe(kp2.record.key_id)
  })
})

describe("PQC Deep Integration — Nonce Uniqueness", () => {
  it("1000 random nonces are all unique", () => {
    const nonces = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      nonces.add(bytesToBase64(randomNonce()))
    }
    expect(nonces.size).toBe(1000)
  })

  it("two encryptions of same plaintext produce different ciphertext", async () => {
    const key = await importAesGcmKey(randomBytes(32))
    const plaintext = stringToBytes("same plaintext")

    const n1 = randomNonce()
    const n2 = randomNonce()
    const ct1 = await aesGcmEncrypt(plaintext, key, n1)
    const ct2 = await aesGcmEncrypt(plaintext, key, n2)

    expect(bytesToBase64(ct1)).not.toBe(bytesToBase64(ct2))
  })
})

describe("PQC Deep Integration — Anti-Placeholder Smoke Tests", () => {
  it("AES-GCM ciphertext is not base64 of plaintext", async () => {
    const key = await importAesGcmKey(randomBytes(32))
    const nonce = randomNonce()
    const plaintext = "This must NOT appear in ciphertext"
    const ptBytes = stringToBytes(plaintext)

    const ct = await aesGcmEncrypt(ptBytes, key, nonce)

    // The ciphertext bytes should not equal the plaintext bytes
    expect(ct.length).not.toBe(ptBytes.length)
    // Base64 of ciphertext should not equal base64 of plaintext
    expect(bytesToBase64(ct)).not.toBe(bytesToBase64(ptBytes))
    // Ciphertext should not contain plaintext substring
    const ctString = bytesToString(ct)
    expect(ctString).not.toContain(plaintext)
  })

  it("HKDF derivation actually transforms input (not passthrough)", async () => {
    const ikm = randomBytes(32)
    const salt = stringToBytes("test-salt")
    const info = stringToBytes("test-info")

    const derived = await hkdfDeriveKey(ikm, salt, info, 32)

    // Derived key must differ from input key material
    expect(derived).not.toEqual(ikm)
  })

  it("ML-KEM shared secret is not deterministic from public key alone", () => {
    const kp = mlKemKeygen()

    const {sharedSecret: ss1} = mlKemEncapsulate(kp.publicKey)
    const {sharedSecret: ss2} = mlKemEncapsulate(kp.publicKey)

    // Each encapsulation produces a different shared secret
    expect(ss1).not.toEqual(ss2)
  })
})
