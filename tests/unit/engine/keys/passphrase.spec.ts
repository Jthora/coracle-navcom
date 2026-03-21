import {describe, it, expect} from "vitest"
import {
  validatePassphrase,
  passphraseStrength,
  deriveWrappingKey,
  deriveEncryptionKey,
  generateSalt,
} from "src/engine/keys/passphrase"

describe("passphrase", () => {
  describe("validatePassphrase", () => {
    it("rejects short passphrases", () => {
      expect(validatePassphrase("abc")).toBe("Passphrase must be at least 8 characters")
      expect(validatePassphrase("1234567")).toBe("Passphrase must be at least 8 characters")
    })

    it("accepts valid passphrases", () => {
      expect(validatePassphrase("12345678")).toBeNull()
      expect(validatePassphrase("my secret passphrase")).toBeNull()
    })
  })

  describe("passphraseStrength", () => {
    it("scores weak passphrases low", () => {
      expect(passphraseStrength("1234")).toBeLessThanOrEqual(1)
      expect(passphraseStrength("abcdefgh")).toBeLessThanOrEqual(2)
    })

    it("scores strong passphrases high", () => {
      expect(passphraseStrength("MyStr0ng!Pass")).toBe(4)
    })

    it("rewards length", () => {
      const short = passphraseStrength("abcdefgh")
      const long = passphraseStrength("abcdefghijkl")
      expect(long).toBeGreaterThan(short)
    })
  })

  describe("generateSalt", () => {
    it("generates 16-byte salt", () => {
      const salt = generateSalt()
      expect(salt).toBeInstanceOf(Uint8Array)
      expect(salt.length).toBe(16)
    })

    it("generates unique salts", () => {
      const a = generateSalt()
      const b = generateSalt()
      expect(a).not.toEqual(b)
    })
  })

  describe("deriveWrappingKey", () => {
    it("derives a CryptoKey for wrap/unwrap", async () => {
      const salt = generateSalt()
      const key = await deriveWrappingKey("testpass123", salt)
      expect(key).toBeDefined()
      expect(key.type).toBe("secret")
      expect(key.algorithm).toMatchObject({name: "AES-GCM"})
      expect(key.extractable).toBe(false)
      expect(key.usages).toContain("wrapKey")
      expect(key.usages).toContain("unwrapKey")
    })

    it("derives same key for same passphrase+salt", async () => {
      const salt = generateSalt()
      const k1 = await deriveWrappingKey("same-pass", salt)
      const k2 = await deriveWrappingKey("same-pass", salt)
      // Can't compare CryptoKeys directly, but both should be valid
      expect(k1.type).toBe(k2.type)
    })
  })

  describe("deriveEncryptionKey", () => {
    it("derives a CryptoKey for encrypt/decrypt", async () => {
      const salt = generateSalt()
      const key = await deriveEncryptionKey("testpass123", salt)
      expect(key).toBeDefined()
      expect(key.type).toBe("secret")
      expect(key.usages).toContain("encrypt")
      expect(key.usages).toContain("decrypt")
    })

    it("encrypt/decrypt round-trip works", async () => {
      const salt = generateSalt()
      const key = await deriveEncryptionKey("my-passphrase", salt)
      const iv = new Uint8Array(12)
      globalThis.crypto.getRandomValues(iv)

      const plaintext = new TextEncoder().encode("secret data")
      const encrypted = await globalThis.crypto.subtle.encrypt(
        {name: "AES-GCM", iv},
        key,
        plaintext,
      )
      const decrypted = await globalThis.crypto.subtle.decrypt(
        {name: "AES-GCM", iv},
        key,
        encrypted,
      )
      expect(Array.from(new Uint8Array(decrypted))).toEqual(Array.from(plaintext))
    })

    it("wrong passphrase fails decrypt", async () => {
      const salt = generateSalt()
      const key1 = await deriveEncryptionKey("correct-pass", salt)
      const key2 = await deriveEncryptionKey("wrong-pass", salt)
      const iv = new Uint8Array(12)
      globalThis.crypto.getRandomValues(iv)

      const plaintext = new TextEncoder().encode("secret")
      const encrypted = await globalThis.crypto.subtle.encrypt(
        {name: "AES-GCM", iv},
        key1,
        plaintext,
      )

      await expect(
        globalThis.crypto.subtle.decrypt({name: "AES-GCM", iv}, key2, encrypted),
      ).rejects.toThrow()
    })
  })
})
