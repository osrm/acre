import { Activity, ActivityType } from "#/types"

const MIN_LIMIT_VALUE_DURATION = BigInt(String(1e7)) // 0.1 BTC
const MAX_LIMIT_VALUE_DURATION = BigInt(String(1e8)) // 1 BTC

export const isActivityCompleted = (activity: Activity): boolean =>
  activity.status === "completed"

export const getActivityTimestamp = (activity: Activity): number =>
  activity?.finalizedAt ?? activity.initializedAt

export const sortActivitiesByTimestamp = (activities: Activity[]): Activity[] =>
  [...activities].sort(
    (activity1, activity2) =>
      getActivityTimestamp(activity2) - getActivityTimestamp(activity1),
  )

export const isWithdrawType = (type: ActivityType) => type === "withdraw"

export function getEstimatedDuration(
  amount: bigint,
  type: ActivityType,
): string {
  // Withdrawal duration is related to the tBTC redemption process, which takes
  // approximately 5 - 7 hours. We use the average value of 6 hours.
  if (isWithdrawType(type)) return "6 hours"

  // Deposit duration is related to the tBTC minting process, which varies based
  // on the amount of BTC deposited.
  // Each threshold requires a different number of Bitcoin transaction confirmations:
  // <0.1 BTC: 1 Bitcoin block confirmation (~10 minutes),
  // >=0.1 BTC and <1 BTC: 3 Bitcoin block confirmations (~30 minutes),
  // >=1 BTC: 6 Bitcoin block confirmations (~60 minutes).
  // The duration of the transaction minting process depends on the Bitcoin network
  // congestion, and the fee paid by the user.
  //
  // After the required number of Bitcoin block confirmations, the tBTC optimistic
  // minting process starts. The optimistic minting process takes approximately
  // 1 hour to complete.
  // After optimistic minting is completed, the Acre bots will finalize the deposit
  // in no more than 10 minutes.
  //
  // We round the estimated duration up to the nearest hour.
  //
  // For <0.1 BTC estimated duration is around 1 hour 20 minutes.
  if (amount < MIN_LIMIT_VALUE_DURATION) return "2 hours"
  // For <1 BTC estimated duration is around 1 hours 40 minutes.
  if (amount < MAX_LIMIT_VALUE_DURATION) return "2 hours"
  // For >=1 BTC estimated duration is around 2 hours 10 minutes.
  return "3 hours"
}
