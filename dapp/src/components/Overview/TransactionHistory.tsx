/* eslint-disable react/jsx-props-no-spreading */
import React from "react"
import { CardBody, Card, CardProps } from "@chakra-ui/react"
import { TextMd } from "../Typography"

export default function TransactionHistory(props: CardProps) {
  return (
    <Card {...props}>
      <CardBody>
        <TextMd>Transaction history</TextMd>
      </CardBody>
    </Card>
  )
}
