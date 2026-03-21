import {describe, it, expect} from "vitest"
import {
  encodeSecureGroupEpochContent,
  decodeSecureGroupEpochContent,
  GROUP_EPOCH_CONTENT_VERSION,
  GROUP_EPOCH_CONTENT_VERSION_PQ,
  GROUP_EPOCH_CONTENT_ALGORITHM,
  GROUP_EPOCH_CONTENT_ALGORITHM_PQ,
} from "src/engine/group-epoch-content"
import {generateEpochKey, deriveEpochContentKey} from "src/engine/pqc/epoch-key-manager"
import {resolveEpochKey} from "src/engine/group-transport-secure-ops"
import {
  sha256Sync,
  hmacSha256Sync,
  bytesToBase64Url,
  base64UrlToBytes,
} from "src/engine/crypto/sync-primitives"

const SENDER = "aabb".repeat(16)
const RECIPIENT = "ccdd".repeat(16)
const GROUP_ID = "test-group-pqc-wiring"
const EPOCH_ID = "epoch:test-group-pqc-wiring:1:1700000000"

describe("PQC Group Wiring", () => {
  describe("v1 envelope (classical)", () => {
    it("encode → decode round-trip with epoch-derived key", async () => {
      const master = generateEpochKey()
      const epochKey = await deriveEpochContentKey(master, GROUP_ID, EPOCH_ID)

      const encoded = await encodeSecureGroupEpochContent({
        groupId: GROUP_ID,
        epochId: EPOCH_ID,
        plaintext: "hello from classical epoch",
        senderPubkey: SENDER,
        recipients: [SENDER, RECIPIENT],
        epochKeyBytes: epochKey,
      })

      expect(encoded.ok).toBe(true)
      if (!encoded.ok) return

      expect(encoded.envelope.v).toBe(GROUP_EPOCH_CONTENT_VERSION)
      expect(encoded.envelope.mode).toBe("group-epoch-v1")
      expect(encoded.envelope.alg).toBe(GROUP_EPOCH_CONTENT_ALGORITHM)

      const decoded = await decodeSecureGroupEpochContent(encoded.content, epochKey)
      expect(decoded.ok).toBe(true)
      if (!decoded.ok) return
      expect(decoded.plaintext).toBe("hello from classical epoch")
    })
  })

  describe("v2 envelope (PQ-derived)", () => {
    it("encode → decode round-trip with pqDerived flag", async () => {
      const master = generateEpochKey()
      const epochKey = await deriveEpochContentKey(master, GROUP_ID, EPOCH_ID)

      const encoded = await encodeSecureGroupEpochContent({
        groupId: GROUP_ID,
        epochId: EPOCH_ID,
        plaintext: "hello from PQ epoch",
        senderPubkey: SENDER,
        recipients: [SENDER, RECIPIENT],
        epochKeyBytes: epochKey,
        pqDerived: true,
      })

      expect(encoded.ok).toBe(true)
      if (!encoded.ok) return

      expect(encoded.envelope.v).toBe(GROUP_EPOCH_CONTENT_VERSION_PQ)
      expect(encoded.envelope.mode).toBe("group-epoch-pq-v1")
      expect(encoded.envelope.alg).toBe(GROUP_EPOCH_CONTENT_ALGORITHM_PQ)

      const decoded = await decodeSecureGroupEpochContent(encoded.content, epochKey)
      expect(decoded.ok).toBe(true)
      if (!decoded.ok) return
      expect(decoded.plaintext).toBe("hello from PQ epoch")
    })

    it("v2 envelope has correct metadata in JSON", async () => {
      const master = generateEpochKey()
      const epochKey = await deriveEpochContentKey(master, GROUP_ID, EPOCH_ID)

      const encoded = await encodeSecureGroupEpochContent({
        groupId: GROUP_ID,
        epochId: EPOCH_ID,
        plaintext: "metadata check",
        senderPubkey: SENDER,
        recipients: [SENDER, RECIPIENT],
        epochKeyBytes: epochKey,
        pqDerived: true,
      })

      expect(encoded.ok).toBe(true)
      if (!encoded.ok) return

      const parsed = JSON.parse(encoded.content)
      expect(parsed.v).toBe(2)
      expect(parsed.mode).toBe("group-epoch-pq-v1")
      expect(parsed.alg).toBe("ml-kem-768-hkdf-aes256-gcm")
    })
  })

  describe("backward compatibility", () => {
    it("v1 envelope still decodes after v2 support added", async () => {
      const master = generateEpochKey()
      const epochKey = await deriveEpochContentKey(master, GROUP_ID, EPOCH_ID)

      const v1 = await encodeSecureGroupEpochContent({
        groupId: GROUP_ID,
        epochId: EPOCH_ID,
        plaintext: "legacy message",
        senderPubkey: SENDER,
        recipients: [SENDER, RECIPIENT],
        epochKeyBytes: epochKey,
        pqDerived: false,
      })

      expect(v1.ok).toBe(true)
      if (!v1.ok) return

      const decoded = await decodeSecureGroupEpochContent(v1.content, epochKey)
      expect(decoded.ok).toBe(true)
      if (!decoded.ok) return
      expect(decoded.plaintext).toBe("legacy message")
      expect(decoded.envelope.v).toBe(1)
    })

    it("wrong key fails to decrypt", async () => {
      const master = generateEpochKey()
      const epochKey = await deriveEpochContentKey(master, GROUP_ID, EPOCH_ID)
      const wrongKey = generateEpochKey()

      const encoded = await encodeSecureGroupEpochContent({
        groupId: GROUP_ID,
        epochId: EPOCH_ID,
        plaintext: "secret",
        senderPubkey: SENDER,
        recipients: [SENDER, RECIPIENT],
        epochKeyBytes: epochKey,
        pqDerived: true,
      })

      expect(encoded.ok).toBe(true)
      if (!encoded.ok) return

      const decoded = await decodeSecureGroupEpochContent(encoded.content, wrongKey)
      expect(decoded.ok).toBe(false)
    })
  })

  describe("resolveEpochKey", () => {
    it("returns null when no master key is stored", async () => {
      // In the test environment, IndexedDB may not be available.
      // resolveEpochKey should return null (no key found) rather than crash.
      try {
        const result = await resolveEpochKey("nonexistent-group", EPOCH_ID, "test-passphrase")
        expect(result).toBeNull()
      } catch (e: any) {
        // If IndexedDB is unavailable at the platform level, that's expected in node
        expect(e.message).toMatch(/indexedDB/)
      }
    })
  })

  describe("sync-primitives", () => {
    it("sha256Sync produces correct digest for empty input", () => {
      const digest = sha256Sync(new Uint8Array(0))
      expect(digest.length).toBe(32)
      // SHA-256 of empty string = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      const hex = Array.from(digest)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
      expect(hex).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    })

    it("sha256Sync produces correct digest for 'abc'", () => {
      const encoder = new TextEncoder()
      const digest = sha256Sync(encoder.encode("abc"))
      const hex = Array.from(digest)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
      expect(hex).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    })

    it("hmacSha256Sync is deterministic", () => {
      const key = new Uint8Array(32).fill(0x42)
      const msg = new TextEncoder().encode("test message")
      const mac1 = hmacSha256Sync(key, msg)
      const mac2 = hmacSha256Sync(key, msg)
      expect(Array.from(mac1)).toEqual(Array.from(mac2))
      expect(mac1.length).toBe(32)
    })

    it("base64url round-trips", () => {
      const original = new Uint8Array([0, 1, 2, 253, 254, 255])
      const encoded = bytesToBase64Url(original)
      const decoded = base64UrlToBytes(encoded)
      expect(Array.from(decoded)).toEqual(Array.from(original))
    })
  })
})
