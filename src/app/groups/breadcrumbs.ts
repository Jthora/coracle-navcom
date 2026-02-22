export type GroupBreadcrumbItem = {
  label: string
  href?: string
  current?: boolean
}

export type GroupBreadcrumbSection =
  | "list"
  | "create-room"
  | "join-room"
  | "overview"
  | "chat"
  | "members"
  | "moderation"
  | "settings"

const isOpaqueGroupId = (value: string) => /^[a-f0-9]{32,}$/i.test(value)

const toReadableGroupLabel = (value: string) =>
  isOpaqueGroupId(value) ? `${value.slice(0, 12)}…${value.slice(-8)}` : value

const resolveCurrentLabel = (section: GroupBreadcrumbSection) => {
  if (section === "create-room") return "Create Group"
  if (section === "join-room") return "Join Group"
  if (section === "chat") return "Chat"
  if (section === "members") return "Members"
  if (section === "moderation") return "Moderation"
  if (section === "settings") return "Settings"

  return "Groups"
}

export const buildGroupBreadcrumbItems = ({
  section,
  groupId,
  groupTitle,
}: {
  section: GroupBreadcrumbSection
  groupId?: string
  groupTitle?: string
}): GroupBreadcrumbItem[] => {
  if (section === "list") {
    return [{label: "Groups", current: true}]
  }

  const items: GroupBreadcrumbItem[] = [{label: "Groups", href: "/groups"}]

  if (section === "create-room" || section === "join-room") {
    items.push({label: resolveCurrentLabel(section), current: true})

    return items
  }

  const encodedGroupId = groupId ? encodeURIComponent(groupId) : ""
  const groupHref = encodedGroupId ? `/groups/${encodedGroupId}` : "/groups"
  const resolvedGroupLabel = toReadableGroupLabel(groupTitle || groupId || "Group")

  if (section === "overview") {
    items.push({label: resolvedGroupLabel, current: true})

    return items
  }

  items.push({label: resolvedGroupLabel, href: groupHref})
  items.push({label: resolveCurrentLabel(section), current: true})

  return items
}
