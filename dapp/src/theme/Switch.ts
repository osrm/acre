import { ComponentSingleStyleConfig } from "@chakra-ui/react"

const Switch: ComponentSingleStyleConfig = {
  baseStyle: {
    track: {
      _checked: {
        _dark: {
          bg: "purple",
        },
        _light: {
          bg: "grey.200",
        },
      },
    },
  },
}

export default Switch
