# Guided Signup Copy Freeze

## Core Strings
- Start title: "Post in under a minute"
- Start CTA: "Get started"
- Key step title: "Choose your key path"
- Managed card: "Managed (recommended)" / "We generate and store a Navcom key. You can export it anytime." / Primary CTA: "Use recommended" / Secondary: "Keep selected"
- Import card: "Import your key" / "Paste an existing nsec. You keep custody; we remind you to back it up." / Input placeholder: "nsec1..." / CTA: "Use this key"
- External signer block: "Use external signer" / "Use your browser/mobile signer. We’ll try it and offer a managed fallback if it fails." / CTA: "Open signer options"
- Profile title: "Set up your profile" (implicit via component) / Fields: "Handle", "Display name" / Toggle: "Add starter follows"
- Profile CTA: "Continue" / Back CTA: "Back"
- Completion title: "You're ready" / Subtitle: "Posting is enabled. Defaults are applied so your feed isn’t empty." / Finish CTA: "Go to Navcom"
- Backup reminder (self/import): "Back up your key" / "Export or write down your key. Posting stays enabled, but don’t lose access." / CTAs: "Export key", "I’ve backed up"
- Managed export prompt: "Export your Navcom key" / "Optional: save a backup so you can sign in elsewhere." / CTAs: "Dismiss", "Export"
- Import errors: "That key didn’t look valid. Check and try again." / Encrypted import error: "Couldn’t decrypt that key. Check the password and try again."
- Managed key error: "Could not create a managed key. Try again."
- Signer timeout: "Signer didn’t respond. Try the recommended managed key."
- Relay/follows retry toasts: "Relay defaults not applied. Retrying in the background." / "Starter follows not applied. Retrying in the background."

## Length/Truncation Notes
- Mobile buttons max 20 chars; all CTAs <= 20.
- Titles <= 32 chars; subtitles < 80 chars.
- Input placeholders short (nsec1...).

## Tone
- Plain, action-oriented; avoid protocol jargon.
- Reassuring for managed path; optionality emphasized for backups/follows.

## i18n Tags
- All above strings should be tagged for localization in components when i18n is added; keep as single sentences to ease translation.
