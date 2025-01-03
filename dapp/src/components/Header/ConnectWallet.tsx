import React from "react"
import {
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  StackDivider,
  useClipboard,
  useMultiStyleConfig,
} from "@chakra-ui/react"
import { useIsEmbed, useMobileMode, useModal, useWallet } from "#/hooks"
import { CurrencyBalance } from "#/components/shared/CurrencyBalance"
import { TextMd } from "#/components/shared/Typography"
import { BitcoinIcon } from "#/assets/icons"
import { referralProgram, truncateAddress } from "#/utils"
import { motion } from "framer-motion"
import { MODAL_TYPES } from "#/types"
import {
  IconCopy,
  IconLogout,
  IconWallet,
  IconUserCode,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react"
import { useMatch } from "react-router-dom"
import { usePostHogIdentity } from "#/hooks/posthog"
import Tooltip from "../shared/Tooltip"

function isChangeAccountFeatureSupported(embeddedApp: string | undefined) {
  return referralProgram.isEmbedApp(embeddedApp)
}

export default function ConnectWallet() {
  const { isEmbed, embeddedApp } = useIsEmbed()
  const { address, balance, onDisconnect } = useWallet()
  const { isOpenGlobalErrorModal, modalType, openModal } = useModal()
  const { hasCopied, onCopy } = useClipboard(address ?? "")
  const styles = useMultiStyleConfig("Button", {
    variant: "card",
    size: "lg",
  })
  const isDashboardPage = useMatch("/dashboard")
  const { resetIdentity } = usePostHogIdentity()
  const isMobile = useMobileMode()

  const handleConnectWallet = (isReconnecting: boolean = false) => {
    openModal(MODAL_TYPES.CONNECT_WALLET, { isReconnecting })
  }

  const handleDisconnectWallet = () => {
    onDisconnect()
    resetIdentity()
  }

  if (!address) {
    return (
      <Button
        size="lg"
        variant="card"
        color="grey.700"
        leftIcon={<Icon as={BitcoinIcon} boxSize={6} color="brand.400" />}
        onClick={() => handleConnectWallet(false)}
        {...((modalType === MODAL_TYPES.CONNECT_WALLET ||
          isOpenGlobalErrorModal) && {
          pointerEvents: "none",
        })}
        isDisabled={!isDashboardPage}
      >
        {`Connect ${isEmbed ? "account" : "wallet"}`}
      </Button>
    )
  }
  const options = [
    {
      id: "Copy",
      icon: IconCopy,
      label: hasCopied ? "Address copied" : "Copy Address",
      onClick: onCopy,
      isSupported: true,
      closeOnSelect: false,
    },
    {
      id: "Change account",
      icon: IconUserCode,
      label: "Change account",
      onClick: () => handleConnectWallet(true),
      isSupported: isChangeAccountFeatureSupported(embeddedApp),
      closeOnSelect: true,
    },
    {
      id: "Disconnect",
      icon: IconLogout,
      label: "Disconnect",
      onClick: onDisconnect,
      closeOnSelect: true,
      isSupported: true,
    },
  ]

  return isMobile ? (
    <Menu>
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Button}
            variant="card"
            leftIcon={<Icon as={BitcoinIcon} boxSize={6} color="brand.400" />}
            rightIcon={isOpen ? <IconChevronUp /> : <IconChevronDown />}
          >
            <TextMd color="brand.400">{truncateAddress(address)}</TextMd>
          </MenuButton>
          <MenuList bg="gold.200">
            {options.map(
              (option) =>
                option.isSupported && (
                  <MenuItem
                    key={option.id}
                    closeOnSelect={option.closeOnSelect}
                    {...styles}
                    icon={<Icon as={option.icon} boxSize={5} />}
                    onClick={option.onClick}
                  >
                    {option.label}
                  </MenuItem>
                ),
            )}
          </MenuList>
        </>
      )}
    </Menu>
  ) : (
    <HStack spacing={4}>
      <HStack display={{ base: "none", md: "flex" }}>
        <CurrencyBalance currency="bitcoin" amount={balance} />
        <Icon as={IconWallet} boxSize={5} />
      </HStack>

      <Flex
        as={motion.div}
        whileHover="expanded"
        initial="collapsed"
        animate="collapsed"
        overflow="hidden"
        {...styles}
        pr={0}
      >
        <HStack
          as={motion.div}
          variants={{
            expanded: { paddingRight: 4 },
            collapsed: { paddingRight: 16 },
          }}
          spacing={3}
        >
          <Icon as={BitcoinIcon} boxSize={6} color="brand.400" />
          <TextMd color="brand.400">{truncateAddress(address)}</TextMd>
        </HStack>

        <HStack
          as={motion.div}
          variants={{
            expanded: { width: "auto" },
            collapsed: { width: 0 },
          }}
          spacing={1}
          divider={<StackDivider borderColor="gold.500" />}
        >
          {options.map(
            (option) =>
              option.isSupported && (
                <Tooltip
                  key={option.id}
                  size="xs"
                  label={option.label}
                  closeOnClick={false}
                >
                  <IconButton
                    variant="ghost"
                    aria-label={option.id}
                    icon={<Icon as={option.icon} boxSize={5} />}
                    px={2}
                    boxSize={5}
                    onClick={option.onClick}
                  />
                </Tooltip>
              ),
          )}

          <Tooltip size="xs" label="Disconnect">
            <IconButton
              variant="ghost"
              aria-label="Disconnect"
              icon={<Icon as={IconLogout} boxSize={5} />}
              px={2}
              boxSize={5}
              onClick={handleDisconnectWallet}
            />
          </Tooltip>
        </HStack>
      </Flex>
    </HStack>
  )
}
