import { useQuery } from "@tanstack/react-query"
import { REFETCH_INTERVAL_IN_MILLISECONDS, queryKeysFactory } from "#/constants"
import { acreApi } from "#/utils"

const { acreKeys } = queryKeysFactory

export default function useMats() {
  return useQuery({
    queryKey: [...acreKeys.mats()],
    queryFn: async () => acreApi.getMats(),
    refetchInterval: REFETCH_INTERVAL_IN_MILLISECONDS,
  })
}
