import { deployments } from "hardhat"
import { getDeployedContract } from "./contract"

import type {
  StBTC as stBTC,
  Dispatcher,
  TestERC20,
  TbtcDepositorHarness,
  BridgeStub,
  TestERC4626,
  TBTCVaultStub,
} from "../../typechain"

// eslint-disable-next-line import/prefer-default-export
export async function deployment() {
  await deployments.fixture()

  const stbtc: stBTC = await getDeployedContract("stBTC")
  const tbtcDepositor: TbtcDepositorHarness =
    await getDeployedContract("TbtcDepositor")

  const tbtc: TestERC20 = await getDeployedContract("TBTC")
  const tbtcBridge: BridgeStub = await getDeployedContract("Bridge")
  const tbtcVault: TBTCVaultStub = await getDeployedContract("TBTCVault")

  const dispatcher: Dispatcher = await getDeployedContract("Dispatcher")

  const vault: TestERC4626 = await getDeployedContract("Vault")

  return {
    tbtc,
    stbtc,
    tbtcDepositor,
    tbtcBridge,
    tbtcVault,
    dispatcher,
    vault,
  }
}
