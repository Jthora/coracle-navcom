import {addMessages, init, getLocaleFromNavigator, locale} from "svelte-i18n"
import en from "./en.json"

// Register English as the default locale
addMessages("en", en)

/**
 * Load operator overrides on top of the active locale.
 * Expects a flat key-value JSON (same shape as en.json).
 */
export function loadOperatorOverrides(overrides: Record<string, string>) {
  const current = (typeof window !== "undefined" && localStorage.getItem("navcom/locale")) || "en"
  addMessages(current, overrides)
}

/**
 * Initialize i18n with browser locale detection and English fallback.
 * Call once at app startup (before first render).
 */
export function initI18n() {
  init({
    fallbackLocale: "en",
    initialLocale: getLocaleFromNavigator() ?? "en",
    handleMissingMessage: import.meta.env.DEV
      ? ({locale, id}) => `[missing: ${locale}/${id}]`
      : undefined,
  })
}

export {locale}
