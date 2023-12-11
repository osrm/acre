import React from "react"
import {
  Text,
  Button,
  Tooltip,
  Icon,
  CardBody,
  Card,
  CardFooter,
  HStack,
  CardProps,
} from "@chakra-ui/react"
import { BITCOIN, USD } from "../../constants"
import { Info } from "../../static/icons"
import { useModal, useSidebar } from "../../hooks"
import Staking from "../Staking"

export default function PositionDetails(props: CardProps) {
  const { openModal } = useModal()
  const { onOpen: openSidebar } = useSidebar()

  return (
    <Card {...props}>
      <CardBody>
        <HStack justifyContent="space-between">
          <Text>Your positions</Text>
          {/* TODO: Add correct text for tooltip */}
          <Tooltip label="Template">
            <Icon as={Info} color="grey.700" />
          </Tooltip>
        </HStack>
        <Text>
          34.75 <Text as="span">{BITCOIN.symbol}</Text>
        </Text>
        <Text>
          1.245.148,1 <Text as="span">{USD.symbol}</Text>
        </Text>
      </CardBody>
      <CardFooter flexDirection="column" gap={2}>
        {/* TODO: Handle click actions */}
        <Button
          onClick={() => {
            openSidebar()
            openModal("overview")
          }}
        >
          Stake
        </Button>
        <Button variant="outline">Withdraw</Button>
      </CardFooter>
      <Staking />
    </Card>
  )
}
