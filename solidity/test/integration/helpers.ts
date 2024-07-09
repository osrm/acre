import { helpers } from "hardhat"

import { deployment } from "../helpers"

export async function integrationTestFixture() {
  const contracts = await deployment()

  const { deployer } = await helpers.signers.getNamedSigners()

  const governance = await helpers.account.impersonateAccount(
    expectedMainnetAddresses.governance,
    {
      from: deployer,
      value: 10n,
    },
  )

  const maintainer = await helpers.account.impersonateAccount(
    expectedMainnetAddresses.maintainer,
    {
      from: deployer,
      value: 10n,
    },
  )

  await contracts.stbtc.connect(governance).acceptOwnership()
  await contracts.mezoAllocator.connect(governance).acceptOwnership()
  await contracts.bitcoinDepositor.connect(governance).acceptOwnership()
  await contracts.bitcoinRedeemer.connect(governance).acceptOwnership()

  return {
    governance,
    maintainer,
    ...contracts,
  }
}

export const expectedMainnetAddresses = {
  // Signers
  treasury: "0xb0d97781D70A8ebD0cd8bFbE79AbC5545B829fc5",
  governance: "0x790Dda4c56b3c45d0e4514eDbAaBa30D7129c857",
  pauseAdmin: "0x1299C7432034d1B85e148a2033d571a9B578292B",
  maintainer: "0x373C177845cEfaB4Ed85666b99c9fDB40ae7Cd19",

  // Contracts
  mezoPortal: "0xAB13B8eecf5AA2460841d75da5d5D861fD5B8A39",
  tbtc: "0x18084fbA666a33d37592fA2633fD49a74DD93a88",
  bridge: "0x5e4861a80B55f035D899f66772117F00FA0E8e7B",
  tbtcVault: "0x9C070027cdC9dc8F82416B2e5314E11DFb4FE3CD",
}
