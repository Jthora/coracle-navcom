# Implementation Tasks (Expanded)

0) Pre-flight
- Decide geohash strategy (helper vs dependency) and precision.
- Decide map approach for MVP (manual-only with placeholder vs lightweight map lib).
- Align on confidence UI scale (0–100 slider, stored 0–1) and policy for additional JSON (warn + drop on parse failure).

1) Selector and State
- Add segmented selector to NoteCreate: default/ops/geoint; persist in local state.
- Extend DRAFT_KEY to include type; ensure load/save per type (and per pubkey/quote if present).
- Add geointState store (lat, lon, alt?, subtype?, confidence?, timestamp?, additional?).
- Add validation error state for GEOINT blocking conditions.

2) GEOINT Data Entry
- Implement geo modal/drawer:
	- Required fields: lat, lon (manual inputs always available).
	- Optional: alt, subtype, confidence, timestamp, additional JSON.
	- Map placeholder region (no dependency required for MVP) with future hook for map clicks.
	- Actions: Save (validate + close), Cancel, Clear.
- Add summary chip in main view showing lat/lon/subtype/confidence; buttons: Edit, Clear.
- Add inline GEOINT public notice near selector.

3) Helpers and Utilities
- ensureHashtag(text, tag)
- buildGeoTagString(lat, lon, alt?)
- geohashFromLatLon(lat, lon) (optional tag; skip on failure)
- buildGeoJsonPayload(state, description)
- safeParseJson(str) for additional JSON
- sizeCheck(content) with warn/block thresholds
- Unit-test helpers where feasible.

4) Content/Tag Assembly
- Default: unchanged.
- Ops: ensure `#starcom_ops`; optionally add ["app","starcom"].
- GEOINT:
	- Validate coords; block if missing/invalid.
	- Human text: ensure `#starcom_intel`.
	- Tags: app, client, geo, geoint-type (+ geohash if available) + existing normalized tags + options tags.
	- Payload: GeoJSON-like object; content = human text + delimiter + compact JSON.
	- Enforce size check; warn/block accordingly.

5) Submit Pipeline Wiring
- Integrate type switch into onSubmit before makeEvent.
- Keep options (expiration, warning, POW, schedule) and quote logic intact.
- After successful publish, clear the active type’s draft + geo state; preserve others.
- Ensure pow/sign/publishThunk flow unaffected.

6) Preview and UX Polish
- Preview renders final text with hashtags and shows a collapsible GeoJSON block for GEOINT.
- Display tag badges (app/geo/geohash) in preview for verification.
- Maintain counters, upload button, options access, and delay toast behaviors.

7) Validation and Errors
- Blockers: missing/invalid GEOINT coords; oversized content (>10 KB).
- Warnings: extra JSON parse fail; size warn (>5 KB); geohash failure; public visibility reminder.
- Surface blocking errors inline near Send and/or selector; warnings via inline text or toast.

8) QA Checklist
- Default: send, schedule, POW, upload, quote — unchanged behavior.
- Ops: hashtag added once; no duplicates if user typed it; size limits respected.
- GEOINT: cannot send without coords; tags present (app/client/geo/geoint-type); geohash present when valid; content includes delimiter + valid JSON; preview matches sent content; drafts per type; schedule + POW still work; upload unaffected.
- Size guard: warn at ~5 KB, block at ~10 KB.
- Accessibility: keyboard nav for selector, modal focus trap, Escape closes modal, tab order sane.

9) Documentation and Dev Notes
- Update inline comments where logic is non-obvious (hashtag dedupe, size guard rationale).
- Keep build docs in sync after implementation tweaks.

10) Example Test Data (for manual QA)
- Default: "Hello world" → expect unchanged content.
- Ops: "Status green" → expect "Status green #starcom_ops"; tag added once.
- Geo minimal: text empty, lat 40.0, lon -74.0 → expect hashtag + payload; tags include geo/app/client/geoint-type.
- Geo with extra JSON bad: provide invalid JSON; expect warning, payload excludes additional.
- Geo size edge: craft payload near 9.5 KB to trigger warn but not block; >10 KB to block.

11) QA Script (manual)
- Switch types and verify drafts: type text per type, switch, return, content preserved per type.
- GEOINT missing coords: Send is disabled or blocks with message.
- GEOINT valid coords: Send enabled; preview shows JSON; tags correct in constructed event (log in dev mode).
- Ops duplicate hashtag attempt: user types #starcom_ops; ensure only one in final content.
- Schedule + POW: schedule a GEOINT post; ensure options flow and no crashes; POW still executes for geo content length.
- Upload + GEOINT: attach media, ensure uploads still work and content assembly unaffected.

12) Rollback/Fail-safe Plan
- Keep feature flag or quick guard to hide selector and revert to Default-only if critical issues found.
- Ensure deletion of geo state does not break Default/Ops posting.

13) Post-merge Tasks
- Add developer notes to README or a short how-to in docs/posts/geoint describing how to craft GEOINT posts manually (for debugging).
- If map lib is added later, update tech-notes with integration steps and additional testing.

14) Ownership and Review
- Code review: at least one reviewer familiar with NoteCreate and posting pipeline.
- UX review: verify selector, modal, warnings, and preview match designs/copy.
- QA signoff: run QA script above on desktop + mobile viewport.

15) Acceptance Criteria (definition of done)
- Default posts behave exactly as pre-change (content, tags, options, uploads, scheduling, POW, quoting).
- Ops posts always contain a single `#starcom_ops` and optionally `app/starcom`; no duplicate hashtags.
- GEOINT posts cannot be sent without valid lat/lon; when sent, they include geo/app/client/geoint-type tags and a valid JSON payload behind the delimiter; Starcom viewer can parse and render a pin from sample events.
- Content size enforcement works (warn at ~5 KB, block at ~10 KB) without breaking normal posts.
- Drafts are isolated per type; switching types does not lose typed content for the previously selected type.
- Accessibility: selector and modal are keyboard operable; Escape closes modal; focus trap functions; buttons have discernible labels.

16) Automation Ideas (if time permits)
- Unit tests for helpers (ensureHashtag, buildGeoTagString, payload builder, size check).
- Integration test (Cypress): create GEOINT post with coords, open preview, intercept publish call, assert content/tags shape.
- Lint rule or test to ensure delimiter string is not changed accidentally.
