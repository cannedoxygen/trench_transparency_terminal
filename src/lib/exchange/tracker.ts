import { heliusClient } from "@/lib/helius/client"

// Known exchange deposit addresses (partial list - Helius identity API handles most)
const KNOWN_EXCHANGES: Record<string, string> = {
  // These are well-known exchange hot wallets
  "5tzFkiKscXHK5ZXCGbBiKuV8XhE3oLkYbYpW8Wd8Vqne": "Binance",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM": "FTX", // defunct but still relevant
  "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S": "Coinbase",
  "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS": "Kraken",
  "ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ": "OKX",
  "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6": "Bybit",
}

export interface ExchangeTransfer {
  signature: string
  timestamp: number
  direction: "deposit" | "withdrawal"
  exchange: string
  amount: number
  token: string // "SOL" or token symbol
  counterparty: string // The exchange wallet address
}

export interface ExchangeFlowAnalysis {
  walletAddress: string
  totalDeposits: number // Total SOL value deposited to exchanges
  totalWithdrawals: number // Total SOL value withdrawn from exchanges
  netFlow: number // Positive = more withdrawals, Negative = more deposits (cash out)
  recentTransfers: ExchangeTransfer[]
  exchangesUsed: string[]
  largestDeposit: ExchangeTransfer | null
  cashOutDetected: boolean
  cashOutAmount: number
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

/**
 * Analyze exchange flows for a wallet
 */
export async function analyzeExchangeFlows(
  walletAddress: string
): Promise<ExchangeFlowAnalysis> {
  const warnings: string[] = []
  const recentTransfers: ExchangeTransfer[] = []
  const exchangesUsed = new Set<string>()

  let totalDeposits = 0
  let totalWithdrawals = 0
  let largestDeposit: ExchangeTransfer | null = null

  console.log(`[ExchangeFlow] Analyzing exchange flows for ${walletAddress.slice(0, 8)}...`)

  try {
    // Get wallet transfers
    const transfers = await heliusClient.getWalletTransfers(walletAddress, 100)

    if (transfers.transfers.length === 0) {
      console.log(`[ExchangeFlow] No transfers found`)
      return createEmptyAnalysis(walletAddress)
    }

    // Get identities for all counterparties to identify exchanges
    const counterparties = Array.from(new Set(transfers.transfers.map(t => t.counterparty)))
    const identities = await heliusClient.batchGetIdentities(counterparties)

    // Process each transfer
    for (const transfer of transfers.transfers) {
      const counterpartyIdentity = identities.get(transfer.counterparty)
      const knownExchange = KNOWN_EXCHANGES[transfer.counterparty]

      // Check if counterparty is an exchange
      const isExchange =
        knownExchange ||
        counterpartyIdentity?.category?.toLowerCase().includes("exchange") ||
        counterpartyIdentity?.type?.toLowerCase().includes("exchange") ||
        counterpartyIdentity?.tags?.some(t => t.toLowerCase().includes("exchange"))

      if (!isExchange) continue

      const exchangeName = knownExchange ||
        counterpartyIdentity?.name ||
        "Unknown Exchange"

      exchangesUsed.add(exchangeName)

      const isDeposit = transfer.direction === "out" // Sending TO exchange = deposit
      const amount = transfer.token.amount

      const exchangeTransfer: ExchangeTransfer = {
        signature: transfer.signature,
        timestamp: transfer.timestamp,
        direction: isDeposit ? "deposit" : "withdrawal",
        exchange: exchangeName,
        amount,
        token: transfer.token.symbol || "SOL",
        counterparty: transfer.counterparty,
      }

      recentTransfers.push(exchangeTransfer)

      if (isDeposit) {
        totalDeposits += amount
        if (!largestDeposit || amount > largestDeposit.amount) {
          largestDeposit = exchangeTransfer
        }
      } else {
        totalWithdrawals += amount
      }
    }

    // Sort by timestamp (most recent first)
    recentTransfers.sort((a, b) => b.timestamp - a.timestamp)

    // Calculate net flow (negative = cash out)
    const netFlow = totalWithdrawals - totalDeposits

    // Detect cash out pattern
    const cashOutDetected = totalDeposits > 1 && totalDeposits > totalWithdrawals * 2
    const cashOutAmount = cashOutDetected ? totalDeposits - totalWithdrawals : 0

    // Generate warnings
    if (cashOutDetected) {
      warnings.push(`Cash out detected: ${cashOutAmount.toFixed(2)} SOL sent to exchanges`)
    }

    if (largestDeposit && largestDeposit.amount > 10) {
      const timeAgo = formatTimeAgo(largestDeposit.timestamp)
      warnings.push(`Large deposit: ${largestDeposit.amount.toFixed(2)} SOL to ${largestDeposit.exchange} (${timeAgo})`)
    }

    // Recent large deposits (last 24h)
    const oneDayAgo = Date.now() / 1000 - 86400
    const recentLargeDeposits = recentTransfers.filter(
      t => t.direction === "deposit" && t.timestamp > oneDayAgo && t.amount > 5
    )
    if (recentLargeDeposits.length > 0) {
      const totalRecent = recentLargeDeposits.reduce((sum, t) => sum + t.amount, 0)
      warnings.push(`${totalRecent.toFixed(2)} SOL deposited to exchanges in last 24h`)
    }

    // Calculate risk level
    let riskLevel: "low" | "medium" | "high" | "extreme" = "low"

    if (cashOutDetected && cashOutAmount > 50) {
      riskLevel = "extreme"
    } else if (cashOutDetected && cashOutAmount > 10) {
      riskLevel = "high"
    } else if (totalDeposits > 20 || recentLargeDeposits.length > 0) {
      riskLevel = "medium"
    }

    console.log(`[ExchangeFlow] Found ${recentTransfers.length} exchange transfers, ${exchangesUsed.size} exchanges used`)
    console.log(`[ExchangeFlow] Deposits: ${totalDeposits.toFixed(2)} SOL, Withdrawals: ${totalWithdrawals.toFixed(2)} SOL`)

    return {
      walletAddress,
      totalDeposits,
      totalWithdrawals,
      netFlow,
      recentTransfers: recentTransfers.slice(0, 20), // Limit to 20 most recent
      exchangesUsed: Array.from(exchangesUsed),
      largestDeposit,
      cashOutDetected,
      cashOutAmount,
      riskLevel,
      warnings,
    }
  } catch (error) {
    console.error("[ExchangeFlow] Error:", error)
    return createEmptyAnalysis(walletAddress)
  }
}

function createEmptyAnalysis(walletAddress: string): ExchangeFlowAnalysis {
  return {
    walletAddress,
    totalDeposits: 0,
    totalWithdrawals: 0,
    netFlow: 0,
    recentTransfers: [],
    exchangesUsed: [],
    largestDeposit: null,
    cashOutDetected: false,
    cashOutAmount: 0,
    riskLevel: "low",
    warnings: [],
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 604800)}w ago`
}
