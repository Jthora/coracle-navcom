describe("groups", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"

  const visitWithTelemetry = (path: string, withSession = false) => {
    cy.visit(path, {
      onBeforeLoad: win => {
        ;(win as any).__groupTelemetry = []
        ;(win as any).plausible = (event: string, opts?: {props?: Record<string, unknown>}) => {
          ;(win as any).__groupTelemetry.push({event, props: opts?.props || {}})
        }

        if (withSession) {
          win.localStorage.setItem("pubkey", JSON.stringify(testPubkey))
          win.localStorage.setItem(
            "sessions",
            JSON.stringify({
              [testPubkey]: {
                method: "nip07",
                pubkey: testPubkey,
              },
            }),
          )
        }
      },
    })
  }

  const getTelemetryEvents = () =>
    cy.window().then(
      win =>
        ((win as any).__groupTelemetry || []) as Array<{
          event: string
          props: Record<string, unknown>
        }>,
    )

  const expectEvent = (
    events: Array<{event: string; props: Record<string, unknown>}>,
    name: string,
  ) => {
    const matches = events.filter(event => event.event === name)

    expect(matches.length, `event ${name}`).to.be.greaterThan(0)

    return matches[matches.length - 1]
  }

  const waitForAppReady = () => {
    cy.get("body", {timeout: 20000}).should("not.contain.text", "Loading app…")
  }

  it("shows guided create/join start", () => {
    visitWithTelemetry("/groups/create")
    waitForAppReady()
    cy.contains("Group Setup", {timeout: 20000})
    cy.contains("Create a room", {timeout: 20000})
    cy.contains("Join from invite", {timeout: 20000})
  })

  it("renders guided create controls", () => {
    visitWithTelemetry("/groups/create")
    waitForAppReady()
    cy.contains("Create a room", {timeout: 20000}).click()

    cy.contains("Create Group", {timeout: 20000})
    cy.contains("Privacy level", {timeout: 20000})
    cy.contains("Use recommended relay", {timeout: 20000})
    cy.contains("Security status", {timeout: 20000})
  })

  it("prefills join from invite query", () => {
    const groupId = encodeURIComponent("relay.example'ops")

    visitWithTelemetry(`/groups/create?groupId=${groupId}`)
    waitForAppReady()
    cy.contains("Join Group", {timeout: 20000})
    cy.contains("Invite prefill detected", {timeout: 20000})
    cy.get("input").first().should("have.value", "relay.example'ops")
  })

  it("auto-opens join flow from invite with one group payload", () => {
    const payload = encodeURIComponent(JSON.stringify([{groupId: "relay.example'ops"}]))

    visitWithTelemetry(`/invite?groups=${payload}`, true)
    cy.url({timeout: 20000}).should("include", "/groups/create")
    cy.url().should("include", "groupId=relay.example%27ops")
    cy.contains("Join Group", {timeout: 20000})
    cy.get("input").first().should("have.value", "relay.example'ops")
  })

  it("shows persistent guard recovery after blocked elevated route", () => {
    visitWithTelemetry("/groups/ops/settings")
    waitForAppReady()
    cy.url({timeout: 20000}).should("include", "/groups")
    cy.contains(
      /This group link is incomplete or invalid|Settings and moderation only work for relay-addressed groups/,
      {timeout: 20000},
    )
    cy.contains(/Next step: continue in Group Chat|Next step: use Create\/Join/, {
      timeout: 20000,
    })
    cy.contains(/Open Group Chat|Open Join Flow/, {timeout: 20000})
  })

  it("shows security readability cues on groups list", () => {
    visitWithTelemetry("/groups")
    waitForAppReady()
    cy.contains("Security labels are shown on each group card", {timeout: 20000})
  })

  it("shows explicit PQC language in guided create security status", () => {
    visitWithTelemetry("/groups/create")
    waitForAppReady()
    cy.contains("Create a room", {timeout: 20000}).click()
    cy.contains(/PQC-preferred|Compatibility first/, {timeout: 20000})
    cy.contains(/secure post-quantum-capable transport|compatibility fallback/, {timeout: 20000})
  })

  it("emits setup and join funnel telemetry with required properties", () => {
    visitWithTelemetry("/groups/create")
    waitForAppReady()

    cy.contains("Join from invite", {timeout: 20000}).click()
    cy.get("input[placeholder='Group address']").clear().type("relay.example'ops")
    cy.contains("button", "Join Group", {timeout: 20000}).click()

    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const started = expectEvent(events, "group_setup_started")
        expect(started.props.mode).to.eq("guided")
        expect(started.props.entry_point).to.eq("groups_create")

        const joinStarted = expectEvent(events, "group_join_started")
        expect(joinStarted.props.mode).to.eq("guided")

        const joinSubmitted = expectEvent(events, "group_join_submitted")
        expect(joinSubmitted.props.entry_point).to.eq("manual_address")
      })
  })

  it("emits invite funnel telemetry when opening join destination", () => {
    const payload = encodeURIComponent(JSON.stringify([{groupId: "relay.example'ops"}]))

    visitWithTelemetry(`/invite?groups=${payload}&people=${testPubkey}`, true)
    waitForAppReady()

    cy.contains("Groups", {timeout: 20000})
    cy.contains("Open Join Flow", {timeout: 20000}).click()

    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const inviteViewed = expectEvent(events, "group_invite_viewed")
        expect(inviteViewed.props.group_entries_count).to.eq(1)

        const destinationOpened = expectEvent(events, "group_invite_destination_opened")
        expect(destinationOpened.props.destination).to.eq("join_flow")
      })
  })

  it("emits setup abandoned telemetry when leaving setup before completion", () => {
    visitWithTelemetry("/groups/create")
    waitForAppReady()

    cy.window().then(win => {
      ;(win as any).router.go({path: "/groups"})
    })
    waitForAppReady()

    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const abandoned = expectEvent(events, "group_setup_abandoned")
        expect(abandoned.props.mode).to.eq("guided")
        expect(abandoned.props.result).to.eq("abandon")
      })
  })

  it("emits security-state shown and changed telemetry on chat open", () => {
    visitWithTelemetry("/groups/ops/chat")
    waitForAppReady()

    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const shown = expectEvent(events, "group_security_state_shown")
        expect(String(shown.props.state).length).to.be.greaterThan(0)

        const changed = expectEvent(events, "group_security_state_changed")
        expect(changed.props.from_state).to.eq("unknown")
        expect(String(changed.props.to_state).length).to.be.greaterThan(0)
      })
  })
})
