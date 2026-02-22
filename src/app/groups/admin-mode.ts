export type GroupAdminMode = "guided" | "expert"

const makeKey = (groupId: string) => `group_admin_mode:${groupId}`

export const getGroupAdminMode = (groupId: string): GroupAdminMode => {
  if (typeof window === "undefined") return "guided"

  const stored = window.localStorage.getItem(makeKey(groupId))

  return stored === "expert" ? "expert" : "guided"
}

export const setGroupAdminMode = (groupId: string, mode: GroupAdminMode) => {
  if (typeof window === "undefined") return

  window.localStorage.setItem(makeKey(groupId), mode)
}
