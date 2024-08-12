import React from "react"
import TokenAmountForm from "#/components/shared/TokenAmountForm"
import { TokenAmountFormValues } from "#/components/shared/TokenAmountForm/TokenAmountFormBase"
import { FormSubmitButton } from "#/components/shared/Form"
import { ACTION_FLOW_TYPES, BaseFormProps, PROCESS_STATUSES } from "#/types"
import {
  useActionFlowStatus,
  useBitcoinPosition,
  useMinWithdrawAmount,
} from "#/hooks"
import { formatTokenAmount, getCurrencyByType } from "#/utils"
import UnstakeDetails from "./UnstakeDetails"

function UnstakeFormModal({
  onSubmitForm,
}: BaseFormProps<TokenAmountFormValues>) {
  const { data } = useBitcoinPosition()
  const balance = data?.estimatedBitcoinBalance ?? 0n
  const minTokenAmount = useMinWithdrawAmount()
  const status = useActionFlowStatus()

  const { decimals, desiredDecimals } = getCurrencyByType("bitcoin")
  const inputPlaceholder = `Minimum ${formatTokenAmount(minTokenAmount, decimals, desiredDecimals)} BTC`

  return (
    <TokenAmountForm
      actionType={ACTION_FLOW_TYPES.UNSTAKE}
      tokenBalanceInputPlaceholder={inputPlaceholder}
      currency="bitcoin"
      tokenBalance={balance}
      minTokenAmount={minTokenAmount}
      onSubmitForm={onSubmitForm}
      withMaxButton
      defaultAmount={
        status === PROCESS_STATUSES.REFINE_AMOUNT ? balance : undefined
      }
    >
      <UnstakeDetails balance={balance} currency="bitcoin" />
      <FormSubmitButton mt={10}>Withdraw</FormSubmitButton>
    </TokenAmountForm>
  )
}

export default UnstakeFormModal
