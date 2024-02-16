import {
  EthersContractConfig as _EthersContractConfig,
  EthersContractDeployment,
} from "@keep-network/tbtc-v2.ts/dist/src/lib/ethereum/adapter"
import {
  Contract as EthersContract,
  getAddress,
  Signer,
  VoidSigner,
} from "ethers"
import { EthereumAddress } from "./address"

export { EthersContractDeployment }

/**
 * Use `VoidSigner` from `ethers` if you want to initialize the Ethereum Acre
 * SDK in readonly mode.
 */
export type EthereumSigner = Signer | VoidSigner

/**
 * Represents a config set required to connect an Ethereum contract.
 */
export interface EthersContractConfig
  // We want to omit the `signerOrProvider` because it points to ethers v5. We
  // use ethers v6 in Acre SDK.
  extends Omit<_EthersContractConfig, "signerOrProvider"> {
  signer: EthereumSigner
}

/**
 * Ethers-based contract implementation.
 */
export class EthersContractWrapper<T extends EthersContract> {
  /**
   * Ethers instance of the deployed contract.
   */
  protected readonly instance: T

  /**
   * Number of a block within which the contract was deployed. Value is read
   * from the contract deployment artifact. It can be overwritten by setting a
   * {@link EthersContractConfig.deployedAtBlockNumber} property.
   */
  protected readonly deployedAtBlockNumber: number

  /**
   * Address of this contract instance.
   */
  readonly #address: string

  constructor(
    config: EthersContractConfig,
    deployment: EthersContractDeployment,
  ) {
    const contractAddress = config.address ?? getAddress(deployment.address)
    this.instance = new EthersContract(
      contractAddress,
      `${JSON.stringify(deployment.abi)}`,
      config.signer,
    ) as T

    this.#address = contractAddress

    this.deployedAtBlockNumber =
      config.deployedAtBlockNumber ?? deployment.receipt.blockNumber
  }

  /**
   * Get address of the contract instance.
   * @returns Address of this contract instance.
   */
  getAddress(): EthereumAddress {
    return EthereumAddress.from(this.#address)
  }
}