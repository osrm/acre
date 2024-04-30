export type Currency = {
  name: string
  symbol: string
  decimals: number
  desiredDecimals: number
}

export type CurrencyType = "bitcoin" | "ethereum" | "usd" | "stbtc"

export type AmountType = string | number | bigint
