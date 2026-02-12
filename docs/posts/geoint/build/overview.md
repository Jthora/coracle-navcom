# GEOINT Posting Upgrade — Expanded Overview

Purpose
- Provide an actionable, end-to-end plan for refactoring Navcom posting into a multi-type composer (Default, Starcom Ops, GEOINT) while maintaining compatibility with Starcom viewers and Nostr relays.
- Serve as the anchor doc for engineers, QA, and PM to align on scope, risks, and success criteria.

Goals (what “done” means)
- A single composer at /notes/create offers three clear choices: Default, Ops, GEOINT.
- Type selection changes only tagging/content shaping; uploads, scheduling, POW, and quoting remain intact.
- GEOINT posts render correctly in Starcom (tags + embedded GeoJSON) and remain valid kind:1 notes for generic clients.
- Validation prevents incomplete GEOINT submissions (missing lat/lon) and avoids duplicate hashtags for Ops/GEOINT.
- Drafts persist per type and do not leak content between types.

Non-Goals (phase 1)
- Encrypted or private GEOINT delivery (NIP-04); private relay routing.
- Rich geometry editing (polygons/lines); we ship “Point-first” but keep a seam for future geometry types.
- Post editing/versioning; delete flows; audit trails.
- Relay reliability overhauls beyond light retry/backoff.

Post Types (MVP behaviors)
- Default Note
	- Behavior: current composer flow; no forced hashtags; uses normalizeEditorTags + client tags.
	- Audience: general posting.
- Starcom Ops
	- Behavior: append `#starcom_ops` once to human text; optional `["app", "starcom"]` tag.
	- Audience: Ops feed filtering in Navcom/Starcom.
- GEOINT
	- Behavior: append `#starcom_intel` once to human text; add geo tags + embedded GeoJSON payload via delimiter; require coordinates.
	- Audience: Starcom globe/Intel feed; generic Nostr compatibility via kind:1.

User Experience Principles
- One composer, multiple intents: selection should not fork the UI into separate screens.
- Progressive disclosure: show GEOINT fields only when GEOINT is selected; keep Default/Ops lean.
- Safety by default: block send when GEOINT is missing coordinates; warn about public visibility.
- Predictable previews: show exactly what will be sent (hashtags + delimiter + JSON snippet) to reduce surprises.

Technical Principles
- Stay on kind:1 for compatibility; avoid custom kinds in MVP.
- Keep tagging consistent and minimal; dedupe hashtags; cap content size (<~5 KB target, hard block ~10 KB).
- Preserve existing options (warnings, expiration, POW, schedule) and quote/embed behaviors.
- Limit new dependencies; if a map lib is absent, use a stub with manual entry first, abstract the picker component for later upgrade.

Interoperability Requirements (Starcom)
- Tags: `app/starcom-geoint`, `client/navcom`, `geo`, optional `g` (geohash), `geoint-type` subtype.
- Content: human text + `---GEOJSON---` + compact GeoJSON (lon, lat, alt order) with properties including subtype, timestamp, confidence, description.
- Hashtags: `#starcom_intel` (GEOINT), `#starcom_ops` (Ops) appended to human text once.

Success Criteria (measurable)
- Ops posts: always include exactly one `#starcom_ops`; no send allowed if missing? (No — allow empty body but hashtag appended.)
- GEOINT posts: blocked if lat/lon invalid; emitted events include geo tag and app/client tags; content includes delimiter and valid JSON parse; Starcom viewer can render a pin.
- Regression: Default posts unchanged; scheduling/POW/upload still work; quotes remain correct; drafts per type work.

Open Decisions to Resolve Early
- Geohash: implement lightweight helper vs. add dependency; precision target (e.g., 6–8 chars).
- Map picker: which library (leaflet/mapbox/google) or stub-first? (MVP can ship manual input + placeholder map for later replacement.)
- Confidence scale: 0–1 internal; UI could be 0–100 slider with conversion.
- Additional JSON: allow freeform object; on failure, warn and drop vs. block?
- Content size policy: warn at ~5 KB, block at ~10 KB.

Risks and Mitigations
- Risk: User confusion about public GEOINT → Mitigate with inline notice and confirmation toast copy.
- Risk: Oversized payloads rejected by relays → Mitigate with preflight size check and truncation guidance.
- Risk: Hashtag duplication cluttering content → Mitigate with ensureHashtag helper.
- Risk: Map dependency churn → Mitigate by abstracting picker into a component with manual fallback.

Deliverables Checklist
- Updated composer UI with type selector, GEOINT affordances, and per-type drafts.
- Helpers for hashtag enforcement, geo tag string, geohash, GeoJSON builder, safe JSON parse.
- Validation + error surfaces for GEOINT required fields and size limits.
- Preview that shows final text and GEOJSON block for GEOINT.
- QA cases covering default, ops, geo, schedule, POW, quotes, and failure modes.

Reading Order for the Build Docs
- overview.md (this file): scope, goals, risks.
- ux-and-flow.md: UI/interaction specifics and validation UX.
- data-and-tags.md: exact content/tag schema and assembly rules.
- tech-notes.md: integration points, state shape, helpers, preview rules.
- tasks.md: stepwise implementation plan + QA checklist.

Versioning Note
- If we add geometry types later, include `properties.version` in GeoJSON payload to ease migration.

Stakeholders and Roles
- UX/PM: approve type selector layout, copy for warnings, and modal flows; validate that Default/Ops stay lightweight.
- Engineering: implement NoteCreate changes, helpers, modal, and validations; keep regressions out of uploads/schedule/POW.
- QA: verify scenarios in tasks.md; confirm Starcom interoperability via sample posts.
- DevRel/Interop: test in Starcom viewer/simulator to confirm tags and payload parse.

Dependencies and Assumptions
- No map library is currently integrated; MVP may ship with manual inputs and a placeholder. Map integration is a follow-on.
- Signing/publish pipeline (publishThunk + sign) remains the same; we only shape content/tags.
- Relay list defaults unchanged; retry/backoff is “nice-to-have” but not expanded in MVP.

Measuring Success (post-ship)
- Adoption: percentage of posts by type (default/ops/geo) within first week.
- Error rate: blocked GEOINT submissions due to missing coords should drop to near-zero after first attempts; size-block errors should be rare (<1%).
- Starcom render success: sampled GEOINT posts render pins; no JSON parse failures in viewer logs.
- Regression: no increase in failed publishes for Default/Ops compared to baseline.

Rollout Strategy
- Behind a feature flag? (Option) Start with an environment toggle to hide GEOINT controls if unstable.
- Soft launch: internal/QA only, then enable for all users after validation.
- Telemetry (if available): log type selection and validation blocks for early triage.

Future Iterations (not now, but design with seams)
- Geometry expansion: LineString/Polygon capture; multi-point.
- Private/targeted GEOINT via private relays or NIP-04; encrypted payload options.
- Per-type relay targeting (e.g., send GEOINT to a curated set); requires UI and policy.
- Template presets for common GEOINT subtypes with default confidence ranges.

Non-functional Requirements
- Accessibility: selector and modal must be keyboard- and screen-reader-friendly.
- Performance: no perceptible slowdown in composer load; avoid heavy deps.
- Stability: avoid double-sends; preserve send-delay cancel flow.

Decision Log (to capture during implementation)
- Chosen delimiter (fixed as `---GEOJSON---`).
- App tag for Ops: adopted or skipped.
- Geohash precision and library choice.
- Size thresholds (warn/block) and final copy for errors/warnings.
- Additional JSON policy (warn + drop vs block).
