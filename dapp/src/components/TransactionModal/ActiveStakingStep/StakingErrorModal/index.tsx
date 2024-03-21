import React, { useCallback, useState } from "react"
import {
  useExecuteFunction,
  useModalFlowContext,
  useStakeFlowContext,
} from "#/hooks"
import { PROCESS_STATUSES } from "#/types"
import { logPromiseFailure } from "#/utils"
import LoadingModal from "../../ModalContentWrapper/LoadingModal"
import ServerErrorModal from "./ServerErrorModal"
import RetryModal from "./RetryModal"

export default function StakingErrorModal() {
  const { setStatus } = useModalFlowContext()
  const { stake } = useStakeFlowContext()

  const [isLoading, setIsLoading] = useState(false)
  const [isServerError, setIsServerError] = useState(false)

  const onStakeBTCSuccess = useCallback(
    () => setStatus(PROCESS_STATUSES.SUCCEEDED),
    [setStatus],
  )

  const onStakeBTCError = useCallback(() => setIsServerError(true), [])

  const handleStake = useExecuteFunction(
    stake,
    onStakeBTCSuccess,
    onStakeBTCError,
  )

  const handleRetry = useCallback(async () => {
    setIsLoading(true)
    await handleStake()
    setIsLoading(false)
  }, [handleStake])

  const handleRetryWrapper = useCallback(
    () => logPromiseFailure(handleRetry()),
    [handleRetry],
  )

  if (isServerError)
    return <ServerErrorModal retry={handleRetryWrapper} isLoading={isLoading} />

  if (isLoading) return <LoadingModal />

  return <RetryModal retry={handleRetryWrapper} />
}
