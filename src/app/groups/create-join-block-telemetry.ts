import type {GuidedPrivacyLevel} from "src/app/groups/guided-create-options"
import type {GuidedSetupBlockReason} from "src/app/groups/create-join-policy"
import type {MissingRelayCredentialSummary} from "src/app/groups/relay-auth-ux"
import type {RelayCheckCounts} from "src/app/groups/create-join-view-helpers"

export const buildGuidedBlockTelemetryProps = ({
  flow,
  blockReason,
  securityMode,
  requestedTransportMode,
  missionTier,
  relayCount,
  relayCounts,
  missingCredentials,
}: {
  flow: "create" | "join"
  blockReason: GuidedSetupBlockReason
  securityMode: GuidedPrivacyLevel
  requestedTransportMode: string
  missionTier: 0 | 1 | 2 | null
  relayCount: number
  relayCounts: RelayCheckCounts
  missingCredentials: MissingRelayCredentialSummary
}) => ({
  flow,
  block_reason: blockReason,
  security_mode: securityMode,
  requested_transport_mode: requestedTransportMode,
  mission_tier: missionTier,
  relay_count: relayCount,
  ready_count: relayCounts.readyCount,
  auth_required_count: relayCounts.authRequiredCount,
  unreachable_count: relayCounts.unreachableCount,
  not_advertised_count: relayCounts.notAdvertisedCount,
  no_groups_count: relayCounts.notAdvertisedCount,
  missing_signer_count: missingCredentials.missingSignerRelays.length,
  unknown_auth_method_count: missingCredentials.unknownMethodRelays.length,
  result: "error",
})
