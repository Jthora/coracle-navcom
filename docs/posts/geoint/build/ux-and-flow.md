# UX and Flow (Expanded)

Entry and Placement
- Composer stays at /notes/create; we add a type selector above the editor title (“Create a Note”).
- Type selector is a segmented control (three buttons) with keyboard focus order: Default → Ops → GEOINT. Active state is visually distinct and announced.
- Selection persists per session via component state; drafts are keyed by type to prevent cross-contamination.

Layout Structure
- Header row: Title (“Create a Note”), Type selector, optional public-visibility notice when GEOINT is selected.
- Editor block: existing rich-text/attachment area remains; we avoid forking the editor instance.
- Footer controls: preview toggle, counters, options (cog), send button, upload button. Ordering preserved to avoid regressions.
- GEOINT affordances: a “Add location” button appears when GEOINT is selected; after selection, a summary chip shows coords/subtype/confidence with Edit/Clear.

Type Behaviors (UI expectations)
- Default
	- No additional UI beyond selector.
	- All existing behaviors intact (quotes, uploads, schedule, POW).
- Starcom Ops
	- No extra fields; selector conveys intent.
	- Submission auto-appends `#starcom_ops` (not user-typed) and dedupes.
- GEOINT
	- Shows “Add location” CTA; requires lat/lon before enabling Send.
	- Shows inline warning: “GEOINT posts are public; share coordinates responsibly.”
	- Shows summary chip once data captured; chip includes: lat/lon (6 decimals), subtype, optional confidence, and edit/clear actions.

GEOINT Modal / Drawer
- Trigger: “Add location” or “Edit location” when GEOINT is active.
- Structure:
	- Map pane (placeholder if no map lib yet) with click-to-place marker; manual inputs always available.
	- Form fields:
		- Latitude (required), Longitude (required), Altitude (optional)
		- Subtype (report/sighting/event/custom free text)
		- Confidence (slider 0–100; stored as 0–1)
		- Timestamp (defaults to now, ISO; user editable)
		- Additional JSON (textarea; must parse to object)
	- Actions: Save (validates, closes), Cancel (discards changes), Clear (resets geo state).
- Validation messaging inside modal near fields; top-level error summary optional.

Validation UX
- GEOINT Send disabled until lat/lon valid; inline message near Send: “Add coordinates to post GEOINT.”
- Confidence out of range → normalize or show inline error.
- Additional JSON parse failure → non-blocking warning; allow save without extra.
- Size guard: warn if total content > 5 KB; block if > 10 KB.

Preview Behavior
- Preview mirrors final payload:
	- Shows human text with appended hashtag (#starcom_ops or #starcom_intel as applicable).
	- For GEOINT, shows a collapsible code block labeled “GEOJSON payload” with the exact JSON (pretty-printed) that will be appended after the delimiter.
	- Indicates tags added (small badges) for quick visual verification.

States and Edge Cases
- Empty editor + Ops/GEOINT: allow send; hashtags still appended, but enforce GEOINT coordinates.
- Draft restore per type: when switching types, load the type-specific draft; do not auto-carry geo state into non-geo types.
- Uploads/quotes: must remain available regardless of type; geo modal should not interfere with uploads.

Mobile Considerations
- Selector stacks vertically on narrow screens; modal can be full-screen sheet with back/close.
- Summary chip wraps and remains tappable; Send button stays sticky only if already so.

Accessibility
- Selector buttons are role="tab" or segmented buttons with aria-pressed.
- Modal focus trap; Escape closes; Enter saves when valid; explicit close button with label.
- Map placeholder offers keyboard entry; manual fields always present for non-pointer users.
- Error text is text-based; color alone not relied upon.

Copy Guidelines (suggested)
- GEOINT warning: “GEOINT posts are public. Share coordinates responsibly.”
- Missing coords error: “Add latitude and longitude to post GEOINT.”
- JSON parse warning: “Additional data is not valid JSON; it was ignored.”

Interaction Checklist
- Switch type → draft swap and geo state resets unless returning to GEOINT.
- Open modal → edit coords → save → summary chip updates; Send enables when valid.
- Clear geo → summary chip disappears; Send disables for GEOINT.
- Preview toggled → shows hashtags and JSON; untoggled → editor visible.

Copy and Tone Guide
- Selector labels: "Default", "Ops", "GEOINT" (short, uppercase optional; keep consistent with app typography).
- GEOINT notice: "GEOINT posts are public. Share coordinates responsibly."
- Missing coords: "Add latitude and longitude to post GEOINT."
- JSON warning: "Additional data is not valid JSON; it was ignored."
- Size warning: "Post is getting large (>5 KB). Consider trimming attachments or details." Block: "Post exceeds size limit (>10 KB)."

Mobile/Responsive Behaviors
- Selector wraps into vertical stack on narrow widths; keep touch targets >= 44px.
- Modal/drawer full-screen on mobile with a clear top-close button; content scrollable; Save/Cancel pinned at bottom.
- Summary chip wraps text and keeps Edit/Clear buttons side-by-side or stacked.

Keyboard Flows
- Tab order: selector → editor → counters/preview/options → Send → Upload. Modal traps focus until closed; Escape closes; Enter on primary button saves when valid.
- Map placeholder must be skippable; manual inputs accessible via keyboard.

Visual Hierarchy
- Keep primary CTA (Send) visually dominant; selector uses medium emphasis; geo warning uses subtle accent.
- Validation errors in red/amber with icon; warnings subdued.

State Persistence Rules
- Switching away from GEOINT: preserve geo state per-type draft but hide UI; switching back restores state and summary chip.
- Clearing a draft should clear geo state for that type.

Preview Details
- Show tag badges and hashtag-rendered human text to match final send.
- For long payloads, collapse the GeoJSON block with “Show JSON” / “Hide JSON.”
- Indicate delimiter placement in preview (e.g., faint divider line or label).

Internationalization (lightweight)
- Keep strings centralized so they can be swapped; avoid hard-coded copy in multiple places.
- Numeric inputs honor locale? (We should accept dot decimal; avoid locale-dependent commas.)

Error Placement Strategy
- Blocking errors near Send; repeat inside modal for field-level issues.
- Non-blocking warnings near selector; avoid toast spam.

Edge UI Cases
- Empty text + GEOINT: summary chip present; Send enabled if coords valid; content will be just hashtag + payload.
- Empty text + Ops: Send enabled; content will be just hashtag.
- User manually types hashtags: ensure we don’t add duplicates; leave their casing intact (we append canonical lowercase tag if missing).

Future UI Hooks
- Geometry type selector (Point/Line/Polygon) placeholder spot in modal; hide for MVP.
- Relay targeting dropdown (future) could sit near selector; design with space in mind.
