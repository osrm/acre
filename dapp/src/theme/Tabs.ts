import { tabsAnatomy as parts } from "@chakra-ui/anatomy"
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react"

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle({
  tab: {
    fontWeight: "bold",
    color: "grey.400",
  },
})

const variantUnderlineTab = defineStyle({
  pb: 4,
  borderBottom: "2px solid",
  borderColor: "transparent",
  background: "transparent",
  textTransform: "capitalize",

  _selected: {
    color: "grey.700",
    borderColor: "brand.400",
  },
  _hover: {
    color: "grey.700",
  },
})

const variantUnderlineTabList = defineStyle({
  gap: 5,
  pb: 6,
})

const variantUnderlineTabPanel = defineStyle({
  px: 0,
})

const variantUnderline = definePartsStyle({
  tab: variantUnderlineTab,
  tablist: variantUnderlineTabList,
  tabpanel: variantUnderlineTabPanel,
})

const variants = {
  underline: variantUnderline,
}

export const tabsTheme = defineMultiStyleConfig({ baseStyle, variants })
