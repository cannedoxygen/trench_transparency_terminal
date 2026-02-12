import { heliusClient } from "@/lib/helius/client"
import { DeployerInfo } from "@/types"
import { HeliusEnhancedTransaction } from "@/lib/helius/types"

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

interface ResolverResult extends DeployerInfo {
  firstTxTimestamp: number | null
}

export async function resolveDeployer(mint: string): Promise<ResolverResult> {
  const evidence: string[] = []
  let deployerAddress: string | null = null
  let confidence: "high" | "medium" | "low" | "unknown" = "unknown"
  let method = "unknown"
  let firstTxTimestamp: number | null = null

  try {
    // Get the FIRST transaction for the mint (token creation)
    console.log(`[Resolver] Finding first tx for mint: ${mint}`)
    const firstTx = await heliusClient.getFirstTransaction(mint)

    if (firstTx) {
      firstTxTimestamp = firstTx.timestamp
      console.log(`[Resolver] First tx found:`)
      console.log(`  - Timestamp: ${new Date(firstTx.timestamp * 1000).toISOString()}`)
      console.log(`  - Type: ${firstTx.type}`)
      console.log(`  - Source: ${firstTx.source}`)
      console.log(`  - Fee Payer: ${firstTx.feePayer}`)
      console.log(`  - Signature: ${firstTx.signature}`)

      const deployerResult = analyzeTransaction(firstTx, mint)

      if (deployerResult.deployer) {
        return {
          address: deployerResult.deployer,
          confidence: deployerResult.confidence,
          method: deployerResult.method,
          evidence: deployerResult.evidence,
          firstTxTimestamp,
        }
      }

      // Fallback to fee payer
      if (firstTx.feePayer) {
        return {
          address: firstTx.feePayer,
          confidence: "medium",
          method: "fee_payer_from_first_tx",
          evidence: [`Fee payer from token's first transaction: ${firstTx.feePayer}`],
          firstTxTimestamp,
        }
      }
    }

    // Fallback: Get recent transaction history
    const transactions = await heliusClient.getAddressHistory(mint, 100)

    if (!transactions || transactions.length === 0) {
      return {
        address: null,
        confidence: "unknown",
        method: "no_transactions_found",
        evidence: ["No transaction history found for this mint"],
        firstTxTimestamp: null,
      }
    }

    // Sort by timestamp to find the earliest transaction
    const sortedTxs = [...transactions].sort(
      (a, b) => a.timestamp - b.timestamp
    )

    const oldestTx = sortedTxs[0]
    firstTxTimestamp = oldestTx.timestamp

    // Try to identify the deployer from the first transaction
    const deployerResult = analyzeTransaction(oldestTx, mint)

    if (deployerResult.deployer) {
      deployerAddress = deployerResult.deployer
      confidence = deployerResult.confidence
      method = deployerResult.method
      evidence.push(...deployerResult.evidence)
    }

    // If we couldn't find a deployer, use the fee payer as fallback
    if (!deployerAddress && oldestTx.feePayer) {
      deployerAddress = oldestTx.feePayer
      confidence = "low"
      method = "fee_payer_fallback"
      evidence.push("Using fee payer from first transaction as deployer candidate")
    }

    return {
      address: deployerAddress,
      confidence,
      method,
      evidence,
      firstTxTimestamp,
    }
  } catch (error) {
    console.error("Error resolving deployer:", error)
    return {
      address: null,
      confidence: "unknown",
      method: "error",
      evidence: [
        "Error occurred while resolving deployer",
        error instanceof Error ? error.message : "Unknown error",
      ],
      firstTxTimestamp: null,
    }
  }
}

function analyzeTransaction(
  tx: HeliusEnhancedTransaction,
  mint: string
): {
  deployer: string | null
  confidence: "high" | "medium" | "low"
  method: string
  evidence: string[]
} {
  const evidence: string[] = []
  let deployer: string | null = null
  let confidence: "high" | "medium" | "low" = "low"
  let method = "unknown"

  // Check transaction type
  const txType = tx.type?.toLowerCase() || ""
  const txSource = tx.source?.toLowerCase() || ""

  // Check if this is a token creation transaction
  if (
    txType.includes("create") ||
    txType.includes("initialize") ||
    txType.includes("mint")
  ) {
    // The fee payer is likely the deployer
    deployer = tx.feePayer
    confidence = "high"
    method = "token_creation_detected"
    evidence.push(`Transaction type: ${tx.type}`)
    evidence.push(`Fee payer: ${tx.feePayer}`)
  }

  // Check if this involves Token Program
  const involvesTokenProgram = tx.accountData?.some(
    (acc) =>
      acc.account === TOKEN_PROGRAM_ID || acc.account === TOKEN_2022_PROGRAM_ID
  )

  if (involvesTokenProgram && !deployer) {
    deployer = tx.feePayer
    confidence = "medium"
    method = "token_program_interaction"
    evidence.push("Transaction involves Token Program")
    evidence.push(`Fee payer: ${tx.feePayer}`)
  }

  // Check token transfers in the transaction
  if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
    const mintTransfer = tx.tokenTransfers.find((t) => t.mint === mint)
    if (mintTransfer) {
      // The sender in the first transfer is likely related to deployer
      if (
        mintTransfer.fromUserAccount &&
        mintTransfer.fromUserAccount !== "unknown"
      ) {
        if (!deployer) {
          deployer = mintTransfer.fromUserAccount
          confidence = "medium"
          method = "first_transfer_sender"
        }
        evidence.push(`First token transfer from: ${mintTransfer.fromUserAccount}`)
      }
    }
  }

  // Check native transfers for initial funding
  if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
    const firstNative = tx.nativeTransfers[0]
    if (firstNative.fromUserAccount) {
      evidence.push(
        `Initial SOL transfer from: ${firstNative.fromUserAccount} (${firstNative.amount / 1e9} SOL)`
      )
    }
  }

  // If we still don't have a deployer, use fee payer
  if (!deployer && tx.feePayer) {
    deployer = tx.feePayer
    confidence = "low"
    method = "fee_payer"
    evidence.push(`Using fee payer as deployer: ${tx.feePayer}`)
  }

  // Add source information
  if (txSource) {
    evidence.push(`Transaction source: ${txSource}`)
  }

  return { deployer, confidence, method, evidence }
}

export async function getWalletAge(address: string): Promise<number | null> {
  try {
    const firstTx = await heliusClient.getFirstTransaction(address)
    if (firstTx) {
      return firstTx.timestamp
    }
    return null
  } catch {
    return null
  }
}

export async function getWalletTransactionCount(
  address: string
): Promise<number> {
  try {
    const signatures = await heliusClient.getSignaturesForAddress(address, 1000)
    return signatures?.length || 0
  } catch {
    return 0
  }
}
