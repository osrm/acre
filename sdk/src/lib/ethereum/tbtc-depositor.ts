import {
  DepositReceipt,
  packRevealDepositParameters as tbtcPackRevealDepositParameters,
} from "@keep-network/tbtc-v2.ts"
import { AcreBitcoinDepositor as AcreBitcoinDepositorTypechain } from "@acre-btc/core/typechain/contracts/AcreBitcoinDepositor"
import {
  ZeroAddress,
  dataSlice,
  getAddress,
  isAddress,
  solidityPacked,
  zeroPadBytes,
} from "ethers"
import { ChainIdentifier, DecodedExtraData, TBTCDepositor } from "../contracts"
import { BitcoinRawTxVectors } from "../bitcoin"
import { EthereumAddress } from "./address"
import {
  EthersContractConfig,
  EthersContractDeployment,
  EthersContractWrapper,
} from "./contract"
import { Hex } from "../utils"
import { EthereumNetwork } from "./network"

import SepoliaTbtcDepositor from "./artifacts/sepolia/TbtcDepositor.json"

// TODO: Rename TBTCDepositor to AcreBitcoinDepositor

/**
 * Ethereum implementation of the TBTCDepositor.
 */
class EthereumTBTCDepositor
  // @ts-expect-error TODO: Figure out why type generated by typechain does not
  // satisfy the constraint `Contract`. Error: `Property '[internal]' is missing
  // in type 'AcreBitcoinDepositor' but required in type 'Contract'`.
  extends EthersContractWrapper<AcreBitcoinDepositorTypechain>
  implements TBTCDepositor
{
  constructor(config: EthersContractConfig, network: EthereumNetwork) {
    let artifact: EthersContractDeployment

    switch (network) {
      case "sepolia":
        artifact = SepoliaTbtcDepositor
        break
      case "mainnet":
      default:
        throw new Error("Unsupported network")
    }

    super(config, artifact)
  }

  /**
   * @see {TBTCDepositor#getChainIdentifier}
   */
  getChainIdentifier(): ChainIdentifier {
    return this.getAddress()
  }

  /**
   * @see {TBTCDepositor#getTbtcVaultChainIdentifier}
   */
  async getTbtcVaultChainIdentifier(): Promise<ChainIdentifier> {
    const vault = await this.instance.tbtcVault()

    return EthereumAddress.from(vault)
  }

  /**
   * @see {TBTCDepositor#revealDeposit}
   */
  async revealDeposit(
    depositTx: BitcoinRawTxVectors,
    depositOutputIndex: number,
    deposit: DepositReceipt,
  ): Promise<Hex> {
    const { fundingTx, reveal, extraData } = tbtcPackRevealDepositParameters(
      depositTx,
      depositOutputIndex,
      deposit,
      await this.getTbtcVaultChainIdentifier(),
    )

    if (!extraData) throw new Error("Invalid extra data")

    const { staker, referral } = this.decodeExtraData(extraData)

    const tx = await this.instance.initializeStakeRequest(
      fundingTx,
      reveal,
      `0x${staker.identifierHex}`,
      referral,
    )

    return Hex.from(tx.hash)
  }

  /**
   * @see {TBTCDepositor#encodeExtraData}
   * @dev Packs the data to bytes32: 20 bytes of staker address and 2 bytes of
   *      referral, 10 bytes of trailing zeros.
   */
  // eslint-disable-next-line class-methods-use-this
  encodeExtraData(staker: ChainIdentifier, referral: number): Hex {
    const stakerAddress = `0x${staker.identifierHex}`

    if (!isAddress(stakerAddress) || stakerAddress === ZeroAddress)
      throw new Error("Invalid staker address")

    const encodedData = solidityPacked(
      ["address", "uint16"],
      [stakerAddress, referral],
    )

    return Hex.from(zeroPadBytes(encodedData, 32))
  }

  /**
   * @see {TBTCDepositor#decodeExtraData}
   * @dev Unpacks the data from bytes32: 20 bytes of staker address and 2
   *      bytes of referral, 10 bytes of trailing zeros.
   */
  // eslint-disable-next-line class-methods-use-this
  decodeExtraData(extraData: string): DecodedExtraData {
    const staker = EthereumAddress.from(getAddress(dataSlice(extraData, 0, 20)))
    const referral = Number(dataSlice(extraData, 20, 22))

    return { staker, referral }
  }
}

// eslint-disable-next-line import/prefer-default-export
export { EthereumTBTCDepositor }
