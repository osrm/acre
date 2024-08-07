import { Pathname } from "#/router/path"

export type ModalProps = Record<string, unknown>

export type BaseModalProps = {
  closeModal: () => void
  closeOnEsc?: boolean
  navigateToOnClose?: Pathname
}

export const MODAL_TYPES = {
  STAKE: "STAKE",
  UNSTAKE: "UNSTAKE",
  WELCOME: "WELCOME",
  MEZO_BEEHIVE: "MEZO_BEEHIVE",
  CONNECT_WALLET: "CONNECT_WALLET",
} as const

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES]
