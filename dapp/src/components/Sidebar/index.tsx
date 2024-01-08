import React from "react"
import {
  Box,
  Button,
  Icon,
  useMultiStyleConfig,
  Image,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  HStack,
  Link,
} from "@chakra-ui/react"
import RightSidebar from "../../assets/images/right-sidebar-bg.png"
import { useDocsDrawer, useSidebar } from "../../hooks"
import { ArrowUpRight, ShieldPlusIcon } from "../../static/icons"
import { TextMd, TextSm } from "../shared/Typography"

const readMoreEarnings = "https://#"

const BUTTONS = [
  { label: "FAQ" },
  { label: "Token Contract" },
  { label: "Bridge Contract" },
]

export default function Sidebar() {
  const { isOpen } = useSidebar()
  const { onOpen: openDocsDrawer } = useDocsDrawer()
  const styles = useMultiStyleConfig("Sidebar")

  return (
    <Box
      as="aside"
      mt="header_height"
      w={isOpen ? 80 : 0}
      __css={styles.sidebarContainer}
    >
      <Box __css={styles.sidebar}>
        <Button
          justifyContent="flex-start"
          leftIcon={<Icon as={ArrowUpRight} boxSize={6} />}
          onClick={openDocsDrawer}
          width="100%"
        >
          Docs
        </Button>
        <Card variant="sidebar">
          <CardHeader padding="0">
            <Image src={RightSidebar} alt="" width="70.5" height="40" />
          </CardHeader>

          <CardBody>
            <TextMd alignSelf="stretch" fontWeight="bold">
              Maximize your earnings by using tBTC to deposit and redeem BTC in
              DeFi!
            </TextMd>
          </CardBody>

          <CardFooter paddingTop="0">
            <Link href={readMoreEarnings} isExternal>
              <TextSm>Read more</TextSm>
            </Link>
          </CardFooter>
        </Card>

        <Card variant="sidebar">
          <CardHeader>
            <TextMd fontWeight="bold">How we calculate fees</TextMd>
          </CardHeader>

          <CardBody paddingTop="0">
            <HStack gap="1">
              <Icon as={ShieldPlusIcon} w={5} h={5} alignSelf="baseline" />
              <TextSm>Fees is software empowered by the Threshold DAO.</TextSm>
            </HStack>
          </CardBody>
        </Card>

        {BUTTONS.map(({ label }) => (
          <Button
            key={label}
            marginTop="12px"
            variant="outline"
            justifyContent="flex-start"
            leftIcon={<Icon as={ArrowUpRight} boxSize={6} color="brand.400" />}
            onClick={openDocsDrawer}
            width="100%"
            bg="gold.100"
            borderColor="white"
            borderStyle="solid"
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  )
}
