import React from "react"
import { useWallet } from "#/hooks"
import { PageLayout, PageLayoutColumn } from "./PageLayout"
import DashboardCard from "./DashboardCard"
import GrantedSeasonPassCard from "./GrantedSeasonPassCard"
import { CurrentSeasonCard } from "./CurrentSeasonCard"

export default function DashboardPage() {
  const { bitcoin } = useWallet()
  const bitcoinWalletBalance = bitcoin.account?.balance.toString() ?? "0"

  return (
    <PageLayout>
      <PageLayoutColumn isMain>
        <DashboardCard bitcoinAmount={bitcoinWalletBalance} />
      </PageLayoutColumn>

      <PageLayoutColumn>
        <CurrentSeasonCard />
        <GrantedSeasonPassCard />
      </PageLayoutColumn>
    </PageLayout>
  )
}
