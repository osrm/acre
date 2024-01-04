import type { HardhatRuntimeEnvironment } from "hardhat/types"
import type { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre
  const { deployer } = await getNamedAccounts()

  const dispatcher = await deployments.get("Dispatcher")

  await deployments.execute(
    "Acre",
    { from: deployer, log: true, waitConfirmations: 1 },
    "updateDispatcher",
    dispatcher.address,
  )
}

export default func

func.tags = ["AcreUpdateDispatcher"]
func.dependencies = ["Acre", "Dispatcher"]