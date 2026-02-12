// Signal weights as defined in the spec
export const SIGNAL_WEIGHTS = {
  // Funding source signals
  MIXER_FUNDED: 35,
  BRIDGE_FUNDED: 15,
  EXCHANGE_FUNDED: 10,
  UNKNOWN_FUNDING: 5,

  // Wallet behavior signals
  FRESH_WALLET: 10,
  FAST_FUND_DEPLOY_30MIN: 15,
  FAST_FUND_DEPLOY_3H: 10,
  EXCHANGE_CASHOUT: 10,
  SPRAY_TRANSFERS: 10,
} as const

// Known mixer patterns
export const MIXER_PATTERNS = [
  "tornado",
  "mixer",
  "tumbler",
  "blend",
  "anonymizer",
]

// Known bridge protocols
export const BRIDGE_PATTERNS = [
  "wormhole",
  "portal",
  "allbridge",
  "celer",
  "multichain",
  "synapse",
  "stargate",
  "debridge",
  "layerzero",
]

// Known exchanges
export const EXCHANGE_PATTERNS = [
  "binance",
  "coinbase",
  "kraken",
  "ftx",
  "okx",
  "bybit",
  "kucoin",
  "huobi",
  "gate.io",
  "bitfinex",
  "gemini",
  "crypto.com",
  "bitstamp",
  "bitget",
]

export function identifyFundingType(
  tags: string[],
  label: string | null
): "mixer" | "bridge" | "exchange" | "unknown" | "direct" {
  const allText = [...tags, label || ""].map((t) => t.toLowerCase()).join(" ")

  // Check for mixer
  if (MIXER_PATTERNS.some((pattern) => allText.includes(pattern))) {
    return "mixer"
  }

  // Check for bridge
  if (BRIDGE_PATTERNS.some((pattern) => allText.includes(pattern))) {
    return "bridge"
  }

  // Check for exchange
  if (EXCHANGE_PATTERNS.some((pattern) => allText.includes(pattern))) {
    return "exchange"
  }

  // If we have some tags but couldn't identify, it might be direct
  if (tags.length > 0 || label) {
    return "direct"
  }

  return "unknown"
}

export function isWalletFresh(
  firstTxTimestamp: number | null,
  transactionCount: number
): boolean {
  if (!firstTxTimestamp) return true

  const ageInDays = (Date.now() / 1000 - firstTxTimestamp) / 86400

  // Wallet is considered fresh if:
  // - Less than 7 days old, OR
  // - Has fewer than 10 transactions
  return ageInDays < 7 || transactionCount < 10
}

export function isFastFundDeploy(
  fundTimestamp: number | null,
  deployTimestamp: number | null
): { isFast: boolean; timeMinutes: number | null; severity: "30min" | "3h" | null } {
  if (!fundTimestamp || !deployTimestamp) {
    return { isFast: false, timeMinutes: null, severity: null }
  }

  const timeSeconds = deployTimestamp - fundTimestamp
  const timeMinutes = timeSeconds / 60

  if (timeMinutes < 0) {
    return { isFast: false, timeMinutes: null, severity: null }
  }

  if (timeMinutes <= 30) {
    return { isFast: true, timeMinutes, severity: "30min" }
  }

  if (timeMinutes <= 180) {
    return { isFast: true, timeMinutes, severity: "3h" }
  }

  return { isFast: false, timeMinutes, severity: null }
}
