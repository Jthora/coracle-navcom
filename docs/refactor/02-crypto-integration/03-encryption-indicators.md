# 02-03: Encryption Indicators

> Make the invisible crypto engine visible to users — per-channel, not per-message.

**Priority**: MEDIUM — important for trust, but not blocking.  
**Effort**: LOW  
**Depends on**: 02-01 (message path wiring — so there's something to indicate)  
**Source**: [navcom-ux-critique.md](../../navcom-ux-critique.md) §7, [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Encryption Indicator

> **NIP Reference**: Encryption tiers map to NIP-29 baseline (T0), NIP-EE secure groups with kind 445 (T1/T2), and the NIP-44 encryption primitive. NIP-EE is experimental. See [NIP Inventory](../nip-inventory.md).

---

## Design Decision

Per the UX critique: "Encryption indicators everywhere = security theater." Show encryption status **once per channel** in the header, not on every message.

---

## Channel Header Indicator

When viewing a channel conversation, the header shows:

| Tier | Display | Color |
|------|---------|-------|
| T0 (open) | No indicator | — |
| T1 (encrypted) | 🔒 Encrypted | `text-success` |
| T2 (enforced) | 🔐 End-to-End Enforced | `text-success` with accent border |
| Degraded (T1, key unavailable) | ⚠ Encryption Unavailable | `text-warning` |

### First-Visit Education

On the first visit to an encrypted channel, show a one-time tooltip:
```
"Messages in this channel are encrypted with ML-KEM-768.
Only group members can read them."
[Got it]
```

Store dismissal in localStorage. Don't show again.

---

## Channel Sidebar Indicator

In the channel list (ChannelSidebar from 01-02), each channel row shows a small lock icon:

- 🔒 for T1/T2 encrypted
- No icon for T0
- ⚠ for degraded

This is sufficient — the sidebar doesn't need to distinguish T1 from T2.

---

## Message-Level Indicator (Intentionally Omitted)

Do NOT show per-message encryption badges. Reasons:
- Every message in an encrypted channel is encrypted — marking each one is noise
- It trains users to expect the badge, then panic when any message lacks it
- Signal, WhatsApp, and every successful E2E messenger shows encryption per-conversation, not per-message

---

## Files to Modify

| File | Change |
|------|--------|
| `GroupConversation.svelte` (or channel header) | Add encryption tier indicator |
| `ChannelSidebar.svelte` (from 01-02) | Add lock icon per channel |

---

## Verification

- [ ] T0 channel shows no encryption indicator
- [ ] T1 channel shows lock with "Encrypted" label
- [ ] T2 channel shows enforced lock with "End-to-End Enforced" label
- [ ] First visit to encrypted channel shows education tooltip
- [ ] Tooltip dismisses and doesn't reappear
- [ ] Individual messages have no encryption badges
