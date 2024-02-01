import { defineStyle, defineStyleConfig } from "@chakra-ui/react"

const baseStyle = defineStyle({
  color: "brand.400",
  borderWidth: 3,
  borderTopColor: "gold.400",
  borderBottomColor: "gold.400",
  borderLeftColor: "gold.400",
})

const sizeXl = defineStyle({
  width: 16,
  height: 16,
})

const sizes = {
  xl: sizeXl,
}

export const spinnerTheme = defineStyleConfig({ baseStyle, sizes })
