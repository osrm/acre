import React from "react"
import ViewInBlockExplorer from "#/components/shared/ViewInBlockExplorer"
import { ExplorerDataType, TransactionInfo } from "#/types"
import { CurrencyBalance } from "#/components/shared/CurrencyBalance"
import CurrencyIcon from "#/components/shared/CurrencyIcon"
import CellWrapper from "./CellWrapper"

type CellType = "currency-balance" | "block-explorer" | "currency-icon"

const getCustomComponent = (type: CellType, transaction: TransactionInfo) => {
  switch (type) {
    case "currency-balance":
      return (
        <CurrencyBalance
          currency={transaction.asset.currency}
          amount={transaction.asset.amount}
          size="sm"
        />
      )
    case "block-explorer": {
      return (
        <ViewInBlockExplorer
          id={transaction.txHash}
          type={ExplorerDataType.TRANSACTION}
          chain={transaction.chain}
        />
      )
    }
    case "currency-icon": {
      return <CurrencyIcon currency={transaction.asset.currency} withSymbol />
    }
    default:
      // eslint-disable-next-line react/jsx-no-useless-fragment
      return <></>
  }
}

function CustomCell({
  type,
  transaction1,
  transaction2,
}: {
  type: CellType
  transaction1: TransactionInfo
  transaction2: TransactionInfo
}) {
  return (
    <CellWrapper
      children1={getCustomComponent(type, transaction1)}
      children2={getCustomComponent(type, transaction2)}
    />
  )
}

export default CustomCell
