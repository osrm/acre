import { Hex } from "../utils"
import { ChainIdentifier } from "./chain-identifier"
import { DepositorProxy } from "./depositor-proxy"

export { DepositReceipt } from "@keep-network/tbtc-v2.ts"

export type DecodedExtraData = {
  staker: ChainIdentifier
  referral: number
}

/**
 * Interface for communication with the BitcoinDepositor on-chain contract.
 */
export interface BitcoinDepositor extends DepositorProxy {
  /**
   * @returns The chain-specific identifier of this contract.
   */
  getChainIdentifier(): ChainIdentifier

  /**
   * @returns The chain-specific identifier for tBTC vault contract.
   */
  getTbtcVaultChainIdentifier(): Promise<ChainIdentifier>

  /**
   * Encodes staker address and referral as extra data.
   * @param staker The address to which the stBTC shares will be minted.
   * @param referral Data used for referral program.
   */
  encodeExtraData(staker: ChainIdentifier, referral: number): Hex

  /**
   * Decodes staker address and referral from extra data.
   * @param extraData Encoded extra data.
   */
  decodeExtraData(extraData: string): DecodedExtraData
}
