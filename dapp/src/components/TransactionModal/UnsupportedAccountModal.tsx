import React from "react"
import {
  Button,
  HStack,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  VStack,
} from "@chakra-ui/react"
import { TextMd, TextSm } from "#/components/shared/Typography"
import { logPromiseFailure } from "#/utils"
import { UseRequestAccountReturn } from "#/types"
import { BitcoinIcon } from "#/assets/icons"
import { ErrorAlert, ErrorAlertIcon } from "../shared/alerts"
import { CurrencyBalance } from "../shared/CurrencyBalance"

type UnsupportedAccountModalProps = UseRequestAccountReturn

export default function UnsupportedAccountModal({
  account,
  requestAccount,
}: UnsupportedAccountModalProps) {
  const handleClick = () => {
    logPromiseFailure(requestAccount())
  }

  return (
    <>
      <ModalCloseButton />
      <ModalHeader textAlign="center" color="red.400">
        Account not supported
      </ModalHeader>

      <ModalBody>
        {account && (
          <ErrorAlert>
            <ErrorAlertIcon
              as={BitcoinIcon}
              color="grey.700"
              bg="gold.200"
              rounded="full"
              transform="auto"
              rotate={12}
            />

            <HStack spacing={5} flex={1}>
              <VStack alignItems="start" spacing={0} flex={1}>
                <TextSm
                  fontWeight="bold"
                  color="grey.700"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                  maxW={56}
                >
                  {account.name}
                </TextSm>
                <CurrencyBalance
                  fontSize="sm"
                  lineHeight={5}
                  fontWeight="medium"
                  color="grey.500"
                  amount={account.balance.toString()}
                  currency="bitcoin"
                />
              </VStack>

              <TextSm
                px={3}
                py={2}
                rounded="1.125rem" // 18px
                color="red.400"
                borderWidth="1px"
                borderColor="red.200"
                whiteSpace="nowrap"
              >
                Segwit
              </TextSm>
            </HStack>
          </ErrorAlert>
        )}

        <TextMd
          maxW="25rem" // 400px
        >
          We currently support <b>Legacy</b> and <b>Native Segwit</b> accounts
          only.
        </TextMd>
      </ModalBody>

      <ModalFooter pt={0}>
        <Button size="lg" width="100%" h={14} onClick={handleClick}>
          Connect account
        </Button>
      </ModalFooter>
    </>
  )
}
