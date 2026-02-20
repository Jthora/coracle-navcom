#!/usr/bin/env bash
set -euo pipefail

MODE="linux"
OUTPUT="docs/security/pqc/cache/power-metrics.ndjson"
LABEL=""
PHASE=""
PROFILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --label)
      LABEL="$2"
      shift 2
      ;;
    --phase)
      PHASE="$2"
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
mkdir -p "$(dirname "$OUTPUT")"

json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

capture_linux() {
  local battery_dir
  battery_dir="$(find /sys/class/power_supply -maxdepth 1 -type d -name 'BAT*' | head -n 1 || true)"

  local capacity="null"
  local voltage_uv="null"
  local current_ua="null"
  local power_uw="null"
  local energy_now_uj="null"
  local status="unknown"

  if [[ -n "$battery_dir" ]]; then
    [[ -f "$battery_dir/capacity" ]] && capacity="$(cat "$battery_dir/capacity")"
    [[ -f "$battery_dir/voltage_now" ]] && voltage_uv="$(cat "$battery_dir/voltage_now")"
    [[ -f "$battery_dir/current_now" ]] && current_ua="$(cat "$battery_dir/current_now")"
    [[ -f "$battery_dir/power_now" ]] && power_uw="$(cat "$battery_dir/power_now")"
    [[ -f "$battery_dir/energy_now" ]] && energy_now_uj="$(cat "$battery_dir/energy_now")"
    [[ -f "$battery_dir/status" ]] && status="$(cat "$battery_dir/status")"
  fi

  local load_1="$(awk '{print $1}' /proc/loadavg)"
  local mem_total_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
  local mem_available_kb="$(awk '/MemAvailable/ {print $2}' /proc/meminfo)"

  local phase_field='"phase":null'
  local profile_field='"profile":null'

  if [[ -n "$PHASE" ]]; then
    phase_field="\"phase\":\"$PHASE\""
  fi

  if [[ -n "$PROFILE" ]]; then
    profile_field="\"profile\":\"$PROFILE\""
  fi

  cat <<EOF
{"timestamp":"$timestamp","mode":"linux","label":"$LABEL",$phase_field,$profile_field,"load_1":$load_1,"mem_total_kb":$mem_total_kb,"mem_available_kb":$mem_available_kb,"battery":{"capacity":$capacity,"voltage_uv":$voltage_uv,"current_ua":$current_ua,"power_uw":$power_uw,"energy_now_uj":$energy_now_uj,"status":"$status"}}
EOF
}

capture_android() {
  if ! command -v adb >/dev/null 2>&1; then
    echo "adb not found for --mode android" >&2
    exit 1
  fi

  local battery_dump
  battery_dump="$(adb shell dumpsys battery || true)"
  local escaped_dump
  escaped_dump="$(printf "%s" "$battery_dump" | json_escape)"

  local phase_field='"phase":null'
  local profile_field='"profile":null'

  if [[ -n "$PHASE" ]]; then
    phase_field="\"phase\":\"$PHASE\""
  fi

  if [[ -n "$PROFILE" ]]; then
    profile_field="\"profile\":\"$PROFILE\""
  fi

  cat <<EOF
{"timestamp":"$timestamp","mode":"android","label":"$LABEL",$phase_field,$profile_field,"battery_dump":$escaped_dump}
EOF
}

case "$MODE" in
  linux)
    capture_linux >> "$OUTPUT"
    ;;
  android)
    capture_android >> "$OUTPUT"
    ;;
  *)
    echo "Unsupported mode: $MODE" >&2
    exit 1
    ;;
esac

echo "Wrote power metrics snapshot to $OUTPUT"