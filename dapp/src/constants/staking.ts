import { getDesiredDecimals } from "#/utils/numbers"

// TODO: Read the value from the SDK, once we expose it
export const BITCOIN_MIN_AMOUNT = "100000" // 0.001 BTC

export const BITCOIN_DESIRED_DECIMALS = getDesiredDecimals(
  BITCOIN_MIN_AMOUNT,
  8,
)

export const REFERRAL = import.meta.env.VITE_REFERRAL
