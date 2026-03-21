import {describe, it, expect} from "vitest"
import {
  randomBytes,
  randomNonce,
  aesGcmEncrypt,
  aesGcmDecrypt,
  importAesGcmKey,
  hkdfDeriveKey,
  sha256,
  hmacSha256,
  bytesToBase64,
  base64ToBytes,
  stringToBytes,
  bytesToString,
  mlKemKeygen,
  mlKemEncapsulate,
  mlKemDecapsulate,
} from "src/engine/pqc/crypto-provider"

describe("CryptoProvider", () => {
  // --- AES-GCM-256 ---

  describe("AES-GCM-256", () => {
    it("encrypts and decrypts with AES-GCM-256", async () => {
      const key = await importAesGcmKey(randomBytes(32))
      const nonce = randomNonce()
      const plaintext = stringToBytes("Earth Alliance operational message")
      const ad = stringToBytes("group:earth-alliance:epoch-7")

      const ct = await aesGcmEncrypt(plaintext, key, nonce, ad)
      const recovered = await aesGcmDecrypt(ct, key, nonce, ad)

      expect(Array.from(recovered)).toEqual(Array.from(plaintext))
      expect(Array.from(ct)).not.toEqual(Array.from(plaintext))
    })

    it("fails to decrypt with wrong key", async () => {
      const key1 = await importAesGcmKey(randomBytes(32))
      const key2 = await importAesGcmKey(randomBytes(32))
      const nonce = randomNonce()
      const ct = await aesGcmEncrypt(stringToBytes("secret"), key1, nonce)

      await expect(aesGcmDecrypt(ct, key2, nonce)).rejects.toThrow()
    })

    it("fails on tampered ciphertext", async () => {
      const key = await importAesGcmKey(randomBytes(32))
      const nonce = randomNonce()
      const ct = await aesGcmEncrypt(stringToBytes("secret"), key, nonce)

      ct[0] ^= 0xff
      await expect(aesGcmDecrypt(ct, key, nonce)).rejects.toThrow()
    })

    it("fails when associated data mismatches", async () => {
      const key = await importAesGcmKey(randomBytes(32))
      const nonce = randomNonce()
      const ad1 = stringToBytes("group:alpha")
      const ad2 = stringToBytes("group:beta")

      const ct = await aesGcmEncrypt(stringToBytes("secret"), key, nonce, ad1)
      await expect(aesGcmDecrypt(ct, key, nonce, ad2)).rejects.toThrow()
    })

    it("works without associated data", async () => {
      const key = await importAesGcmKey(randomBytes(32))
      const nonce = randomNonce()
      const plaintext = stringToBytes("no AD message")

      const ct = await aesGcmEncrypt(plaintext, key, nonce)
      const recovered = await aesGcmDecrypt(ct, key, nonce)

      expect(Array.from(recovered)).toEqual(Array.from(plaintext))
    })
  })

  // --- Random nonces ---

  describe("randomNonce", () => {
    it("produces 12-byte nonces", () => {
      const nonce = randomNonce()
      expect(nonce.length).toBe(12)
    })

    it("produces unique nonces", () => {
      const nonces = new Set<string>()
      for (let i = 0; i < 1000; i++) {
        nonces.add(bytesToBase64(randomNonce()))
      }
      expect(nonces.size).toBe(1000)
    })
  })

  // --- SHA-256 ---

  describe("SHA-256", () => {
    it("matches known SHA-256 test vector", async () => {
      const input = stringToBytes("abc")
      const hash = await sha256(input)
      const hex = Array.from(hash)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
      expect(hex).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    })

    it("produces 32-byte output", async () => {
      const hash = await sha256(stringToBytes("test"))
      expect(hash.length).toBe(32)
    })
  })

  // --- HMAC-SHA256 ---

  describe("HMAC-SHA256", () => {
    it("matches known HMAC-SHA256 test vector (RFC 4231 Test Case 2)", async () => {
      const key = stringToBytes("Jefe")
      const data = stringToBytes("what do ya want for nothing?")
      const mac = await hmacSha256(key, data)
      const hex = Array.from(mac)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
      expect(hex).toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843")
    })
  })

  // --- HKDF ---

  describe("HKDF", () => {
    it("derives same key from same inputs", async () => {
      const ikm = randomBytes(32)
      const salt = stringToBytes("test-salt")
      const info = stringToBytes("test-info")

      const key1 = await hkdfDeriveKey(ikm, salt, info, 32)
      const key2 = await hkdfDeriveKey(ikm, salt, info, 32)
      expect(key1).toEqual(key2)
    })

    it("derives different keys from different info", async () => {
      const ikm = randomBytes(32)
      const salt = stringToBytes("test-salt")

      const key1 = await hkdfDeriveKey(ikm, salt, stringToBytes("content-key"), 32)
      const key2 = await hkdfDeriveKey(ikm, salt, stringToBytes("integrity-key"), 32)
      expect(key1).not.toEqual(key2)
    })

    it("produces 32-byte output by default", async () => {
      const key = await hkdfDeriveKey(randomBytes(32), stringToBytes("s"), stringToBytes("i"))
      expect(key.length).toBe(32)
    })
  })

  // --- ML-KEM-768 ---

  describe("ML-KEM-768", () => {
    it("generates ML-KEM-768 keypair with correct sizes", () => {
      const {publicKey, secretKey} = mlKemKeygen()
      expect(publicKey.length).toBe(1184)
      expect(secretKey.length).toBe(2400)
    })

    it("encapsulate and decapsulate agree on shared secret", () => {
      const {publicKey, secretKey} = mlKemKeygen()
      const {cipherText, sharedSecret: ss1} = mlKemEncapsulate(publicKey)
      const ss2 = mlKemDecapsulate(cipherText, secretKey)

      expect(ss1).toEqual(ss2)
      expect(ss1.length).toBe(32)
    })

    it("decapsulate with wrong key produces different shared secret", () => {
      const kp1 = mlKemKeygen()
      const kp2 = mlKemKeygen()

      const {cipherText, sharedSecret: ss1} = mlKemEncapsulate(kp1.publicKey)
      const ss2 = mlKemDecapsulate(cipherText, kp2.secretKey)

      expect(ss1).not.toEqual(ss2)
    })
  })

  // --- Base64 / UTF-8 ---

  describe("encoding helpers", () => {
    it("roundtrips base64", () => {
      const original = randomBytes(64)
      const encoded = bytesToBase64(original)
      const decoded = base64ToBytes(encoded)
      expect(decoded).toEqual(original)
    })

    it("roundtrips UTF-8", () => {
      const original = "Hello, Earth Alliance! 🌍"
      const bytes = stringToBytes(original)
      const recovered = bytesToString(bytes)
      expect(recovered).toBe(original)
    })
  })
})
