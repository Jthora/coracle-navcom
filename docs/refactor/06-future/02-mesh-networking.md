# 06-02: Mesh Networking & Local-First Operation

> Enable peer-to-peer communication when internet connectivity is completely unavailable.

**Priority**: ASPIRATIONAL — this is the long-term vision differentiator  
**Effort**: VERY HIGH (new transport layer, protocol design, hardware integration)  
**Depends on**: 05-03 (offline queue), 02-01 (message path wiring), 05-05 (key storage)  
**Source**: [navcom-vision.md](../../navcom-vision.md) §INFRA pillar, [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §Capability Audit

---

## Problem

NavCom currently requires internet connectivity through Nostr relays. In the target use case (field operations, disaster response, austere environments), internet may be:

- Completely unavailable
- Extremely low bandwidth (satellite, HF radio)
- Intermittent (moving between coverage areas)
- Compromised (adversary-controlled infrastructure)

Without mesh networking, NavCom is just another app that doesn't work when you need it most.

---

## Vision

Messages flow through whatever transport is available:

```
Priority order:
1. Direct peer-to-peer (BLE, WiFi Direct, local network)
2. Mesh relay (hop through nearby NavCom devices)
3. Low-bandwidth bridge (Meshtastic LoRa, HF radio)
4. Internet relay (standard Nostr relays)
```

The user doesn't choose the transport — NavCom selects the best available path automatically.

---

## Research Areas

### 1. WebRTC Data Channels

Browser-native peer-to-peer. Challenges:
- Requires signaling server for initial connection (chicken-and-egg without internet)
- Can use local signaling via mDNS or QR code exchange
- Good for LAN/WiFi scenarios

### 2. Bluetooth Low Energy (BLE)

Via Capacitor plugin on mobile. Challenges:
- Range: ~100m line-of-sight
- Throughput: ~1Mbps
- Platform API differences (Android vs iOS)
- Background operation restrictions

### 3. WiFi Direct / WiFi Aware

Device-to-device without access point. Challenges:
- Android-only (WiFi Aware API)
- No browser API — requires native plugin
- Range: ~200m

### 4. Meshtastic Bridge

[Meshtastic](https://meshtastic.org/) provides LoRa mesh networking with ~3km range. NavCom could bridge:
- NavCom app ↔ BLE ↔ Meshtastic radio ↔ LoRa mesh ↔ Meshtastic radio ↔ BLE ↔ NavCom app
- Extremely low bandwidth (~200 bytes/message)
- Only text messages and check-ins feasible over LoRa

### 5. Local Nostr Relay

Run a lightweight Nostr relay on-device or on a local server:
- Devices on same WiFi/LAN connect to local relay
- Local relay syncs to internet relays when connectivity returns
- No protocol changes needed — just a different relay URL

---

## Phased Approach

### Phase A: Local Relay Discovery (least effort, most value)

1. Allow configuring a local relay URL (e.g., `ws://192.168.1.100:7777`)
2. mDNS service discovery for `_nostr._tcp` services on local network
3. Auto-connect to discovered local relays alongside internet relays
4. This works TODAY with existing Nostr protocol — no new transport needed

### Phase B: Meshtastic Integration

1. BLE connection to paired Meshtastic device
2. Encode minimal Nostr events (text + signature) into Meshtastic packets
3. NavCom → BLE → Meshtastic → LoRa mesh → Meshtastic → BLE → NavCom
4. Receive handler decodes and inserts into local message store
5. Tight message size constraints: strip event to essential fields

### Phase C: Direct Peer-to-Peer

1. WebRTC data channels with local signaling (QR code or BLE)
2. Peer discovery and connection management
3. Message relay (store-and-forward through mesh of connected peers)
4. Most complex — significant protocol design work

---

## Message Format for Constrained Channels

For LoRa and other low-bandwidth transports, define a compact binary encoding:

```
[1 byte: type] [4 bytes: timestamp] [32 bytes: pubkey prefix] [N bytes: content] [64 bytes: signature]
```

Total overhead: ~101 bytes + content. At 200 bytes max:
- ~99 bytes for content (~99 ASCII characters)
- Enough for check-ins and short alerts
- Not enough for SITREPs or images

---

## Files to Create (Phase A only)

| File | Purpose | Lines |
|------|---------|-------|
| `src/engine/transport/local-relay.ts` | Local relay discovery + connection | ~80 |
| Settings UI addition | Configure local relay URL | ~30 |

---

## Open Questions

- [ ] What Capacitor BLE plugin to use? (`@capacitor-community/bluetooth-le`)
- [ ] Can Meshtastic Protocol Buffers be compiled for browser/Capacitor?
- [ ] What's the minimum viable Nostr event for LoRa transport?
- [ ] How to handle message deduplication across transports?
- [ ] How to handle time synchronization without NTP?

---

## Verification (Phase A)

- [ ] Configure local relay URL → connects alongside internet relays
- [ ] mDNS discovers local Nostr relay on LAN → auto-connects
- [ ] Messages sent via local relay appear in conversation
- [ ] Internet goes down → local relay still works
- [ ] Internet returns → messages sync to internet relays
