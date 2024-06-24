import { packRevealDepositParameters } from "@keep-network/tbtc-v2.ts"
import { BitcoinDepositor as BitcoinDepositorTypechain } from "@acre-btc/contracts/typechain/contracts/BitcoinDepositor"
import SepoliaBitcoinDepositor from "@acre-btc/contracts/deployments/sepolia/BitcoinDepositor.json"

import {
  ZeroAddress,
  dataSlice,
  getAddress,
  isAddress,
  solidityPacked,
  zeroPadBytes,
  Contract,
} from "ethers"
import {
  ChainIdentifier,
  DecodedExtraData,
  BitcoinDepositor,
  DepositFees,
} from "../contracts"

import { EthereumAddress } from "./address"
import {
  EthersContractConfig,
  EthersContractDeployment,
  EthersContractWrapper,
} from "./contract"
import { Hex, fromSatoshi } from "../utils"
import { EthereumNetwork } from "./network"

type TbtcDepositParameters = {
  depositTreasuryFeeDivisor: bigint
  depositTxMaxFee: bigint
}

type TbtcBridgeMintingParameters = TbtcDepositParameters & {
  optimisticMintingFeeDivisor: bigint
}

type BitcoinDepositorCache = {
  tbtcBridgeMintingParameters: TbtcBridgeMintingParameters | undefined
  depositorFeeDivisor: bigint | undefined
}

/**
 * Ethereum implementation of the BitcoinDepositor.
 */
class EthereumBitcoinDepositor
  // @ts-expect-error TODO: Figure out why type generated by typechain does not
  // satisfy the constraint `Contract`. Error: `Property '[internal]' is missing
  // in type 'BitcoinDepositor' but required in type 'Contract'`.
  extends EthersContractWrapper<BitcoinDepositorTypechain>
  implements BitcoinDepositor
{
  #cache: BitcoinDepositorCache

  #tbtcBridge: TbtcBridge | undefined

  #tbtcVault: TbtcVault | undefined

  constructor(config: EthersContractConfig, network: EthereumNetwork) {
    let artifact: EthersContractDeployment

    switch (network) {
      case "sepolia":
        artifact = SepoliaBitcoinDepositor
        break
      case "mainnet":
      default:
        throw new Error("Unsupported network")
    }

    super(config, artifact)
    this.#cache = {
      tbtcBridgeMintingParameters: undefined,
      depositorFeeDivisor: undefined,
    }
  }

  setTbtcContracts({
    tbtcBridge,
    tbtcVault,
  }: {
    tbtcBridge: TbtcBridge
    tbtcVault: TbtcVault
  }): void {
    this.#tbtcBridge = tbtcBridge
    this.#tbtcVault = tbtcVault
  }

  /**
   * @see {BitcoinDepositor#getChainIdentifier}
   */
  getChainIdentifier(): ChainIdentifier {
    return this.getAddress()
  }

  /**
   * @see {BitcoinDepositor#getTbtcVaultChainIdentifier}
   */
  async getTbtcVaultChainIdentifier(): Promise<ChainIdentifier> {
    const vault = await this.instance.tbtcVault()

    return EthereumAddress.from(vault)
  }

  // eslint-disable-next-line class-methods-use-this
  revealDeposit(): Promise<Hex> {
    throw new Error("Unsupported")
  }

  /**
   * @see {BitcoinDepositor#encodeExtraData}
   * @dev Packs the data to bytes32: 20 bytes of deposit owner address and 2 bytes of
   *      referral, 10 bytes of trailing zeros.
   */
  // eslint-disable-next-line class-methods-use-this
  encodeExtraData(depositOwner: ChainIdentifier, referral: number): Hex {
    const depositOwnerAddress = `0x${depositOwner.identifierHex}`

    if (!isAddress(depositOwnerAddress) || depositOwnerAddress === ZeroAddress)
      throw new Error("Invalid deposit owner address")

    const encodedData = solidityPacked(
      ["address", "uint16"],
      [depositOwnerAddress, referral],
    )

    return Hex.from(zeroPadBytes(encodedData, 32))
  }

  /**
   * @see {BitcoinDepositor#decodeExtraData}
   * @dev Unpacks the data from bytes32: 20 bytes of deposit owner address and 2
   *      bytes of referral, 10 bytes of trailing zeros.
   */
  // eslint-disable-next-line class-methods-use-this
  decodeExtraData(extraData: string): DecodedExtraData {
    const depositOwner = EthereumAddress.from(
      getAddress(dataSlice(extraData, 0, 20)),
    )
    const referral = Number(dataSlice(extraData, 20, 22))

    return { depositOwner, referral }
  }

  /**
   * @see {BitcoinDepositor#minDepositAmount}
   * @dev The value in tBTC token precision (1e18 precision).
   */
  async minDepositAmount(): Promise<bigint> {
    return this.instance.minDepositAmount()
  }

  /**
   * @see {BitcoinDepositor#calculateDepositFee}
   */
  async calculateDepositFee(amountToDeposit: bigint): Promise<DepositFees> {
    const {
      depositTreasuryFeeDivisor,
      depositTxMaxFee,
      optimisticMintingFeeDivisor,
    } = await this.#getTbtcBridgeMintingParameters()

    const treasuryFee =
      depositTreasuryFeeDivisor > 0
        ? amountToDeposit / depositTreasuryFeeDivisor
        : 0n

    const amountSubTreasury = amountToDeposit - treasuryFee

    const optimisticMintingFee =
      optimisticMintingFeeDivisor > 0
        ? amountSubTreasury / optimisticMintingFeeDivisor
        : 0n

    const depositorFeeDivisor = await this.#depositorFeeDivisor()
    // Compute depositor fee. The fee is calculated based on the initial funding
    // transaction amount, before the tBTC protocol network fees were taken.
    const depositorFee =
      depositorFeeDivisor > 0n ? amountToDeposit / depositorFeeDivisor : 0n

    return {
      tbtc: {
        treasuryFee,
        optimisticMintingFee,
        depositTxMaxFee: fromSatoshi(depositTxMaxFee),
      },
      acre: {
        bitcoinDepositorFee: depositorFee,
      },
    }
  }

  // TODO: Consider exposing it from tBTC SDK.
  async #getTbtcBridgeMintingParameters(): Promise<TbtcBridgeMintingParameters> {
    if (this.#cache.tbtcBridgeMintingParameters) {
      return this.#cache.tbtcBridgeMintingParameters
    }

    const bridgeAddress = await this.instance.bridge()
    const bridge = new Contract(
      bridgeAddress,
      [
        "function depositParameters() view returns (uint64 depositDustThreshold, uint64 depositTreasuryFeeDivisor, uint64 depositTxMaxFee, uint32 depositRevealAheadPeriod)",
      ],
      this.instance.runner,
    )
    const { depositTreasuryFeeDivisor, depositTxMaxFee } =
      (await bridge.depositParameters()) as TbtcDepositParameters

    const vaultAddress = await this.getTbtcVaultChainIdentifier()
    const vault = new Contract(
      `0x${vaultAddress.identifierHex}`,
      ["function optimisticMintingFeeDivisor() view returns (uint32)"],
      this.instance.runner,
    )
    const optimisticMintingFeeDivisor =
      (await vault.optimisticMintingFeeDivisor()) as bigint

    this.#cache.tbtcBridgeMintingParameters = {
      depositTreasuryFeeDivisor,
      depositTxMaxFee,
      optimisticMintingFeeDivisor,
    }
    return this.#cache.tbtcBridgeMintingParameters
  }

  async #depositorFeeDivisor(): Promise<bigint> {
    if (this.#cache.depositorFeeDivisor) {
      return this.#cache.depositorFeeDivisor
    }

    this.#cache.depositorFeeDivisor = await this.instance.depositorFeeDivisor()

    return this.#cache.depositorFeeDivisor
  }
}

export { EthereumBitcoinDepositor, packRevealDepositParameters }
