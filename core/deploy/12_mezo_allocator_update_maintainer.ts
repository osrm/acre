import type { HardhatRuntimeEnvironment } from "hardhat/types"
import type { DeployFunction } from "hardhat-deploy/types"
import { waitConfirmationsNumber } from "../helpers/deployment"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre
  const { deployer, maintainer } = await getNamedAccounts()

  await deployments.execute(
    "MezoAllocator",
    {
      from: deployer,
      log: true,
      waitConfirmations: waitConfirmationsNumber(hre),
    },
    "addMaintainer",
    maintainer,
  )
}

export default func

func.dependencies = ["MezoAllocator"]
func.tags = ["MezoAllocatorAddMaintainer"]
