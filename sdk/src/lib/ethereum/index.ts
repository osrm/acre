import { AcreContracts } from "../contracts"
import { EthereumSigner } from "./contract"
import { EthereumTBTCDepositor } from "./tbtc-depositor"
import { EthereumNetwork } from "./network"
import { EthereumStBTC } from "./stbtc"

export * from "./eip712-signer"
export * from "./tbtc-depositor"
export * from "./address"
export { EthereumSigner }

function getEthereumContracts(
  signer: EthereumSigner,
  network: EthereumNetwork,
): AcreContracts {
  const tbtcDepositor = new EthereumTBTCDepositor({ signer }, network)
  const stBTC = new EthereumStBTC({ signer }, network)

  return { tbtcDepositor, stBTC }
}

export { getEthereumContracts, EthereumNetwork }
