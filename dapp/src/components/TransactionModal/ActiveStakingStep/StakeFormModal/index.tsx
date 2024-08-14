import React from "react"
import TokenAmountForm from "#/components/shared/TokenAmountForm"
import { TokenAmountFormValues } from "#/components/shared/TokenAmountForm/TokenAmountFormBase"
import { useMinDepositAmount, useWallet } from "#/hooks"
import { FormSubmitButton } from "#/components/shared/Form"
import { BaseFormProps } from "#/types"
import StakeDetails from "./StakeDetails"
import AcrePointsRewardEstimation from "./AcrePointsRewardEstimation"

function StakeFormModal({
  onSubmitForm,
}: BaseFormProps<TokenAmountFormValues>) {
  const minDepositAmount = useMinDepositAmount()
  const { balance: tokenBalance } = useWallet()

  return (
    <TokenAmountForm
      tokenBalanceInputPlaceholder="BTC"
      currency="bitcoin"
      fiatCurrency="usd"
      tokenBalance={tokenBalance ?? 0n}
      minTokenAmount={minDepositAmount}
      onSubmitForm={onSubmitForm}
      withMaxButton={false}
    >
      <AcrePointsRewardEstimation />
      <StakeDetails currency="bitcoin" />
      <FormSubmitButton mt={10}>Deposit</FormSubmitButton>
    </TokenAmountForm>
  )
}

export default StakeFormModal
