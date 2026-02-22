export type GroupBreadcrumbItem = {
  label: string
  href?: string
  current?: boolean
}

export type GroupBreadcrumbSection =
  | "list"
  | "create"
  | "create-room"
  | "join-room"
  | "overview"
  | "chat"
  | "members"
  | "moderation"
  | "settings"

const resolveCurrentLabel = (section: GroupBreadcrumbSection) => {
  if (section === "create") return "Group Setup"
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

  if (section === "create" || section === "create-room" || section === "join-room") {
    if (section === "create") {
      items.push({label: "Group Setup", current: true})

      return items
    }

    items.push({label: "Group Setup", href: "/groups/create"})
    items.push({label: resolveCurrentLabel(section), current: true})

    return items
  }

  const encodedGroupId = groupId ? encodeURIComponent(groupId) : ""
  const groupHref = encodedGroupId ? `/groups/${encodedGroupId}` : "/groups"
  const resolvedGroupLabel = groupTitle || groupId || "Group"

  if (section === "overview") {
    items.push({label: resolvedGroupLabel, current: true})

    return items
  }

  items.push({label: resolvedGroupLabel, href: groupHref})
  items.push({label: resolveCurrentLabel(section), current: true})

  return items
}
