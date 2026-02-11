# Copy and Voice

## Tone Principles
- Plain language; avoid web3/crypto jargon.
- Say "Navcom key" and "Signs your posts" instead of protocol terms.
- Keep sentences short; action-oriented.
- Reassuring, not instructional; focus on outcomes.

## Core Buttons/Labels
- Get started
- Continue
- Use recommended setup (managed)
- Advanced options
- Use my own key (self-custody/import)
- Use external signer
- Export key
- Skip for now
- Done

## Value Props
- "Post in under a minute."
- "We’ll set up a Navcom key for you; you can export it anytime."
- "Keep control with your own key (advanced)."

## Warnings/Notices
- Backup (self-custody): "Save your key. Lose it, lose access."
- Managed: "You can export your key later."
- External signer unavailable: "Couldn’t reach your signer. Try again or use recommended setup."

## Field Labels
- Handle (optional)
- Display name (optional)

## Tooltips/Helpers
- Managed path: "We generate and store a Navcom key so you can start now."
- Advanced path: "Bring or generate your own key; you must back it up."
- Starter follows toggle: "Follow a few recommended accounts to see posts right away."

## Error Messages
- Key creation failed: "Something went wrong creating your key. Try again."
- Import failed: "That key doesn’t look valid. Check and try again."
- External signer: "No response from signer. Open it and retry, or use recommended setup."

## Links/Outbound
- "What is Nostr?" (opens new tab)
- "Learn more" (external)
- Keep link text short; no protocol deep dives in-flow.

## Step Copy (by screen)
- Start:
  - Heading: "Get started"
  - Body: "We’ll set up a Navcom key so you can post quickly."
  - CTA: "Continue"
  - Secondary link: "Advanced options"
  - External link: "What is Nostr?" (optional, subtle)
- Key choice (managed default):
  - Heading: "Set up your key"
  - Body (managed): "We’ll create and store a Navcom key for you. Export anytime."
  - Managed CTA: "Use recommended setup"
  - Advanced link: "Use my own key"; suboptions: import key, generate locally, use external signer
  - External signer note: "Opens your signer app/extension."
- Profile-lite:
  - Heading: "Add your profile (optional)"
  - Body: "Pick a handle and name, or skip for now."
  - CTA: "Continue"; Secondary: "Skip for now"
- Completion:
  - Heading: "You’re ready"
  - Body: "Start posting. You can export your key anytime."
  - CTA: "Go to Navcom" (or return target)

## Post-Signup Reminders
- Backup (self-custody): "Save your key to keep access."
- Export (managed): "Export your key for safekeeping." (mild)
- Dismiss option: "Remind me later"

## CTAs in Other Surfaces
- Nav/login/post-gate: "Get started" / "Guided setup"
- Notifications (if used): "Finish setup" when pending

## Do/Don’t
- Do: keep buttons short; avoid multi-line buttons.
- Do: keep warnings concise.
- Don’t: mention "private key", "seed", "protocol", "relay" in primary copy (only in advanced tooltips if needed).
- Don’t: require reading to proceed; copy is supportive, not blocking.

## Internationalization Notes
- Keep strings simple for future i18n; avoid idioms.
- Limit punctuation in buttons.

## Visual Hierarchy Guidance
- Primary CTA: accent style.
- Secondary link: text/low style.
- Warnings: use a subtle highlight; avoid alarmism.

## Backup Confirmation Copy
- Checkbox text: "I saved my key."
- Helper: "Store it somewhere safe."

## Import Copy
- Field placeholder: "Paste your key (nsec...)"
- Helper: "We’ll check the format before proceeding."

## External Signer Copy
- Button: "Use external signer"
- Helper: "We’ll prompt your signer app/extension."

## Starter Follows Copy
- Toggle label: "Add starter follows"
- Helper: "See posts right away; you can change later."

## Minimal Profile Copy
- Handle helper: "You can change this later."
- Display name helper: "Optional."

## Accessibility Copy Considerations
- Aria labels should mirror button text; concise and descriptive.
- Avoid redundant text in icons; ensure text stands alone.

## Testing Strings
- Ensure all critical strings render within available space on mobile.
- Verify truncation doesn’t alter meaning.

## Future-Proofing
- Leave room for a wallet/zap setup link post-onboarding without changing core copy.

## Copy Budget per Screen
- Target: heading + 1-2 short sentences + CTA + secondary link.
- Avoid paragraphs; keep scannable on mobile.

## Edge Cases
- If user already has a key and visits /signup: show message "You’re already set" with a link to switch/import key.

