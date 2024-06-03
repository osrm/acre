import { beforeEach, describe, expect, it } from "vitest"
import { createActivity } from "#/tests/factories"
import { Activity } from "#/types"
import { WalletState } from "../wallet"
import reducer, {
  deleteLatestActivity,
  setActivities,
} from "../wallet/walletSlice"

const pendingActivityId = "0"
const pendingActivity = createActivity({
  id: pendingActivityId,
  status: "pending",
})
const latestActivities = {
  [pendingActivityId]: pendingActivity,
}
const activities = [
  pendingActivity,
  createActivity({ id: "1" }),
  createActivity({ id: "2" }),
]

describe("Wallet redux slice", () => {
  let state: WalletState

  beforeEach(() => {
    state = {
      activities,
      latestActivities,
    }
  })

  it("should delete latest activity", () => {
    expect(reducer(state, deleteLatestActivity(pendingActivityId))).toEqual({
      activities,
      latestActivities: {},
    })
  })

  it("should update activities when the status of item changes", () => {
    const newActivities = [...activities]
    const completedActivity: Activity = {
      ...pendingActivity,
      status: "completed",
    }
    const foundIndex = newActivities.findIndex(
      ({ id }) => id === pendingActivityId,
    )
    newActivities[foundIndex] = completedActivity
    const newLatestActivities = {
      [pendingActivityId]: completedActivity,
    }

    expect(reducer(state, setActivities(newActivities))).toEqual({
      activities: newActivities,
      latestActivities: newLatestActivities,
    })
  })
})