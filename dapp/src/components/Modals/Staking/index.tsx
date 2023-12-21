import React from "react"
import { useModalFlowContext } from "../../../hooks"
import StakeForm from "./StakeForm"
import Overview from "./Overview"
import ModalBase from "../../shared/ModalBase"

function StakingSteps() {
  const { activeStep, goNext } = useModalFlowContext()

  switch (activeStep) {
    case 1:
      return <Overview goNext={goNext} />
    case 2:
      return <StakeForm goNext={goNext} />
    default:
      return null
  }
}

export default function StakingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} numberOfSteps={2}>
      <StakingSteps />
    </ModalBase>
  )
}