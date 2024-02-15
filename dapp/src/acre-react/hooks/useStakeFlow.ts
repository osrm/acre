import { useCallback, useState } from "react"
import { StakeInitialization, EthereumAddress } from "@acre-btc/sdk"
import { useAcreContext } from "./useAcreContext"

export type UseStakeFlowReturn = {
  initStake: (
    bitcoinRecoveryAddress: string,
    ethereumAddress: string,
    referral: number,
  ) => Promise<void>
  btcAddress?: string
  signMessage: () => Promise<void>
  stake: () => Promise<void>
}

export function useStakeFlow(): UseStakeFlowReturn {
  const { acre, isInitialized } = useAcreContext()

  const [stakeFlow, setStakeFlow] = useState<StakeInitialization | undefined>(
    undefined,
  )
  const [btcAddress, setBtcAddress] = useState<string | undefined>(undefined)

  const initStake = useCallback(
    async (
      bitcoinRecoveryAddress: string,
      ethereumAddress: string,
      referral: number,
    ) => {
      if (!acre || !isInitialized) throw new Error("Acre SDK not defined")

      const initializedStakeFlow = await acre.staking.initializeStake(
        bitcoinRecoveryAddress,
        EthereumAddress.from(ethereumAddress),
        referral,
      )

      const btcDepositAddress = await initializedStakeFlow.getBitcoinAddress()
      // TODO: add loading indicators or we can `@tanstack/react-query` lib for
      // handling requests.
      setStakeFlow(initializedStakeFlow)
      setBtcAddress(btcDepositAddress)
    },
    [isInitialized, acre],
  )

  const signMessage = useCallback(async () => {
    if (!stakeFlow) throw new Error("Initialize stake first")

    await stakeFlow.signMessage()
  }, [stakeFlow])

  const stake = useCallback(async () => {
    if (!stakeFlow) throw new Error("Initialize stake first")

    await stakeFlow.stake()
  }, [stakeFlow])

  return {
    initStake,
    btcAddress,
    signMessage,
    stake,
  }
}
