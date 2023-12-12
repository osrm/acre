import { ComponentSingleStyleConfig } from "@chakra-ui/react"

const Modal: ComponentSingleStyleConfig = {
  baseStyle: {
    dialog: {
      p: 4,
      border: "2px",
      boxShadow: "none",
      borderColor: "white",
      borderRadius: "xl",
      bg: "gold.100",
    },
    closeButton: {
      top: -10,
      right: -10,
      rounded: "100%",
      bg: "rgba(255, 255, 255, 0.50)",
    },
  },
}

export default Modal
