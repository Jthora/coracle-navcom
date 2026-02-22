export type GroupAdminMode = "guided" | "expert"

const makeKey = (groupId: string) => `group_admin_mode:${groupId}`

export const getGroupAdminMode = (groupId: string): GroupAdminMode => {
  if (typeof window === "undefined") return "guided"

  let stored: string | null = null

  try {
    stored = window.localStorage.getItem(makeKey(groupId))
  } catch {
    return "guided"
  }

  return stored === "expert" ? "expert" : "guided"
}

export const setGroupAdminMode = (groupId: string, mode: GroupAdminMode) => {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(makeKey(groupId), mode)
  } catch {
    return
  }
}
