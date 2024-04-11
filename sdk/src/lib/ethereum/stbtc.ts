import { StBTC as StBTCTypechain } from "@acre-btc/contracts/typechain/contracts/StBTC"
import stBTC from "@acre-btc/contracts/deployments/sepolia/stBTC.json"

import {
  EthersContractConfig,
  EthersContractDeployment,
  EthersContractWrapper,
} from "./contract"
import { ChainIdentifier, StBTC } from "../contracts"
import { EthereumNetwork } from "./network"

class EthereumStBTC
  // @ts-expect-error TODO: Figure out why type generated by typechain does not
  // satisfy the constraint `Contract`. Error: `Property '[internal]' is missing
  // in type 'StBTC' but required in type 'BaseContract'`.
  extends EthersContractWrapper<StBTCTypechain>
  implements StBTC
{
  constructor(config: EthersContractConfig, network: EthereumNetwork) {
    let artifact: EthersContractDeployment

    switch (network) {
      case "sepolia":
        artifact = stBTC
        break
      case "mainnet":
      default:
        throw new Error("Unsupported network")
    }

    super(config, artifact)
  }

  /**
   * @see {StBTC#balanceOf}
   */
  balanceOf(identifier: ChainIdentifier): Promise<bigint> {
    return this.instance.balanceOf(`0x${identifier.identifierHex}`)
  }

  /**
   * @see {StBTC#assetsBalanceOf}
   */
  assetsBalanceOf(identifier: ChainIdentifier): Promise<bigint> {
    return this.instance.assetsBalanceOf(`0x${identifier.identifierHex}`)
  }
}

// eslint-disable-next-line import/prefer-default-export
export { EthereumStBTC }
