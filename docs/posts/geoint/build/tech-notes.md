# Tech Notes (Expanded)

Integration Surfaces
- Primary file: src/app/views/NoteCreate.svelte — onSubmit builds the event and invokes publishThunk.
- Editor: makeEditor provides commands and storage for tags; do not fork the editor instance per type.
- Options: NoteOptions (warnings/expiration/pow/publish_at) must remain functional; type logic should wrap around, not replace, existing option handling.
- Drafts: DRAFT_KEY currently "notecreate" + optional pubkey/quote. Extend to include type suffix (e.g., `notecreate:default`, `notecreate:ops`, `notecreate:geoint`).
- Map dependency: defer map tiles; use manual inputs + placeholder panel for MVP.

State Additions
- selectedType: "default" | "ops" | "geoint"; defaults to "default" on mount.
- geointState: { lat: number | null, lon: number | null, alt?: number | null, subtype?: string | null, confidence?: number | null, timestamp?: string | null, additional?: Record<string, unknown> | null }
- defaults: {lat:null, lon:null, alt:null, subtype:null, confidence:null, timestamp:null, additional:null}; reset after publish and on Clear.
- persisted per-type draft: stored under `${baseDraftKey}:geoint:geo`; cleared with the active type on publish.
- ui flags: showPreview (existing), showOptions (existing), showGeoModal (new), validationError (string | null) for geo-specific blocking.

Helper Functions (implementation notes)
- ensureHashtag(text: string, tag: string): trim; if already present (case-sensitive exact match), return; else append with leading space if text non-empty.
- buildGeoTagString(lat, lon, alt?): fixed 6 decimals; `lat:${lat.toFixed(6)},lon:${lon.toFixed(6)}` + `,alt:${alt.toFixed(1)}` when alt not null.
- geohashFromLatLon(lat, lon): add lightweight helper or dependency; if failure, skip tag silently.
- buildGeoJsonPayload(state, description): produce GeoJSON-like object with lon/lat/alt order; properties include version:1, subtype, timestamp (ISO), description (original human text), confidence (0–1), additional (object or undefined).
- safeParseJson(str): try/catch; return {ok: true, value} or {ok: false, error}; warn on failure and drop.
- sizeCheck(content): return {warn:boolean, block:boolean, bytes:number}; thresholds 5 KB/10 KB.

Content Assembly Hook (onSubmit)
1) Get editor text trimmed.
2) Normalize tags from editor storage + getClientTags.
3) Switch on selectedType:
	 - default: content = text; tags unchanged (plus client tag enforced).
	 - ops: content = ensureHashtag(text, "#starcom_ops"); tags += ["app","starcom"] if policy decides.
	 - geoint:
		 a) Validate lat/lon.
		 b) Human text = ensureHashtag(text, "#starcom_intel").
		 c) geoTag = buildGeoTagString(...); geohash optional.
		 d) payload = buildGeoJsonPayload(geointState, text);
		 e) content = `${human} ---GEOJSON---${JSON.stringify(payload)}`;
		 f) tags += app/client/geo/geoint-type/(g?), plus options tags.
4) Apply options (warning, expiration, pow) same as today.
5) sizeCheck(content) → block/warn.
6) Proceed to makeEvent(1,{content,tags,created_at}) and existing pow/sign/publish flow.

Validation and Errors
- GEOINT blocking errors: missing/invalid lat/lon; content size > block limit.
- GEOINT warnings (non-blocking): extra JSON parse fail; geohash generation fail; size warn threshold.
- Surface blocking errors inline near Send; prevent submission. Warnings via toast or inline small text near selector.

Preview Implementation
- When showPreview true:
	- Render human content portion with hashtags visible.
	- If geo: render collapsible code block showing pretty-printed payload; show badges for tags added (app/geo/geohash if present).
	- Hide editor input area as today; retain note content preview component for consistency.

Geo Modal Implementation Notes
- Component can live inside NoteCreate for now; props: value (geointState), onSave, onCancel, onClear.
- Map placeholder: simple static panel with “Map coming soon” if no map lib; manual inputs always authoritative.
- Ensure modal locks scroll and traps focus; pressing Escape closes.

Draft Handling
- On type change: save current editor JSON to the current type’s draft key; load the new type’s draft if present; for GEOINT also persist geo state per type key.
- Clearing drafts after send should clear only the active type’s draft.

Publishing Flow Considerations
- publishThunk remains; delay toast remains; abort still works. Do not bypass router.clearModals or drafts.delete behaviors; scope them per type key.
- Relay broadcast unchanged; client tags remain.

Edge Cases
- Empty text + Ops/GEOINT: allow; hashtags will still be appended; for GEOINT, require coords.
- Quoted notes: keep quote handling untouched; hashtags appended after quote text? (We only control the editor text; ensure we do not insert tags inside quoted blocks—rely on editor plain text output.)
- POW: ensure content assembly happens before POW hashing; do not rehash after POW generation.

Testing Hooks
- Add small helper exports for ensureHashtag, buildGeoTagString, buildGeoJsonPayload to unit-test without UI.
- Consider adding a log/dev mode to print final content/tags for manual verification during QA.

Performance
- JSON stringify for payload is small; no heavy loops. Avoid expensive geohash if precision high—keep it simple.
- No extra network calls in MVP (map tiles omitted). If map added, lazy-load.

Security/Privacy
- Remind users via UI; no masking of coordinates server-side.
- Extra JSON is user-provided; do not eval; only parse as JSON.

Extensibility
- Keep geometry.type in payload; could switch to LineString/Polygon later.
- Keep geoint-type tag generic; allow downstream filters to extend.

Preview Rendering Notes
- For GEOINT, pretty-print payload in preview (indent 2) but send compact JSON. Clarify in UI that the sent payload is compacted.
- Show tag badges: app/starcom-geoint, geo (lat/lon[/alt]), geohash if present, geoint-type.
- If preview is long, collapse the payload with a “Show JSON” toggle to avoid overwhelming the UI.

Content Safety Notes
- Strip trailing whitespace before hashtag insertion to avoid accidental double spaces.
- Deduplicate hashtags by exact match; avoid fuzzy matching to prevent removing user-chosen tags.
- Keep delimiter insertion to a single occurrence; do not attempt to sanitize user-provided delimiter copies.

Testing Guidance
- Unit tests for helpers:
	- ensureHashtag covers empty text, existing tag, trailing space, multiple tags.
	- buildGeoTagString formatting/precision and alt omission.
	- buildGeoJsonPayload validates lon/lat ordering and copies description.
	- sizeCheck thresholds.
- Integration tests (manual/QA script) listed in tasks.md QA section; consider a Cypress flow if time allows: select GEOINT, enter coords, preview, send (stubbed publish), inspect constructed content/tags.

Logging/Telemetry (optional)
- Log selectedType at submit and whether validation blocked; include size bytes and presence of geohash (boolean) for early debugging.
- Avoid logging coordinates in plaintext analytics for privacy; stick to booleans/lengths unless required.

Error Surface Placement
- Blocking errors: near Send button and optionally under selector; prevent form submission.
- Warnings: near selector or as toast; should not block; example: geohash failure, extra JSON ignored.

Code Organization Suggestions
- Keep new helpers in a small module under src/app/util (e.g., util/geoint.ts) for testability; import into NoteCreate.
- Modal component can live in NoteCreate initially; if it grows, extract to src/app/shared/GeoModal.svelte.
- Summary chip can be a tiny component for reuse/testing; but acceptable inline if simple.

Migration Notes
- Removing the modal or changing geometry types later should not require changing the submit pipeline if helpers isolate shape/formatting concerns.
- Draft key suffixing by type avoids data loss when switching types; ensure old draft keys are still read for users who return (fallback load order: typed key, then legacy key).

Open Technical Questions
- Do we need to debounce size checks on every keystroke? (Likely no; check on submit and optionally on preview toggle.)
- Should we strip newlines from human text before hashtag? (No; preserve formatting; append hashtag after trim.)
- Should we include altitude in geo tag if 0? (Include only when user supplies; distinguish null vs 0.)
