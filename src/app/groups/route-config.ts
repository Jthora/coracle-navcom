import {
  asGroupAddress,
  asGroupInviteLabel,
  asGroupInviteMode,
  asGroupInviteTier,
} from "src/app/groups/serializers"
import {guardGroupRoute} from "src/app/groups/guards"

export const GROUP_ROUTE_PATHS = [
  "/groups",
  "/groups/create",
  "/groups/:groupId",
  "/groups/:groupId/members",
  "/groups/:groupId/moderation",
  "/groups/:groupId/settings",
] as const

export const registerGroupRoutesWithComponent = (
  router: {register: (path: string, component: unknown, opts?: Record<string, unknown>) => void},
  components: {
    list: unknown
    create: unknown
    detail: unknown
    admin: unknown
  },
) => {
  router.register("/groups", components.list, {
    requireSigner: true,
  })

  router.register("/groups/create", components.create, {
    requireSigner: true,
    serializers: {
      groupId: asGroupAddress,
      preferredMode: asGroupInviteMode,
      missionTier: asGroupInviteTier,
      label: asGroupInviteLabel,
    },
  })

  const detailOptions = {
    requireSigner: true,
    required: ["groupId"],
    serializers: {
      groupId: asGroupAddress,
    },
    guard: ({path, props}: {path: string; props: Record<string, unknown>}) =>
      guardGroupRoute({path, groupId: props.groupId as string | undefined}),
  }

  router.register("/groups/:groupId", components.detail, detailOptions)
  router.register("/groups/:groupId/members", components.detail, detailOptions)
  router.register("/groups/:groupId/moderation", components.admin, detailOptions)
  router.register("/groups/:groupId/settings", components.admin, detailOptions)
}
