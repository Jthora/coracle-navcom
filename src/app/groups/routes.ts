import type {Router as AppRouter} from "src/util/router"
import GroupList from "src/app/views/GroupList.svelte"
import GroupCreateJoin from "src/app/views/GroupCreateJoin.svelte"
import GroupDetail from "src/app/views/GroupDetail.svelte"
import GroupSettingsAdmin from "src/app/views/GroupSettingsAdmin.svelte"
import {registerGroupRoutesWithComponent} from "src/app/groups/route-config"

export const registerGroupRoutes = (router: AppRouter) => {
  registerGroupRoutesWithComponent(router, {
    list: GroupList,
    create: GroupCreateJoin,
    detail: GroupDetail,
    admin: GroupSettingsAdmin,
  })
}
