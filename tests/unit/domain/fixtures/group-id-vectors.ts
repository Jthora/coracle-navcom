export const GROUP_ID_GOLDEN_VECTORS = [
  {
    name: "relay_id_normalized",
    input: " Groups.Nostr.Com'ALPHA_TEAM ",
    expected: {kind: "relay", canonicalId: "groups.nostr.com'alpha_team"},
  },
  {
    name: "opaque_id",
    input: "team_ops_1",
    expected: {kind: "opaque", canonicalId: "team_ops_1"},
  },
  {
    name: "naddr_id",
    input: "34550:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:ops",
    expected: {
      kind: "naddr",
      canonicalId: "34550:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:ops",
    },
  },
] as const
