# PQC Imported Android Battery Dumps

Collect and paste full `adb shell dumpsys battery` output into each file:
- android-low-end-pre.txt
- android-low-end-post.txt
- android-mid-pre.txt
- android-mid-post.txt

Capture examples (run from repo root):
- adb -s <LOW_END_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-low-end-pre.txt
- adb -s <LOW_END_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-low-end-post.txt
- adb -s <MID_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-mid-pre.txt
- adb -s <MID_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-mid-post.txt

Importer validation rejects scaffold placeholders by default.
Only use `--allow-placeholder` for dry-run workflow checks.

Readiness + closure sequence:
1) pnpm benchmark:pqc:power:validate-import-dir
2) pnpm benchmark:pqc:power:closure:imported:safe

Dry-run guarded sequence:
pnpm benchmark:pqc:power:closure:imported:safe:dry
