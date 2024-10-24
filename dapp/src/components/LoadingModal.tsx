import React from "react"
import { ModalBody } from "@chakra-ui/react"
import { TextMd } from "#/components/shared/Typography"
import withBaseModal from "./ModalRoot/withBaseModal"
import Spinner from "./shared/Spinner"

export function LoadingModalBase() {
  return (
    <ModalBody>
      <Spinner size="xl" />
      <TextMd fontWeight="semibold">Loading...</TextMd>
    </ModalBody>
  )
}

const LoadingModal = withBaseModal(LoadingModalBase, {
  variant: "unstyled",
  closeOnEsc: false,
})
export default LoadingModal
