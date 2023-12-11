import React from "react"
import {
  Button,
  HStack,
  Icon,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react"
import { Account } from "@ledgerhq/wallet-api-client"
import { Bitcoin, Ethereum, Info } from "../../static/icons"
import { BITCOIN } from "../../constants"
import {
  useRequestBitcoinAccount,
  useRequestEthereumAccount,
  useWalletContext,
} from "../../hooks"
import { formatSatoshiAmount, truncateAddress } from "../../utils"

export type ConnectButtonsProps = {
  leftIcon: typeof Icon
  rightIcon: typeof Icon
  account: Account | undefined
  requestAccount: () => Promise<void>
}

function ConnectButton({
  leftIcon,
  rightIcon,
  account,
  requestAccount,
}: ConnectButtonsProps) {
  const styles = !account ? { color: "error", borderColor: "error" } : undefined
  const colorRightIcon = useColorModeValue("black", "grey.80")

  return (
    <Button
      variant="outline"
      sx={styles}
      leftIcon={<Icon as={leftIcon} h={7} w={7} />}
      rightIcon={
        !account ? (
          // TODO: Add correct text for tooltip
          <Tooltip label="Template">
            <Icon as={rightIcon} color={colorRightIcon} />
          </Tooltip>
        ) : undefined
      }
      onClick={requestAccount}
    >
      {account ? truncateAddress(account.address) : "Not connected"}
    </Button>
  )
}

export default function ConnectWallet() {
  const { requestAccount: requestBitcoinAccount } = useRequestBitcoinAccount()
  const { requestAccount: requestEthereumAccount } = useRequestEthereumAccount()
  const { btcAccount, ethAccount } = useWalletContext()

  return (
    <HStack spacing={4}>
      <HStack display={{ base: "none", md: "flex" }}>
        <Text>Balance</Text>
        <Text as="b">
          {!btcAccount || btcAccount?.balance.isZero()
            ? "0.00"
            : formatSatoshiAmount(btcAccount.balance.toString())}
        </Text>
        <Text>{BITCOIN.symbol}</Text>
      </HStack>
      <ConnectButton
        leftIcon={Bitcoin}
        rightIcon={Info}
        account={btcAccount}
        requestAccount={async () => {
          await requestBitcoinAccount()
        }}
      />
      <ConnectButton
        leftIcon={Ethereum}
        rightIcon={Info}
        account={ethAccount}
        requestAccount={async () => {
          await requestEthereumAccount()
        }}
      />
    </HStack>
  )
}
