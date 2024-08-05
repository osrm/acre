import React from "react"
import { NumericFormat, NumericFormatProps } from "react-number-format"
import { InputProps, chakra, useMultiStyleConfig } from "@chakra-ui/react"

const ChakraNumericFormat = chakra(NumericFormat)

export type NumberFormatInputValues = {
  formattedValue: string
  value: string
  floatValue: number
}

export type NumberFormatInputProps = {
  onValueChange: (values: NumberFormatInputValues) => void
} & InputProps &
  Pick<NumericFormatProps, "decimalScale" | "allowNegative">

/**
 * Component is from the Threshold Network React Components repository.
 * It has been used because it supports the thousandth separator
 * and can be easily integrated with Chakra UI.
 *
 * More info:
 * https://github.com/threshold-network/components/blob/main/src/components/NumberFormatInput/index.tsx
 */
const NumberFormatInput = React.forwardRef<
  HTMLInputElement,
  NumberFormatInputProps
>((props, ref) => {
  const { field: css } = useMultiStyleConfig("Input", props)

  const { decimalScale, isDisabled, isInvalid, ...restProps } = props

  return (
    <ChakraNumericFormat
      thousandSeparator
      decimalScale={decimalScale}
      __css={css}
      disabled={isDisabled}
      aria-invalid={isInvalid}
      getInputRef={ref}
      {...restProps}
    />
  )
})

export default NumberFormatInput
