# Data and Tags (Expanded)

Common Event Shape
- kind: 1
- Base tags: start with normalizeEditorTags + getClientTags; add type-specific tags below.
- Client tag: ["client", "navcom"] should be present for all types (add if missing).
- Hashtags: enforce single occurrence with helper; append rather than prepend; add a space when needed.
- Content budget: target < 5 KB; hard block at ~10 KB to avoid relay issues.

Default Type
- Human text: unchanged from editor output (trimmed). No forced hashtag.
- Tags: no additional required tags beyond client; keep existing normalization.
- Content: exactly the user text (plus any NoteOptions-driven metadata tags like expiration/warning).

Starcom Ops Type
- Human text: ensure `#starcom_ops` is present exactly once, appended after trimming. If the user already typed it, avoid duplicates.
- Tags: always add ["app", "starcom"] for filtering.
- Content: user text with appended hashtag; no delimiter/JSON.
- Validation: none beyond defaults; allow empty body (hashtag still added).

GEOINT Type (Point-first)
- Required tags:
  - ["app", "starcom-geoint"] (standardized for GEOINT posts).
  - ["client", "navcom"].
  - ["geo", "lat:<lat>,lon:<lon>,alt:<alt?>"] — lat first, lon second; alt omitted if null. Use fixed precision (e.g., 6 decimals).
  - ["geoint-type", "report"|"sighting"|"event"|custom] — default to "report" if unset.
- Optional tags:
  - ["g", "<geohash>"] if we generate from lat/lon (precision 6–8 chars recommended).
- Human text:
  - Start with trimmed editor text.
  - Append `#starcom_intel` once; if text is non-empty, prefix with a space.
- Content assembly:
  - Delimiter: `---GEOJSON---` (exact string).
  - Payload: GeoJSON-inspired object, lon/lat/alt order per GeoJSON spec.
```
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [<lon>, <lat>, <alt?>]
  },
  "properties": {
    "timestamp": "<ISO>",
    "type": "<geoint subtype>",
    "description": "<human text before delimiter>",
    "confidence": <0..1 or null>,
    "additional": { ... },
    "version": 1
  }
}
```
- Final content string: `<human_with_hashtag> ---GEOJSON---<compact JSON>` where JSON is `JSON.stringify(payload)`.
- Size budget: payload should be compact (no pretty print) to stay under limits.

Validation Rules (apply before sign)
- Lat/lon: numeric; lat ∈ [-90, 90]; lon ∈ [-180, 180]. Block send if invalid or missing in GEOINT.
- Altitude: optional numeric; omit if NaN.
- Confidence: accept 0–1 or 0–100 UI; normalize to 0–1 float; clamp to [0,1].
- Timestamp: default now() ISO; must be valid Date; otherwise replace with now().
- Additional JSON: parse to object; on failure, drop and warn (non-blocking) or block? (policy: warn + drop to avoid UX friction).
- Content length: warn > 5 KB, block > 10 KB.

Tag Construction Details
- geo tag formatting: use fixed precision (e.g., 6 decimals) to reduce churn; drop trailing zeros? (decide: keep fixed for stability).
- geohash: generate only when lat/lon valid; avoid adding stale geohash when coords change.
- geoint-type: default "report"; allow custom free text but keep it short (<32 chars) to avoid tag bloat.

Hashtag Enforcement
- ensureHashtag(text, tag): trims, checks case-sensitive exact match; if missing, append with a preceding space if text length > 0, else tag alone.
- Apply to ops (#starcom_ops) and geo (#starcom_intel). Do not insert into JSON portion; only the human text portion.

Assembly Order (GEOINT)
1) Base text = trimmed editor text.
2) Human text = ensureHashtag(base text, "#starcom_intel").
3) Build payload object from geo state + description (base text) and metadata.
4) Serialize payload with JSON.stringify (no whitespace).
5) content = `${human text} ---GEOJSON---${payloadJSON}`.
6) tags = normalized editor tags + client tag + app tag + geo/geoint-type (+ geohash if available) + options tags (warnings, expiration, etc.).

Examples
- Ops content: "Routine check-in. #starcom_ops"
- Geo content: "UFO sighting. #starcom_intel ---GEOJSON---{"type":"Feature","geometry":{"type":"Point","coordinates":[-122.3,47.6,100]},"properties":{"timestamp":"2026-02-11T10:00:00Z","type":"sighting","description":"UFO sighting.","confidence":0.85,"version":1}}"

Future-proofing Hooks
- Add `properties.version` now to ease schema evolution.
- Consider `geometry.type` flexibility later (LineString/Polygon) with the same delimiter approach.
- Reserve optional tag `geoint-version` if schema diverges later.

Delimiter and Collision Handling
- Delimiter string is static: `---GEOJSON---`.
- If user text contains the delimiter, we do NOT strip it; the delimiter we append separates human text from JSON. The preview should make this explicit.
- Parsing on the reader side should split on the first occurrence of the delimiter to avoid accidental user text copies—note this for Starcom, but we still send exactly one delimiter.

Size Calculation Guidance
- Compute byte length using UTF-8 (e.g., new Blob([content]).size) rather than string length to be precise for non-ASCII, though we expect ASCII-heavy payloads.
- Warn threshold: > 5_000 bytes; block: > 10_000 bytes.
- If blocking, surface error: "Post is too large after adding GEOJSON payload (X KB). Trim text or additional data."

Geohash Policy
- Precision: use 6 characters (approx neighborhood scale) for now. This keeps the tag short and useful.
- Failure handling: if geohash computation throws or returns falsy, omit the tag silently and add a non-blocking warning in UI.

Examples: Full Event Skeletons
- Ops event (pseudo):
```
kind: 1
content: "Routine check-in. #starcom_ops"
tags: [
  ["client","navcom"],
  ["app","starcom"],
  ...normalized editor tags...
]
```
- GEOINT event (pseudo):
```
kind: 1
content: "Recon report. #starcom_intel ---GEOJSON---{"type":"Feature","geometry":{"type":"Point","coordinates":[12.4924,41.8902]},"properties":{"timestamp":"2026-02-11T10:00:00Z","type":"report","description":"Recon report.","confidence":0.6,"version":1}}"
tags: [
  ["client","navcom"],
  ["app","starcom-geoint"],
  ["geo","lat:41.890200,lon:12.492400"],
  ["geoint-type","report"],
  ["g","sr2y7p"],
  ...normalized editor tags + options...
]
```

Error Messaging Templates
- Missing coords (block): "Add latitude and longitude to publish a GEOINT post."
- Invalid coords (block): "Latitude must be between -90 and 90; longitude between -180 and 180."
- Size block: "Post is too large after adding GEOJSON payload (X KB)."
- JSON parse warn: "Additional data is not valid JSON; it was ignored."

Open Questions (to lock before implementation)
- Resolved: Ops adds `app/starcom`.
- Resolved: GEOINT allows empty description (no minimum).
- Resolved: Strip trailing whitespace before appending hashtags.
