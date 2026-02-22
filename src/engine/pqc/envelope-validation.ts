import {
  PQC_ENVELOPE_VERSION,
  pqcEnvelopeModes,
  optionalRecipientFields,
  optionalTopLevelFields,
  requiredRecipientFields,
  requiredTopLevelFields,
  type EnvelopeValidationOptions,
  type EnvelopeValidationResult,
  type PqcEnvelopeMode,
  type PqcEnvelope,
} from "src/engine/pqc/envelope-contracts"

const allowedTopLevel = new Set([...requiredTopLevelFields, ...optionalTopLevelFields])
const allowedRecipient = new Set([...requiredRecipientFields, ...optionalRecipientFields])
const allowedModes = new Set<PqcEnvelopeMode>(pqcEnvelopeModes)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const isUnknownCriticalField = (field: string, known: Set<string>) =>
  !known.has(field) && (field.startsWith("critical_") || field.startsWith("!"))

const keysAreCanonical = (object: Record<string, unknown>, allowed: Set<string>) => {
  const keys = Object.keys(object)
  const normalized = keys
    .filter(key => allowed.has(key))
    .slice()
    .sort()
  const present = keys.filter(key => allowed.has(key))

  return normalized.every((key, index) => key === present[index])
}

export const validatePqcEnvelope = (
  input: unknown,
  {strict = true, enforceCanonicalKeyOrder = true}: EnvelopeValidationOptions = {},
): EnvelopeValidationResult => {
  if (!isRecord(input)) {
    return {
      ok: false,
      code: "ERR_ENV_FIELD_INVALID",
      message: "Envelope must be an object.",
    }
  }

  for (const field of requiredTopLevelFields) {
    if (!(field in input)) {
      return {
        ok: false,
        code: "ERR_ENV_FIELD_MISSING",
        message: `Missing required top-level field: ${field}`,
        field,
      }
    }
  }

  if (strict) {
    for (const field of Object.keys(input)) {
      if (isUnknownCriticalField(field, allowedTopLevel)) {
        return {
          ok: false,
          code: "ERR_ENV_CRITICAL_FIELD_UNSUPPORTED",
          message: `Unknown critical field is not supported: ${field}`,
          field,
        }
      }
    }
  }

  if (enforceCanonicalKeyOrder && !keysAreCanonical(input, allowedTopLevel)) {
    return {
      ok: false,
      code: "ERR_ENV_CANONICALIZATION",
      message: "Envelope top-level keys are not in canonical order.",
    }
  }

  if (input.v !== PQC_ENVELOPE_VERSION) {
    return {
      ok: false,
      code: "ERR_ENV_VERSION_UNSUPPORTED",
      message: `Unsupported envelope version: ${String(input.v)}`,
      field: "v",
    }
  }

  const typeChecks: Array<[keyof PqcEnvelope, string]> = [
    ["mode", "string"],
    ["alg", "string"],
    ["nonce", "string"],
    ["ct", "string"],
    ["ad", "string"],
    ["msg_id", "string"],
  ]

  for (const [field, expectedType] of typeChecks) {
    if (typeof input[field] !== expectedType) {
      return {
        ok: false,
        code: "ERR_ENV_FIELD_INVALID",
        message: `Invalid type for ${field}: expected ${expectedType}`,
        field,
      }
    }
  }

  if (!allowedModes.has(input.mode as PqcEnvelopeMode)) {
    return {
      ok: false,
      code: "ERR_ENV_FIELD_INVALID",
      message: `Invalid mode: expected one of ${pqcEnvelopeModes.join(", ")}`,
      field: "mode",
    }
  }

  if (typeof input.ts !== "number") {
    return {
      ok: false,
      code: "ERR_ENV_FIELD_INVALID",
      message: "Invalid type for ts: expected number",
      field: "ts",
    }
  }

  if (!Array.isArray(input.recipients) || input.recipients.length === 0) {
    return {
      ok: false,
      code: "ERR_ENV_RECIPIENT_WRAP_INVALID",
      message: "Envelope recipients must be a non-empty array.",
      field: "recipients",
    }
  }

  if (input.compat !== undefined) {
    if (!isRecord(input.compat)) {
      return {
        ok: false,
        code: "ERR_ENV_FIELD_INVALID",
        message: "Invalid type for compat: expected object",
        field: "compat",
      }
    }

    const compat = input.compat as Record<string, unknown>

    if (compat.fallback_mode !== undefined && typeof compat.fallback_mode !== "string") {
      return {
        ok: false,
        code: "ERR_ENV_FIELD_INVALID",
        message: "Invalid type for compat.fallback_mode: expected string",
        field: "compat.fallback_mode",
      }
    }

    if (compat.reason_code !== undefined && typeof compat.reason_code !== "string") {
      return {
        ok: false,
        code: "ERR_ENV_FIELD_INVALID",
        message: "Invalid type for compat.reason_code: expected string",
        field: "compat.reason_code",
      }
    }
  }

  for (const [index, recipient] of input.recipients.entries()) {
    if (!isRecord(recipient)) {
      return {
        ok: false,
        code: "ERR_ENV_RECIPIENT_WRAP_INVALID",
        message: `Recipient at index ${index} must be an object.`,
        field: `recipients[${index}]`,
      }
    }

    if (strict) {
      for (const field of Object.keys(recipient)) {
        if (isUnknownCriticalField(field, allowedRecipient)) {
          return {
            ok: false,
            code: "ERR_ENV_CRITICAL_FIELD_UNSUPPORTED",
            message: `Unknown critical recipient field is not supported: ${field}`,
            field,
          }
        }
      }
    }

    if (enforceCanonicalKeyOrder && !keysAreCanonical(recipient, allowedRecipient)) {
      return {
        ok: false,
        code: "ERR_ENV_CANONICALIZATION",
        message: `Recipient keys at index ${index} are not in canonical order.`,
        field: `recipients[${index}]`,
      }
    }

    for (const field of requiredRecipientFields) {
      if (!(field in recipient) || typeof recipient[field] !== "string") {
        return {
          ok: false,
          code: "ERR_ENV_RECIPIENT_WRAP_INVALID",
          message: `Recipient at index ${index} is missing ${field} string field.`,
          field: `recipients[${index}].${field}`,
        }
      }
    }
  }

  return {ok: true, value: input as PqcEnvelope}
}

export const isValidPqcEnvelope = (
  input: unknown,
  options?: EnvelopeValidationOptions,
): input is PqcEnvelope => validatePqcEnvelope(input, options).ok
