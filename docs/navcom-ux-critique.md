# NavCom Interface Synthesis — UX Critique

> _The synthesis over-corrects. It designs for the war room, not the human._

---

## The Core Problem

The interface synthesis swings from Coracle's failure (100% social client, 0% ops) to the opposite extreme (~95% CIC/ops-center, ~5% actual first-use scenario). Every reference in the roster — ATAK, CIC, EVE fleet command, LCARS — involves **trained operators**. The synthesis proposes equivalent complexity with zero training path and zero progressive disclosure.

Signal has 2 billion users because the interface is: list of conversations → conversation → type → send. The synthesis proposes status strip (7 items) + categorized channel sidebar + switching center viewport + comms pane with type badges and encryption indicators + action bar — all simultaneously visible. That's a cockpit, not an interface for someone told "go join our group."

**The critical question the synthesis fails to answer: what does the interface look like at minute one for a person who has never seen it before?**

---

## The 12 Specific Findings

### 1. Three Layouts, Zero Default

The synthesis proposes Layout A (Cockpit), B (CIC), and C (ATAK Mobile) as options. You can't ship three layouts. It needs to be **one layout that adapts** — and the correct starting point is mobile (the most constrained), expanding to desktop. Not the reverse. Starting from CIC and collapsing to mobile produces a hamburger menu full of features, which is what Coracle already is.

### 2. Map-First Mobile Is an Assumption, Not a User Need

ATAK is map-first because soldiers navigate physical terrain under fire. The original UX audit scenario is: *"go to navcom.app and join our group chat."* That person wants **chat**, not a map. Making them land on a full-screen map when they came to talk is the same category of error as Coracle's announcements feed — wrong first screen for the actual intent.

Map-first makes sense when the primary task is spatial awareness. Chat-first makes sense when the primary task is communication. NavCom needs to detect or let the user choose — not hardcode an assumption.

### 3. Status Strip Overload

Seven persistent indicators (relay health, encryption tier, UTC clock, operator count, connection quality, offline queue, alert badges) on a 375px mobile screen is either illegibly small or consuming 40px of precious vertical space for information not needed every second.

**What matters at a glance:** Connection status (online?) and unread alerts (urgent?). Everything else is detail-on-demand. A UTC clock is meaningful in multi-timezone military operations. For a community group in the same city, it's noise.

### 4. NATO Report Templates Are Training Requirements

SITREP fields (Date-Time Group, Situation Summary, Activity Observed, Actions Taken, Requests) and SPOTREP fields (Size, Activity, Location, Unit/Uniform, Time, Equipment) were developed by organizations with mandatory training programs. A civilian operator doesn't know what a "Date-Time Group" is.

**Start with two universally understandable types:** Check-In (one tap: "here, fine") and Alert (subject + body + optional location). SITREP/SPOTREP become opt-in templates that specific groups enable — not default compose options.

### 5. Channel Categories Assume Organizational Structure

Proposed categories (COMMAND, OPERATIONS, INTELLIGENCE, GENERAL) mirror a military unit structure. In practice, groups are ad-hoc: neighborhood watch, protest coordination, mutual aid. The taxonomy adds cognitive overhead for users and administrative overhead for creators.

**Let channels self-organize by activity.** Recently active on top, muted at bottom. If categories are needed, let group admins create them — don't impose hierarchy.

### 6. ACK/ESC/FLAG Assumes a Command Chain

"Escalate — forward to a higher-tier channel" requires a defined command hierarchy. Most groups won't have one. Who is "higher-tier" in a flat community group?

**Universally useful (show by default):** ACK (I've seen this), FLAG (personal bookmark), PIN (admin-pinned). **Organizational (available but not prominent):** ESC and TASK — activated when a group defines its hierarchy.

### 7. Encryption Indicators Everywhere Is Security Theater UX

The synthesis puts encryption status on: every message, the status strip, operator cards, and the dashboard. For the "join our group chat" user, that's four layers of information about a concept they don't understand and can't act on.

Signal shows "end-to-end encrypted" once. It doesn't badge every message because the user can't do anything with per-message encryption status.

**Show encryption status once per conversation (channel header).** PQC status goes in settings/credential pages. Security should be real (it is) and invisible — not plastered everywhere to look secure.

### 8. Message Type Badges Create Noise

If 90% of messages are regular text, the "MSG" badge is pure visual noise — like labeling every email "EMAIL."

**Only badge non-default types.** No badge = normal message. Green checkmark = CHECK-IN. Red triangle = ALERT. Clipboard = SITREP. Absence of badge means default.

### 9. "Callsign" Is Cool But Creates a Concept

Renaming "username" to "callsign" is thematic. It's also +1 concept for every new user. "Choose your callsign" is fine if the UI also accepts that someone will type "Sarah." 

**Keep the word. Clarify the concept:** "Choose a name (your callsign)" on the enrollment screen.

### 10. Progressive Capability Should Be Use-Based, Not Time-Based

"After 1 day: prompt for PQC. After 1 week: prompt for trust." Time-based triggers are arbitrary. An operator who sends 50 messages in 2 hours should get PQC prompts sooner. Someone who never returns shouldn't get prompts at all.

**Trigger on behavior:** PQC prompt when joining a Tier 1+ group (they need it). Trust prompt when interacting with N distinct operators (social proof is possible). Backup prompt when they've sent N messages (they have something to lose).

### 11. Draw Tools Are Power Features

<5% of operators will draw polygons. Putting draw tools in the main toolbar clutters the interface for the 95% who just want to see markers.

**Map opens clean.** A "Tools" button (or long-press) reveals the power toolbar: draw, measure, layers, temporal slider. Progressive disclosure.

### 12. Dashboard Tries to Be Everything

Eight proposed components: map thumbnail, channel status cards, intel feed, relay health, operator roster, announcements, quick actions, encryption status. On a phone, that's a long scrollable page (defeating "at a glance") or an impossibly dense grid.

**Three core elements:** (1) Your channels with unread counts, (2) Quick actions (Check-In, Alert), (3) One featured card (map OR activity OR announcement — whichever is most relevant). Dashboard is a **launch pad**, not a **situation room**.

---

## The Fundamental Fix: Two Modes, One App

The synthesis treats NavCom as one interface for one user type. In reality:

**Comms Mode** (the 90% case): Talk to my group, read messages, send a check-in. Feels like Signal — channel list, message stream, compose bar. Clean. Fast. Zero training.

**Ops Mode** (the 10% case, or 90% for certain users): See the operational picture — map + feeds + status + group activity fused. Feels like ATAK/CIC. Dense. Multi-pane. Information-rich.

Not separate apps. Modes — switchable via toggle or gesture. **Comms Mode is the default.** Ops Mode is for when you need the full picture.

**Signal by default, ATAK when you need it.**

This is how Elite: Dangerous actually works — the cockpit center is flight (the default), panels slide in only when needed. The synthesis correctly identified the reference but missed the interaction model: the panels are hidden by default.
