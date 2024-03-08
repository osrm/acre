import type { DeployFunction } from "hardhat-deploy/types"
import type { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, helpers } = hre
  const { deployer } = await helpers.signers.getNamedSigners()

  const bridge = await deployments.get("Bridge")
  const tbtcVault = await deployments.get("TBTCVault")
  const tbtc = await deployments.get("TBTC")
  const stbtc = await deployments.get("stBTC")

  const [, proxyDeployment] = await helpers.upgrades.deployProxy(
    "AcreBitcoinDepositor",
    {
      contractName:
        process.env.HARDHAT_TEST === "true"
          ? "AcreBitcoinDepositorHarness"
          : "AcreBitcoinDepositor",
      factoryOpts: {
        signer: deployer,
      },
      initializerArgs: [
        bridge.address,
        tbtcVault.address,
        tbtc.address,
        stbtc.address,
      ],
    },
  )

  if (hre.network.tags.etherscan) {
    await helpers.etherscan.verify(proxyDeployment)
  }

  // TODO: Add Tenderly verification
}

export default func

func.tags = ["AcreBitcoinDepositor"]
func.dependencies = ["TBTC", "stBTC"]
