import { DepositReceipt, EthereumAddress } from "@keep-network/tbtc-v2.ts"
import { ethers } from "ethers"
import { AcreContracts } from "../../src/lib/contracts"
import { StakingModule } from "../../src/modules/staking"
import { Hex } from "../../src/lib/utils"
import { MockAcreContracts } from "../utils/mock-acre-contracts"
import { MockMessageSigner } from "../utils/mock-message-signer"
import { MockTBTC } from "../utils/mock-tbtc"
import { StakeInitialization } from "../../src/modules/staking/stake-initialization"

const stakingModuleData: {
  initializeStake: {
    staker: EthereumAddress
    referral: number
    bitcoinRecoveryAddress: string
    mockedDepositBTCAddress: string
  }
} = {
  initializeStake: {
    staker: EthereumAddress.from(ethers.Wallet.createRandom().address),
    referral: 1,
    bitcoinRecoveryAddress: "mjc2zGWypwpNyDi4ZxGbBNnUA84bfgiwYc",
    mockedDepositBTCAddress:
      "tb1qma629cu92skg0t86lftyaf9uflzwhp7jk63h6mpmv3ezh6puvdhs6w2r05",
  },
}

const stakingInitializationData: {
  depositReceipt: Omit<DepositReceipt, "depositor">
  mockedInitializeTxHash: Hex
} = {
  depositReceipt: {
    blindingFactor: Hex.from("555555"),
    walletPublicKeyHash: Hex.from("666666"),
    refundPublicKeyHash: Hex.from("0x2cd680318747b720d67bf4246eb7403b476adb34"),
    refundLocktime: Hex.from("888888"),
  },
  mockedInitializeTxHash: Hex.from("999999"),
}

describe("Staking", () => {
  const contracts: AcreContracts = new MockAcreContracts()
  const messageSigner = new MockMessageSigner()
  const tbtc = new MockTBTC()

  const staking: StakingModule = new StakingModule(
    contracts,
    messageSigner,
    tbtc,
  )

  describe("initializeStake", () => {
    const {
      mockedDepositBTCAddress,
      bitcoinRecoveryAddress,
      staker,
      referral,
    } = stakingModuleData.initializeStake
    const mockedDeposit = {
      getBitcoinAddress: jest.fn().mockResolvedValue(mockedDepositBTCAddress),
      detectFunding: jest.fn(),
      getReceipt: jest.fn(),
      initiateMinting: jest.fn(),
    }
    const mockedSignedMessage = { verify: jest.fn() }
    const mockEncodedExtraData =
      "0xeb098d6cde6a202981316b24b19e64d82721e89e4d0000000000000000000000"
    let result: StakeInitialization

    beforeEach(async () => {
      contracts.tbtcDepositor.encodeExtraData = jest
        .fn()
        .mockReturnValue(mockEncodedExtraData)
      tbtc.deposits.initiateDepositWithProxy = jest
        .fn()
        .mockReturnValue(mockedDeposit)
      messageSigner.sign = jest.fn().mockResolvedValue(mockedSignedMessage)

      result = await staking.initializeStake(
        bitcoinRecoveryAddress,
        staker,
        referral,
      )
    })

    it("should encode extra data", () => {
      expect(contracts.tbtcDepositor.encodeExtraData(staker, referral))
    })

    it("should initiate tBTC deposit", () => {
      expect(tbtc.deposits.initiateDepositWithProxy).toHaveBeenCalledWith(
        bitcoinRecoveryAddress,
        contracts.tbtcDepositor,
        mockEncodedExtraData,
      )
    })

    it("should return stake initialization object", () => {
      expect(result).toBeInstanceOf(StakeInitialization)
      expect(result.getBitcoinAddress).toBeDefined()
      expect(result.stake).toBeDefined()
      expect(result.signMessage).toBeDefined()
    })

    describe("StakeInitialization", () => {
      const { depositReceipt } = stakingInitializationData

      beforeAll(() => {
        mockedDeposit.getReceipt.mockReturnValue(depositReceipt)
      })

      describe("getDepositAddress", () => {
        it("should return bitcoin deposit address", async () => {
          expect(await result.getBitcoinAddress()).toBe(mockedDepositBTCAddress)
        })
      })

      describe("signMessage", () => {
        describe("when signing by valid receiver", () => {
          const depositorAddress = ethers.Wallet.createRandom().address

          beforeEach(async () => {
            mockedSignedMessage.verify.mockReturnValue(staker)
            contracts.tbtcDepositor.getChainIdentifier = jest
              .fn()
              .mockReturnValue(EthereumAddress.from(depositorAddress))

            await result.signMessage()
          })

          it("should sign message", () => {
            expect(messageSigner.sign).toHaveBeenCalledWith(
              {
                name: "TbtcDepositor",
                version: "1",
                verifyingContract: contracts.tbtcDepositor.getChainIdentifier(),
              },
              {
                Stake: [
                  { name: "receiver", type: "address" },
                  { name: "bitcoinRecoveryAddress", type: "string" },
                ],
              },
              {
                receiver: staker.identifierHex,
                bitcoinRecoveryAddress,
              },
            )
          })

          it("should verify signed message", () => {
            expect(mockedSignedMessage.verify).toHaveBeenCalled()
          })
        })

        describe("when signing by invalid receiver", () => {
          const invalidReceiver = EthereumAddress.from(
            ethers.Wallet.createRandom().address,
          )

          beforeEach(() => {
            mockedSignedMessage.verify = jest
              .fn()
              .mockResolvedValue(invalidReceiver)
          })

          it("should throw an error", async () => {
            await expect(result.signMessage()).rejects.toThrow(
              "Invalid receiver address",
            )
          })
        })
      })

      describe("stake", () => {
        beforeAll(() => {
          mockedSignedMessage.verify.mockReturnValue(staker)
        })

        describe("when the message has not been signed yet", () => {
          it("should throw an error", async () => {
            await expect(result.stake()).rejects.toThrow("Sign message first")
          })
        })

        describe("when message has already been signed", () => {
          let tx: Hex
          const { mockedInitializeTxHash: mockedTxHash } =
            stakingInitializationData

          beforeAll(async () => {
            mockedDeposit.initiateMinting.mockResolvedValue(mockedTxHash)
            await result.signMessage()

            tx = await result.stake()
          })

          it("should stake tokens via tbtc depositor proxy", () => {
            expect(mockedDeposit.initiateMinting).toHaveBeenCalled()
          })

          it("should return transaction hash", () => {
            expect(tx).toBe(mockedTxHash)
          })
        })
      })
    })
  })
})
