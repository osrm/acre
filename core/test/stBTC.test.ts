import {
  takeSnapshot,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import {
  ContractTransactionResponse,
  MaxUint256,
  ZeroAddress,
  encodeBytes32String,
} from "ethers"
import { ethers } from "hardhat"

import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import type { SnapshotRestorer } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import {
  beforeAfterEachSnapshotWrapper,
  beforeAfterSnapshotWrapper,
  deployment,
  getNamedSigner,
  getUnnamedSigner,
} from "./helpers"

import { to1e18 } from "./utils"

import type { StBTC as stBTC, TestERC20, Dispatcher } from "../typechain"

async function fixture() {
  const { tbtc, stbtc, dispatcher } = await deployment()
  const { governance } = await getNamedSigner()

  const [staker1, staker2, thirdParty] = await getUnnamedSigner()

  const amountToMint = to1e18(100000)
  await tbtc.mint(staker1, amountToMint)
  await tbtc.mint(staker2, amountToMint)

  return { stbtc, tbtc, staker1, staker2, dispatcher, governance, thirdParty }
}

describe("stBTC", () => {
  const referral = encodeBytes32String("referral")

  let stbtc: stBTC
  let tbtc: TestERC20
  let dispatcher: Dispatcher

  let governance: HardhatEthersSigner
  let staker1: HardhatEthersSigner
  let staker2: HardhatEthersSigner
  let thirdParty: HardhatEthersSigner

  before(async () => {
    ;({ stbtc, tbtc, staker1, staker2, dispatcher, governance, thirdParty } =
      await loadFixture(fixture))
  })

  describe("stake", () => {
    context("when staking as first staker", () => {
      beforeAfterEachSnapshotWrapper()

      context("with a referral", () => {
        const amountToStake = to1e18(1)

        // In this test case, there is only one staker and the token vault has
        // not earned anything yet so received shares are equal to staked tokens
        // amount.
        const expectedReceivedShares = amountToStake

        let tx: ContractTransactionResponse
        let tbtcHolder: HardhatEthersSigner
        let receiver: HardhatEthersSigner

        beforeEach(async () => {
          tbtcHolder = staker1
          receiver = staker2

          await tbtc
            .connect(tbtcHolder)
            .approve(await stbtc.getAddress(), amountToStake)

          tx = await stbtc
            .connect(tbtcHolder)
            .stake(amountToStake, receiver.address, referral)
        })

        it("should emit Deposit event", async () => {
          await expect(tx).to.emit(stbtc, "Deposit").withArgs(
            // Caller.
            tbtcHolder.address,
            // Receiver.
            receiver.address,
            // Staked tokens.
            amountToStake,
            // Received shares.
            expectedReceivedShares,
          )
        })

        it("should emit StakeReferral event", async () => {
          await expect(tx)
            .to.emit(stbtc, "StakeReferral")
            .withArgs(referral, amountToStake)
        })

        it("should mint stBTC tokens", async () => {
          await expect(tx).to.changeTokenBalances(
            stbtc,
            [receiver.address],
            [expectedReceivedShares],
          )
        })

        it("should transfer tBTC tokens", async () => {
          await expect(tx).to.changeTokenBalances(
            tbtc,
            [tbtcHolder.address, stbtc],
            [-amountToStake, amountToStake],
          )
        })
      })

      context("without referral", () => {
        const amountToStake = to1e18(10)
        const emptyReferral = encodeBytes32String("")
        let tx: ContractTransactionResponse

        beforeEach(async () => {
          await tbtc
            .connect(staker1)
            .approve(await stbtc.getAddress(), amountToStake)

          tx = await stbtc
            .connect(staker1)
            .stake(amountToStake, staker1.address, emptyReferral)
        })

        it("should not emit the StakeReferral event", async () => {
          await expect(tx).to.not.emit(stbtc, "StakeReferral")
        })
      })

      context(
        "when amount to stake is greater than the approved amount",
        () => {
          const approvedAmount = to1e18(10)
          const amountToStake = approvedAmount + 1n

          beforeEach(async () => {
            await tbtc
              .connect(staker1)
              .approve(await stbtc.getAddress(), approvedAmount)
          })

          it("should revert", async () => {
            await expect(
              stbtc
                .connect(staker1)
                .stake(amountToStake, staker1.address, referral),
            )
              .to.be.revertedWithCustomError(tbtc, "ERC20InsufficientAllowance")
              .withArgs(await stbtc.getAddress(), approvedAmount, amountToStake)
          })
        },
      )

      context("when amount to stake is less than minimum", () => {
        let amountToStake: bigint
        let minimumDepositAmount: bigint

        beforeEach(async () => {
          minimumDepositAmount = await stbtc.minimumDepositAmount()
          amountToStake = minimumDepositAmount - 1n

          await tbtc
            .connect(staker1)
            .approve(await stbtc.getAddress(), amountToStake)
        })

        it("should revert", async () => {
          await expect(
            stbtc
              .connect(staker1)
              .stake(amountToStake, staker1.address, referral),
          )
            .to.revertedWithCustomError(stbtc, "DepositAmountLessThanMin")
            .withArgs(amountToStake, minimumDepositAmount)
        })
      })

      context("when amount to stake is equal to the minimum amount", () => {
        let amountToStake: bigint
        let tx: ContractTransactionResponse

        beforeEach(async () => {
          const minimumDepositAmount = await stbtc.minimumDepositAmount()
          amountToStake = minimumDepositAmount

          await tbtc
            .connect(staker1)
            .approve(await stbtc.getAddress(), amountToStake)

          tx = await stbtc
            .connect(staker1)
            .stake(amountToStake, staker1.address, referral)
        })

        it("should receive shares equal to the staked amount", async () => {
          await expect(tx).to.changeTokenBalances(
            stbtc,
            [staker1.address],
            [amountToStake],
          )
        })
      })

      context("when the receiver is zero address", () => {
        const amountToStake = to1e18(10)

        beforeEach(async () => {
          await tbtc
            .connect(staker1)
            .approve(await stbtc.getAddress(), amountToStake)
        })

        it("should revert", async () => {
          await expect(
            stbtc.connect(staker1).stake(amountToStake, ZeroAddress, referral),
          )
            .to.be.revertedWithCustomError(stbtc, "ERC20InvalidReceiver")
            .withArgs(ZeroAddress)
        })
      })

      context(
        "when a staker approved and staked tokens and wants to stake more but w/o another approval",
        () => {
          const amountToStake = to1e18(10)

          beforeEach(async () => {
            await tbtc
              .connect(staker1)
              .approve(await stbtc.getAddress(), amountToStake)

            await stbtc
              .connect(staker1)
              .stake(amountToStake, staker1.address, referral)
          })

          it("should revert", async () => {
            await expect(
              stbtc
                .connect(staker1)
                .stake(amountToStake, staker1.address, referral),
            )
              .to.be.revertedWithCustomError(
                stbtc,
                "ERC20InsufficientAllowance",
              )
              .withArgs(await stbtc.getAddress(), 0, amountToStake)
          })
        },
      )
    })

    describe("when staking by multiple stakers", () => {
      beforeAfterSnapshotWrapper()

      const staker1AmountToStake = to1e18(7)
      const staker2AmountToStake = to1e18(3)
      const earnedYield = to1e18(5)

      let afterStakesSnapshot: SnapshotRestorer
      let afterSimulatingYieldSnapshot: SnapshotRestorer

      before(async () => {
        // Mint tBTC.
        await tbtc.mint(staker1.address, staker1AmountToStake)
        await tbtc.mint(staker2.address, staker2AmountToStake)

        // Approve tBTC.
        await tbtc
          .connect(staker1)
          .approve(await stbtc.getAddress(), staker1AmountToStake)
        await tbtc
          .connect(staker2)
          .approve(await stbtc.getAddress(), staker2AmountToStake)
      })

      context("when the vault is in initial state", () => {
        describe("when two stakers stake", () => {
          let stakeTx1: ContractTransactionResponse
          let stakeTx2: ContractTransactionResponse

          before(async () => {
            stakeTx1 = await stbtc
              .connect(staker1)
              .stake(staker1AmountToStake, staker1.address, referral)

            stakeTx2 = await stbtc
              .connect(staker2)
              .stake(staker2AmountToStake, staker2.address, referral)

            afterStakesSnapshot = await takeSnapshot()
          })

          it("staker A should receive shares equal to a staked amount", async () => {
            await expect(stakeTx1).to.changeTokenBalances(
              stbtc,
              [staker1.address],
              [staker1AmountToStake],
            )
          })

          it("staker B should receive shares equal to a staked amount", async () => {
            await expect(stakeTx2).to.changeTokenBalances(
              stbtc,
              [staker2.address],
              [staker2AmountToStake],
            )
          })

          it("the total assets amount should be equal to all staked tokens", async () => {
            expect(await stbtc.totalAssets()).to.eq(
              staker1AmountToStake + staker2AmountToStake,
            )
          })
        })
      })

      context("when vault has two stakers", () => {
        context("when vault earns yield", () => {
          let staker1SharesBefore: bigint
          let staker2SharesBefore: bigint

          before(async () => {
            // Current state:
            // Staker A shares = 7
            // Staker B shares = 3
            // Total assets = 7(staker A) + 3(staker B) + 5(yield)
            await afterStakesSnapshot.restore()

            staker1SharesBefore = await stbtc.balanceOf(staker1.address)
            staker2SharesBefore = await stbtc.balanceOf(staker2.address)

            // Simulating yield returned from strategies. The vault now contains
            // more tokens than deposited which causes the exchange rate to
            // change.
            await tbtc.mint(await stbtc.getAddress(), earnedYield)
          })

          after(async () => {
            afterSimulatingYieldSnapshot = await takeSnapshot()
          })

          it("the vault should hold more assets", async () => {
            expect(await stbtc.totalAssets()).to.be.eq(
              staker1AmountToStake + staker2AmountToStake + earnedYield,
            )
          })

          it("the stakers shares should be the same", async () => {
            expect(await stbtc.balanceOf(staker1.address)).to.be.eq(
              staker1SharesBefore,
            )
            expect(await stbtc.balanceOf(staker2.address)).to.be.eq(
              staker2SharesBefore,
            )
          })

          it("the staker A should be able to redeem more tokens than before", async () => {
            const shares = await stbtc.balanceOf(staker1.address)
            const availableAssetsToRedeem = await stbtc.previewRedeem(shares)

            // Expected amount w/o rounding: 7 * 15 / 10 = 10.5
            // Expected amount w/ support for rounding: 10499999999999999999 in
            // tBTC token precision.
            const expectedAssetsToRedeem = 10499999999999999999n

            expect(availableAssetsToRedeem).to.be.eq(expectedAssetsToRedeem)
          })

          it("the staker B should be able to redeem more tokens than before", async () => {
            const shares = await stbtc.balanceOf(staker2.address)
            const availableAssetsToRedeem = await stbtc.previewRedeem(shares)

            // Expected amount w/o rounding: 3 * 15 / 10 = 4.5
            // Expected amount w/ support for rounding: 4499999999999999999 in
            // tBTC token precision.
            const expectedAssetsToRedeem = 4499999999999999999n

            expect(availableAssetsToRedeem).to.be.eq(expectedAssetsToRedeem)
          })
        })

        context("when staker A stakes more tokens", () => {
          context(
            "when total tBTC amount after staking would not exceed max amount",
            () => {
              const newAmountToStake = to1e18(2)
              // Current state:
              //   Total assets = 7(staker A) + 3(staker B) + 5(yield)
              //   Total shares = 7 + 3 = 10
              // New stake amount = 2
              // Shares to mint = 2 * 10 / 15 = 1.(3) -> 1333333333333333333 in stBTC
              // token precision
              const expectedSharesToMint = 1333333333333333333n
              let sharesBefore: bigint
              let availableToRedeemBefore: bigint

              before(async () => {
                await afterSimulatingYieldSnapshot.restore()

                sharesBefore = await stbtc.balanceOf(staker1.address)
                availableToRedeemBefore =
                  await stbtc.previewRedeem(sharesBefore)

                await tbtc.mint(staker1.address, newAmountToStake)

                await tbtc
                  .connect(staker1)
                  .approve(await stbtc.getAddress(), newAmountToStake)

                // State after stake:
                // Total assets = 7(staker A) + 3(staker B) + 5(yield) + 2(staker
                // A) = 17
                // Total shares = 7 + 3 + 1.(3) = 11.(3)
                await stbtc
                  .connect(staker1)
                  .stake(newAmountToStake, staker1.address, referral)
              })

              it("should receive more shares", async () => {
                const shares = await stbtc.balanceOf(staker1.address)

                expect(shares).to.be.eq(sharesBefore + expectedSharesToMint)
              })

              it("should be able to redeem more tokens than before", async () => {
                const shares = await stbtc.balanceOf(staker1.address)
                const availableToRedeem = await stbtc.previewRedeem(shares)

                // Expected amount w/o rounding: 8.(3) * 17 / 11.(3) = 12.5
                // Expected amount w/ support for rounding: 12499999999999999999 in
                // tBTC token precision.
                const expectedTotalAssetsAvailableToRedeem =
                  12499999999999999999n

                expect(availableToRedeem).to.be.greaterThan(
                  availableToRedeemBefore,
                )
                expect(availableToRedeem).to.be.eq(
                  expectedTotalAssetsAvailableToRedeem,
                )
              })
            },
          )

          context(
            "when total tBTC amount after staking would exceed max amount",
            () => {
              let possibleMaxAmountToStake: bigint
              let amountToStake: bigint

              before(async () => {
                await afterSimulatingYieldSnapshot.restore()

                // In the current implementation of the `maxDeposit` the
                // `address` param is not taken into account - it means it will
                // return the same value for any address.
                possibleMaxAmountToStake = await stbtc.maxDeposit(
                  staker1.address,
                )
                amountToStake = possibleMaxAmountToStake + 1n

                await tbtc
                  .connect(staker1)
                  .approve(await stbtc.getAddress(), amountToStake)
              })

              it("should revert", async () => {
                await expect(
                  stbtc.stake(amountToStake, staker1.address, referral),
                )
                  .to.be.revertedWithCustomError(
                    stbtc,
                    "ERC4626ExceededMaxDeposit",
                  )
                  .withArgs(
                    staker1.address,
                    amountToStake,
                    possibleMaxAmountToStake,
                  )
              })
            },
          )

          context(
            "when total tBTC amount after staking would be equal to the max amount",
            () => {
              let amountToStake: bigint
              let tx: ContractTransactionResponse

              before(async () => {
                amountToStake = await stbtc.maxDeposit(staker1.address)

                await tbtc
                  .connect(staker1)
                  .approve(await stbtc.getAddress(), amountToStake)

                tx = await stbtc.stake(amountToStake, staker1, referral)
              })

              it("should stake tokens correctly", async () => {
                await expect(tx).to.emit(stbtc, "Deposit")
              })

              it("the max deposit amount should be equal 0", async () => {
                expect(await stbtc.maxDeposit(staker1)).to.eq(0)
              })

              it("should not be able to stake more tokens", async () => {
                await expect(stbtc.stake(amountToStake, staker1, referral))
                  .to.be.revertedWithCustomError(
                    stbtc,
                    "ERC4626ExceededMaxDeposit",
                  )
                  .withArgs(staker1.address, amountToStake, 0)
              })
            },
          )
        })
      })
    })
  })

  describe("mint", () => {
    beforeAfterEachSnapshotWrapper()

    context("when minting as first staker", () => {
      const amountToStake = to1e18(1)
      let tx: ContractTransactionResponse
      let sharesToMint: bigint

      beforeEach(async () => {
        sharesToMint = amountToStake

        await tbtc
          .connect(staker1)
          .approve(await stbtc.getAddress(), amountToStake)

        tx = await stbtc.connect(staker1).mint(sharesToMint, staker1.address)
      })

      it("should emit Deposit event", async () => {
        await expect(tx).to.emit(stbtc, "Deposit").withArgs(
          // Caller.
          staker1.address,
          // Receiver.
          staker1.address,
          // Staked tokens.
          amountToStake,
          // Received shares.
          sharesToMint,
        )
      })

      it("should mint stBTC tokens", async () => {
        await expect(tx).to.changeTokenBalances(
          stbtc,
          [staker1.address],
          [sharesToMint],
        )
      })

      it("should transfer tBTC tokens", async () => {
        await expect(tx).to.changeTokenBalances(
          tbtc,
          [staker1.address, stbtc],
          [-amountToStake, amountToStake],
        )
      })
    })

    context("when staker wants to mint more shares than max mint limit", () => {
      let sharesToMint: bigint
      let maxMint: bigint

      beforeEach(async () => {
        maxMint = await stbtc.maxMint(staker1.address)

        sharesToMint = maxMint + 1n
      })

      it("should take into account the max total assets parameter and revert", async () => {
        await expect(stbtc.connect(staker1).mint(sharesToMint, staker1.address))
          .to.be.revertedWithCustomError(stbtc, "ERC4626ExceededMaxMint")
          .withArgs(staker1.address, sharesToMint, maxMint)
      })
    })

    context(
      "when staker wants to mint less shares than the min deposit amount",
      () => {
        let sharesToMint: bigint
        let minimumDepositAmount: bigint

        beforeEach(async () => {
          minimumDepositAmount = await stbtc.minimumDepositAmount()
          const shares = await stbtc.convertToShares(minimumDepositAmount)

          sharesToMint = shares - 1n
          await tbtc
            .connect(staker1)
            .approve(await stbtc.getAddress(), minimumDepositAmount)
        })

        it("should take into account the min deposit amount parameter and revert", async () => {
          // In this test case, there is only one staker and the token vault has
          // not earned anything yet so received shares are equal to staked
          // tokens amount.
          const depositAmount = sharesToMint

          await expect(
            stbtc.connect(staker1).mint(sharesToMint, staker1.address),
          )
            .to.be.revertedWithCustomError(stbtc, "DepositAmountLessThanMin")
            .withArgs(depositAmount, minimumDepositAmount)
        })
      },
    )
  })

  describe("updateDepositParameters", () => {
    beforeAfterEachSnapshotWrapper()

    const validMinimumDepositAmount = to1e18(1)
    const validMaximumTotalAssetsAmount = to1e18(30)

    context("when is called by governance", () => {
      context("when all parameters are valid", () => {
        let tx: ContractTransactionResponse

        beforeEach(async () => {
          tx = await stbtc
            .connect(governance)
            .updateDepositParameters(
              validMinimumDepositAmount,
              validMaximumTotalAssetsAmount,
            )
        })

        it("should emit DepositParametersUpdated event", async () => {
          await expect(tx)
            .to.emit(stbtc, "DepositParametersUpdated")
            .withArgs(validMinimumDepositAmount, validMaximumTotalAssetsAmount)
        })

        it("should update parameters correctly", async () => {
          const [minimumDepositAmount, maximumTotalAssets] =
            await stbtc.depositParameters()

          expect(minimumDepositAmount).to.be.eq(validMinimumDepositAmount)
          expect(maximumTotalAssets).to.be.eq(validMaximumTotalAssetsAmount)
        })
      })

      context("when minimum deposit amount is 0", () => {
        const newMinimumDepositAmount = 0

        beforeEach(async () => {
          await stbtc
            .connect(governance)
            .updateDepositParameters(
              newMinimumDepositAmount,
              validMaximumTotalAssetsAmount,
            )
        })

        it("should update the minimum deposit amount correctly", async () => {
          const minimumDepositAmount = await stbtc.minimumDepositAmount()

          expect(minimumDepositAmount).to.be.eq(newMinimumDepositAmount)
        })
      })

      context("when the maximum total assets amount is 0", () => {
        const newMaximumTotalAssets = 0

        beforeEach(async () => {
          await stbtc
            .connect(governance)
            .updateDepositParameters(
              validMinimumDepositAmount,
              newMaximumTotalAssets,
            )
        })

        it("should update parameter correctly", async () => {
          expect(await stbtc.maximumTotalAssets()).to.be.eq(0)
        })
      })
    })

    context("when it is called by non-governance", () => {
      it("should revert", async () => {
        await expect(
          stbtc
            .connect(staker1)
            .updateDepositParameters(
              validMinimumDepositAmount,
              validMaximumTotalAssetsAmount,
            ),
        )
          .to.be.revertedWithCustomError(stbtc, "OwnableUnauthorizedAccount")
          .withArgs(staker1.address)
      })
    })
  })

  describe("maxDeposit", () => {
    beforeAfterEachSnapshotWrapper()

    let maximumTotalAssets: bigint
    let minimumDepositAmount: bigint

    beforeEach(async () => {
      ;[minimumDepositAmount, maximumTotalAssets] =
        await stbtc.depositParameters()
    })

    context(
      "when total assets is greater than maximum total assets amount",
      () => {
        beforeEach(async () => {
          const toMint = maximumTotalAssets + 1n

          await tbtc.mint(await stbtc.getAddress(), toMint)
        })

        it("should return 0", async () => {
          expect(await stbtc.maxDeposit(staker1.address)).to.be.eq(0)
        })
      },
    )

    context("when the vault is empty", () => {
      it("should return maximum total assets amount", async () => {
        expect(await stbtc.maxDeposit(staker1.address)).to.be.eq(
          maximumTotalAssets,
        )
      })
    })

    context("when the maximum total amount has not yet been reached", () => {
      let expectedValue: bigint

      beforeEach(async () => {
        const toMint = to1e18(2)
        expectedValue = maximumTotalAssets - toMint

        await tbtc.mint(await stbtc.getAddress(), toMint)
      })

      it("should return correct value", async () => {
        expect(await stbtc.maxDeposit(staker1.address)).to.be.eq(expectedValue)
      })
    })

    context("when the deposit limit is disabled", () => {
      const maximum = MaxUint256

      beforeEach(async () => {
        await stbtc
          .connect(governance)
          .updateDepositParameters(minimumDepositAmount, maximum)
      })

      context("when the vault is empty", () => {
        it("should return the maximum value", async () => {
          expect(await stbtc.maxDeposit(staker1.address)).to.be.eq(maximum)
        })
      })

      context("when the vault is not empty", () => {
        const amountToStake = to1e18(1)

        beforeEach(async () => {
          await tbtc
            .connect(staker1)
            .approve(await stbtc.getAddress(), amountToStake)

          await stbtc
            .connect(staker1)
            .stake(amountToStake, staker1.address, referral)
        })

        it("should return the maximum value", async () => {
          expect(await stbtc.maxDeposit(staker1.address)).to.be.eq(maximum)
        })
      })
    })
  })

  describe("updateDispatcher", () => {
    let snapshot: SnapshotRestorer

    before(async () => {
      snapshot = await takeSnapshot()
    })

    after(async () => {
      await snapshot.restore()
    })

    context("when caller is not governance", () => {
      it("should revert", async () => {
        await expect(stbtc.connect(thirdParty).updateDispatcher(ZeroAddress))
          .to.be.revertedWithCustomError(stbtc, "OwnableUnauthorizedAccount")
          .withArgs(thirdParty.address)
      })
    })

    context("when caller is governance", () => {
      context("when a new dispatcher is zero address", () => {
        it("should revert", async () => {
          await expect(
            stbtc.connect(governance).updateDispatcher(ZeroAddress),
          ).to.be.revertedWithCustomError(stbtc, "ZeroAddress")
        })
      })

      context("when a new dispatcher is non-zero address", () => {
        let newDispatcher: string
        let stbtcAddress: string
        let dispatcherAddress: string
        let tx: ContractTransactionResponse

        before(async () => {
          // Dispatcher is set by the deployment scripts. See deployment tests
          // where initial parameters are checked.
          dispatcherAddress = await dispatcher.getAddress()
          newDispatcher = await ethers.Wallet.createRandom().getAddress()
          stbtcAddress = await stbtc.getAddress()

          tx = await stbtc.connect(governance).updateDispatcher(newDispatcher)
        })

        it("should update the dispatcher", async () => {
          expect(await stbtc.dispatcher()).to.be.equal(newDispatcher)
        })

        it("should reset approval amount for the old dispatcher", async () => {
          const allowance = await tbtc.allowance(
            stbtcAddress,
            dispatcherAddress,
          )
          expect(allowance).to.be.equal(0)
        })

        it("should approve max amount for the new dispatcher", async () => {
          const allowance = await tbtc.allowance(stbtcAddress, newDispatcher)
          expect(allowance).to.be.equal(MaxUint256)
        })

        it("should emit DispatcherUpdated event", async () => {
          await expect(tx)
            .to.emit(stbtc, "DispatcherUpdated")
            .withArgs(dispatcherAddress, newDispatcher)
        })
      })
    })
  })

  describe("maxMint", () => {
    beforeAfterEachSnapshotWrapper()

    let maximumTotalAssets: bigint
    let minimumDepositAmount: bigint

    beforeEach(async () => {
      ;[minimumDepositAmount, maximumTotalAssets] =
        await stbtc.depositParameters()
    })

    context(
      "when total assets is greater than maximum total assets amount",
      () => {
        beforeEach(async () => {
          const toMint = maximumTotalAssets + 1n

          await tbtc.mint(await stbtc.getAddress(), toMint)
        })

        it("should return 0", async () => {
          expect(await stbtc.maxMint(staker1.address)).to.be.eq(0)
        })
      },
    )

    context("when the vault is empty", () => {
      it("should return maximum total assets amount in shares", async () => {
        // When the vault is empty the max shares amount is equal to the maximum
        // total assets amount.
        expect(await stbtc.maxMint(staker1.address)).to.be.eq(
          maximumTotalAssets,
        )
      })
    })

    context("when the maximum total amount has not yet been reached", () => {
      let expectedValue: bigint

      beforeEach(async () => {
        const toMint = to1e18(2)
        const amountToStake = to1e18(3)

        // Staker stakes 3 tBTC.
        await tbtc
          .connect(staker1)
          .approve(await stbtc.getAddress(), amountToStake)
        await stbtc.connect(staker1).deposit(amountToStake, staker1.address)

        // Vault earns 2 tBTC.
        await tbtc.mint(await stbtc.getAddress(), toMint)

        // The current state is:
        // Total assets: 5
        // Total supply: 3
        // Maximum total assets: 30
        // Current max deposit: 25 - 2 - 3 = 20
        // Max shares: 20 * 3 / 5 = 15 -> 12000000000000000001 in stBTC
        // precision and rounding support.
        expectedValue = 12000000000000000001n
      })

      it("should return correct value", async () => {
        expect(await stbtc.maxMint(staker1.address)).to.be.eq(expectedValue)
      })
    })

    context("when the deposit limit is disabled", () => {
      const maximum = MaxUint256

      beforeEach(async () => {
        await stbtc
          .connect(governance)
          .updateDepositParameters(minimumDepositAmount, maximum)
      })

      context("when the vault is empty", () => {
        it("should return the maximum value", async () => {
          expect(await stbtc.maxMint(staker1.address)).to.be.eq(maximum)
        })
      })

      context("when the vault is not empty", () => {
        const amountToStake = to1e18(1)

        beforeEach(async () => {
          await tbtc
            .connect(staker1)
            .approve(await stbtc.getAddress(), amountToStake)

          await stbtc
            .connect(staker1)
            .stake(amountToStake, staker1.address, referral)
        })

        it("should return the maximum value", async () => {
          expect(await stbtc.maxMint(staker1.address)).to.be.eq(maximum)
        })
      })
    })
  })

  describe("deposit", () => {
    beforeAfterEachSnapshotWrapper()

    const receiver = ethers.Wallet.createRandom()

    let amountToDeposit: bigint
    let minimumDepositAmount: bigint

    beforeEach(async () => {
      minimumDepositAmount = await stbtc.minimumDepositAmount()
    })

    context("when the deposit amount is less than minimum", () => {
      beforeEach(() => {
        amountToDeposit = minimumDepositAmount - 1n
      })

      it("should revert", async () => {
        await expect(stbtc.deposit(amountToDeposit, receiver.address))
          .to.be.revertedWithCustomError(stbtc, "DepositAmountLessThanMin")
          .withArgs(amountToDeposit, minimumDepositAmount)
      })
    })

    context(
      "when the deposit amount is equal to the minimum deposit amount",
      () => {
        let tx: ContractTransactionResponse
        let expectedReceivedShares: bigint

        beforeEach(async () => {
          amountToDeposit = minimumDepositAmount
          expectedReceivedShares = amountToDeposit

          await tbtc.approve(await stbtc.getAddress(), amountToDeposit)
          tx = await stbtc
            .connect(staker1)
            .deposit(amountToDeposit, receiver.address)
        })

        it("should emit Deposit event", async () => {
          await expect(tx).to.emit(stbtc, "Deposit").withArgs(
            // Caller.
            staker1.address,
            // Receiver.
            receiver.address,
            // Staked tokens.
            amountToDeposit,
            // Received shares.
            expectedReceivedShares,
          )
        })

        it("should mint stBTC tokens", async () => {
          await expect(tx).to.changeTokenBalances(
            stbtc,
            [receiver.address],
            [expectedReceivedShares],
          )
        })

        it("should transfer tBTC tokens", async () => {
          await expect(tx).to.changeTokenBalances(
            tbtc,
            [staker1.address, stbtc],
            [-amountToDeposit, amountToDeposit],
          )
        })
      },
    )
  })
})