import type {TrustedEvent} from "@welshman/util"
import type {GroupProjection} from "src/domain/group"
import {applyGroupControlEventsToProjection} from "src/domain/group-control"
import {applyGroupEvent} from "src/domain/group-projection"

export const applyGroupTransportProjectionEvents = (
  projection: GroupProjection,
  events: TrustedEvent[],
): GroupProjection =>
  applyGroupControlEventsToProjection(projection, events, applyGroupEvent) as GroupProjection
