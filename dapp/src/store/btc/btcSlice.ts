import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { DepositFee } from "#/types"
import { fetchBTCPriceUSD } from "./btcThunk"

type BtcState = {
  estimatedBtcBalance: bigint
  sharesBalance: bigint
  isLoadingPriceUSD: boolean
  usdPrice: number
  minDepositAmount: bigint
  estimatedDepositFee?: DepositFee
}

const initialState: BtcState = {
  estimatedBtcBalance: 0n,
  sharesBalance: 0n,
  isLoadingPriceUSD: false,
  usdPrice: 0,
  minDepositAmount: 0n,
}

// Store Bitcoin data such as balance, balance in usd and other related data to Bitcoin chain.
export const btcSlice = createSlice({
  name: "btc",
  initialState,
  reducers: {
    setSharesBalance(state, action: PayloadAction<bigint>) {
      state.sharesBalance = action.payload
    },
    setEstimatedBtcBalance(state, action: PayloadAction<bigint>) {
      state.estimatedBtcBalance = action.payload
    },
    setEstimatedDepositFee(state, action: PayloadAction<DepositFee>) {
      state.estimatedDepositFee = action.payload
    },
    setMinDepositAmount(state, action: PayloadAction<bigint>) {
      state.minDepositAmount = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBTCPriceUSD.pending, (state) => {
      state.isLoadingPriceUSD = true
    })
    builder.addCase(fetchBTCPriceUSD.rejected, (state) => {
      state.isLoadingPriceUSD = false
    })
    builder.addCase(
      fetchBTCPriceUSD.fulfilled,
      (state, action: PayloadAction<number>) => {
        state.isLoadingPriceUSD = false
        state.usdPrice = action.payload
      },
    )
  },
})

export const {
  setSharesBalance,
  setEstimatedBtcBalance,
  setEstimatedDepositFee,
  setMinDepositAmount,
} = btcSlice.actions
