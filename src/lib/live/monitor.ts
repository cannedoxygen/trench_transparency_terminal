import { heliusClient } from "@/lib/helius/client"

export interface LiveSignal {
  type: "liquidity_change" | "dev_sell" | "large_transfer" | "exchange_deposit" | "holder_change"
  severity: "info" | "warning" | "danger" | "critical"
  message: string
  timestamp: number
  amount?: number
  address?: string
}

export interface LiveRiskState {
  currentScore: number
  baseScore: number
  trend: "stable" | "increasing" | "decreasing"
  signals: LiveSignal[]
  lastUpdate: number
  isMonitoring: boolean
}

// Known exchange addresses for detection
const EXCHANGE_ADDRESSES = new Set([
  "5tzFkiKscXHK5ZXCGbBiKuV8XhE3oLkYbYpW8Wd8Vqne", // Binance
  "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S", // Coinbase
  "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS", // Kraken
  "ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ", // OKX
  "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6", // Bybit
])

/**
 * Check for recent activity that could indicate a rug
 */
export async function checkLiveSignals(
  tokenMint: string,
  deployerAddress: string | null,
  topHolders: string[]
): Promise<LiveSignal[]> {
  const signals: LiveSignal[] = []
  const now = Math.floor(Date.now() / 1000)
  const fiveMinutesAgo = now - 300

  try {
    // Check deployer activity if we know the address
    if (deployerAddress) {
      const deployerTransfers = await heliusClient.getWalletTransfers(deployerAddress, 20)

      for (const transfer of deployerTransfers.transfers) {
        // Skip old transfers
        if (transfer.timestamp < fiveMinutesAgo) continue

        // Check for sells (deployer sending tokens out)
        if (transfer.direction === "out") {
          const amount = transfer.token.amount

          // Large SOL transfer to exchange
          if (transfer.token.mint === "So11111111111111111111111111111111111111112") {
            if (EXCHANGE_ADDRESSES.has(transfer.counterparty)) {
              signals.push({
                type: "exchange_deposit",
                severity: amount > 10 ? "critical" : amount > 5 ? "danger" : "warning",
                message: `Deployer sent ${amount.toFixed(2)} SOL to exchange`,
                timestamp: transfer.timestamp,
                amount,
                address: transfer.counterparty,
              })
            } else if (amount > 5) {
              signals.push({
                type: "large_transfer",
                severity: amount > 20 ? "danger" : "warning",
                message: `Deployer sent ${amount.toFixed(2)} SOL`,
                timestamp: transfer.timestamp,
                amount,
              })
            }
          }

          // Dev selling the token itself
          if (transfer.token.mint === tokenMint) {
            signals.push({
              type: "dev_sell",
              severity: "critical",
              message: `Deployer sold tokens`,
              timestamp: transfer.timestamp,
              amount,
            })
          }
        }
      }
    }

    // Check top holder activity (first 5 holders)
    const holdersToCheck = topHolders.slice(0, 5)

    for (const holder of holdersToCheck) {
      if (holder === deployerAddress) continue // Already checked

      try {
        const transfers = await heliusClient.getWalletTransfers(holder, 10)

        for (const transfer of transfers.transfers) {
          if (transfer.timestamp < fiveMinutesAgo) continue

          // Large holder selling the token
          if (transfer.direction === "out" && transfer.token.mint === tokenMint) {
            signals.push({
              type: "large_transfer",
              severity: "warning",
              message: `Top holder selling tokens`,
              timestamp: transfer.timestamp,
              amount: transfer.token.amount,
              address: holder,
            })
          }

          // Large holder sending to exchange
          if (
            transfer.direction === "out" &&
            transfer.token.mint === "So11111111111111111111111111111111111111112" &&
            EXCHANGE_ADDRESSES.has(transfer.counterparty) &&
            transfer.token.amount > 5
          ) {
            signals.push({
              type: "exchange_deposit",
              severity: "warning",
              message: `Top holder sent ${transfer.token.amount.toFixed(2)} SOL to exchange`,
              timestamp: transfer.timestamp,
              amount: transfer.token.amount,
              address: holder,
            })
          }
        }
      } catch {
        // Skip holder if we can't fetch their data
      }
    }

    // Sort by timestamp (most recent first)
    signals.sort((a, b) => b.timestamp - a.timestamp)

    return signals
  } catch (error) {
    console.error("[LiveMonitor] Error checking signals:", error)
    return []
  }
}

/**
 * Calculate live risk adjustment based on signals
 */
export function calculateLiveRiskAdjustment(signals: LiveSignal[]): number {
  let adjustment = 0

  for (const signal of signals) {
    switch (signal.severity) {
      case "critical":
        adjustment += 25
        break
      case "danger":
        adjustment += 15
        break
      case "warning":
        adjustment += 5
        break
      case "info":
        adjustment += 1
        break
    }
  }

  return Math.min(adjustment, 50) // Cap at +50
}

/**
 * Get severity color class
 */
export function getSeverityColor(severity: LiveSignal["severity"]): string {
  switch (severity) {
    case "critical":
      return "text-risk-extreme"
    case "danger":
      return "text-risk-high"
    case "warning":
      return "text-risk-moderate"
    default:
      return "text-muted-foreground"
  }
}

/**
 * Get severity background class
 */
export function getSeverityBg(severity: LiveSignal["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-risk-extreme/10"
    case "danger":
      return "bg-risk-high/10"
    case "warning":
      return "bg-risk-moderate/10"
    default:
      return "bg-muted/50"
  }
}
