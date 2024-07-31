import featureFlags from "./featureFlags"

type WalletInfo = {
  id: string
  downloadUrls: {
    desktop: string
  }
}

const UNISAT: WalletInfo = {
  id: "orangekit-unisat",
  downloadUrls: {
    desktop:
      "https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo",
  },
}

const OKX: WalletInfo = {
  id: "orangekit-okx",
  downloadUrls: {
    desktop:
      "https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge",
  },
}

const XVERSE: WalletInfo = {
  id: "orangekit-xverse",
  downloadUrls: {
    desktop:
      "https://chromewebstore.google.com/detail/xverse-wallet/idnnbdplmphpflfnlkomgpfbpcgelopg",
  },
}

const SUPPORTED_WALLET_IDS = [
  UNISAT.id,
  ...(featureFlags.OKX_WALLET_ENABLED ? [OKX.id] : []),
  ...(featureFlags.XVERSE_WALLET_ENABLED ? [XVERSE.id] : []),
]

export default {
  UNISAT,
  OKX,
  XVERSE,
  SUPPORTED_WALLET_IDS,
}
