import { Activity } from "#/types"

export const isActivityCompleted = (activity: Activity): boolean =>
  activity.status === "completed"

export const sortActivitiesByTimestamp = (activities: Activity[]): Activity[] =>
  activities.sort(
    (activity1, activity2) => activity1.timestamp - activity2.timestamp,
  )