import { useCallback } from "react"
import { DepositReceipt } from "@acre-btc/sdk"
import { verifyDepositAddress } from "#/utils"
import { BITCOIN_NETWORK } from "#/constants"
import { useCaptureMessage } from "./sentry"

export function useDepositTelemetry() {
  const captureMessage = useCaptureMessage()

  return useCallback(
    async (deposit: DepositReceipt, depositAddress: string) => {
      const { status, response } = await verifyDepositAddress(
        deposit,
        depositAddress,
        BITCOIN_NETWORK,
      )

      const {
        depositor,
        blindingFactor,
        walletPublicKeyHash,
        refundPublicKeyHash,
        refundLocktime,
      } = deposit

      captureMessage(
        `Generated deposit [${depositAddress}]`,
        {
          depositor: depositor.identifierHex,
          blindingFactor: blindingFactor.toString(),
          walletPublicKeyHash: walletPublicKeyHash.toString(),
          refundPublicKeyHash: refundPublicKeyHash.toString(),
          refundLocktime: refundLocktime.toString(),
          verificationStatus: status,
          verificationResponse: response,
        },
        {
          "verification.status": status,
        },
      )
    },
    [captureMessage],
  )
}
