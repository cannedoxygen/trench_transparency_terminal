import {
  HeliusEnhancedTransaction,
  HeliusAsset,
  HeliusSignaturesResponse,
} from "./types"

const HELIUS_API_KEY = process.env.HELIUS_API_KEY
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const HELIUS_ENHANCED_API_URL = "https://api-mainnet.helius-rpc.com" // For parse transactions
const HELIUS_WALLET_API_URL = "https://api.helius.xyz" // For wallet identity, funded-by, etc.

if (!HELIUS_API_KEY && process.env.NODE_ENV === "production") {
  console.warn("HELIUS_API_KEY is not set")
}

// ===========================================
// WALLET API TYPES
// ===========================================

export interface WalletIdentityResponse {
  address: string
  type?: string
  name?: string
  category?: string
  tags?: string[]
}

export interface WalletFundedByResponse {
  funder: string
  funderName?: string
  funderType?: string
  amount: number
  signature: string
  timestamp: number
  explorerUrl?: string
}

export interface WalletTransfer {
  signature: string
  timestamp: number
  direction: "in" | "out"
  counterparty: string
  counterpartyName?: string
  token: {
    mint: string
    symbol?: string
    amount: number
    amountRaw: string
    decimals: number
  }
}

export interface WalletTransfersResponse {
  transfers: WalletTransfer[]
  cursor?: string
  hasMore: boolean
}

export interface WalletBalance {
  mint: string
  symbol?: string
  name?: string
  amount: number
  amountRaw: string
  decimals: number
  usdValue?: number
  imageUrl?: string
}

export interface WalletBalancesResponse {
  nativeBalance: number
  tokens: WalletBalance[]
  nfts: WalletBalance[]
}

// ===========================================
// HELIUS CLIENT
// ===========================================

export class HeliusClient {
  private apiKey: string
  private rpcUrl: string
  private enhancedApiUrl: string
  private walletApiUrl: string

  constructor() {
    this.apiKey = HELIUS_API_KEY || ""
    this.rpcUrl = HELIUS_RPC_URL
    this.enhancedApiUrl = HELIUS_ENHANCED_API_URL
    this.walletApiUrl = HELIUS_WALLET_API_URL
  }

  // ===========================================
  // WALLET API ENDPOINTS (NEW - PROPER API)
  // ===========================================

  /**
   * Get wallet identity - tags, name, category (exchange, protocol, scammer, etc)
   * Uses Orb's database of 5100+ tagged accounts
   */
  async getWalletIdentity(address: string): Promise<WalletIdentityResponse | null> {
    try {
      const response = await fetch(
        `${this.walletApiUrl}/v1/wallet/${address}/identity?api-key=${this.apiKey}`
      )

      if (response.status === 404) {
        // Unknown wallet - not in database
        return null
      }

      if (!response.ok) {
        console.error("Identity API error:", response.statusText)
        return null
      }

      return response.json()
    } catch (error) {
      console.error("Error fetching wallet identity:", error)
      return null
    }
  }

  /**
   * Get wallet funding source - who originally funded this wallet
   * Detects exchanges, mixers, bridges, etc.
   */
  async getWalletFundedBy(address: string): Promise<WalletFundedByResponse | null> {
    try {
      const response = await fetch(
        `${this.walletApiUrl}/v1/wallet/${address}/funded-by?api-key=${this.apiKey}`
      )

      if (response.status === 404) {
        // No funding record found
        return null
      }

      if (!response.ok) {
        console.error("Funded-by API error:", response.statusText)
        return null
      }

      return response.json()
    } catch (error) {
      console.error("Error fetching wallet funded-by:", error)
      return null
    }
  }

  /**
   * Get wallet transfers - all token transfers with counterparty info
   */
  async getWalletTransfers(
    address: string,
    limit: number = 50,
    cursor?: string
  ): Promise<WalletTransfersResponse> {
    try {
      let url = `${this.walletApiUrl}/v1/wallet/${address}/transfers?api-key=${this.apiKey}&limit=${limit}`
      if (cursor) url += `&cursor=${cursor}`

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        // Wallet API might be down, this is beta
        console.warn("Transfers API unavailable:", response.status, response.statusText)
        return { transfers: [], hasMore: false }
      }

      const data = await response.json()
      return {
        transfers: data.transfers || data || [],
        cursor: data.cursor || data.nextCursor,
        hasMore: !!(data.cursor || data.nextCursor),
      }
    } catch (error) {
      console.warn("Transfers API error (beta API may be unavailable):", error)
      return { transfers: [], hasMore: false }
    }
  }

  /**
   * Get wallet balances - all tokens and NFTs with USD values
   */
  async getWalletBalances(address: string): Promise<WalletBalancesResponse | null> {
    try {
      const response = await fetch(
        `${this.walletApiUrl}/v1/wallet/${address}/balances?api-key=${this.apiKey}`
      )

      if (!response.ok) {
        console.error("Balances API error:", response.statusText)
        return null
      }

      return response.json()
    } catch (error) {
      console.error("Error fetching wallet balances:", error)
      return null
    }
  }

  /**
   * Batch identity lookup - up to 100 addresses at once
   */
  async batchGetIdentities(addresses: string[]): Promise<Map<string, WalletIdentityResponse>> {
    const results = new Map<string, WalletIdentityResponse>()

    try {
      const response = await fetch(
        `${this.walletApiUrl}/v1/wallet/batch-identity?api-key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: addresses.slice(0, 100) }),
        }
      )

      if (!response.ok) {
        console.error("Batch identity API error:", response.statusText)
        return results
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        for (const identity of data) {
          if (identity.address) {
            results.set(identity.address, identity)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching batch identities:", error)
    }

    return results
  }

  // ===========================================
  // RPC METHODS (for things Wallet API doesn't cover)
  // ===========================================

  private async rpcCall<T>(method: string, params: unknown[]): Promise<T> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    })

    if (!response.ok) {
      throw new Error(`Helius RPC error: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(`Helius RPC error: ${data.error.message}`)
    }

    return data.result
  }

  async getSignaturesForAddress(
    address: string,
    limit: number = 100
  ): Promise<HeliusSignaturesResponse["result"]> {
    return this.rpcCall<HeliusSignaturesResponse["result"]>(
      "getSignaturesForAddress",
      [address, { limit }]
    )
  }

  async parseTransactions(signatures: string[]): Promise<HeliusEnhancedTransaction[]> {
    const url = `${this.enhancedApiUrl}/v0/transactions?api-key=${this.apiKey}`

    // Batch in chunks of 20 to avoid API limits
    const BATCH_SIZE = 20
    const results: HeliusEnhancedTransaction[] = []

    for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
      const batch = signatures.slice(i, i + BATCH_SIZE)

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: batch }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[Helius] Parse error for batch ${i / BATCH_SIZE}: ${response.status} ${errorText}`)
          continue // Skip this batch but continue with others
        }

        const parsed = await response.json()
        if (Array.isArray(parsed)) {
          results.push(...parsed)
        }
      } catch (error) {
        console.error(`[Helius] Parse batch ${i / BATCH_SIZE} failed:`, error)
      }
    }

    return results
  }

  async getAsset(mint: string): Promise<HeliusAsset | null> {
    try {
      const result = await this.rpcCall<HeliusAsset>("getAsset", [mint])
      return result
    } catch {
      return null
    }
  }

  async getAddressHistory(
    address: string,
    limit: number = 50
  ): Promise<HeliusEnhancedTransaction[]> {
    const signatures = await this.getSignaturesForAddress(address, limit)

    if (!signatures || signatures.length === 0) {
      return []
    }

    const signatureStrings = signatures.map((s) => s.signature)
    return this.parseTransactions(signatureStrings)
  }

  /**
   * Get all token accounts (holders) for a mint with pagination
   * Returns: { holders, totalHolders }
   */
  async getTokenAccounts(mint: string, maxPages: number = 10): Promise<{
    holders: { address: string; amount: number }[];
    totalHolders: number;
  }> {
    const allHolders: { address: string; amount: number }[] = []
    let page = 1
    let totalHolders = 0

    try {
      while (page <= maxPages) {
        console.log(`[Helius] Fetching token accounts page ${page} for ${mint}`)

        const response = await fetch(this.rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "helius-holders",
            method: "getTokenAccounts",
            params: {
              mint: mint,
              page: page,
              limit: 1000,
              displayOptions: {},
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Token accounts API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(`Token accounts RPC error: ${data.error.message}`)
        }

        const accounts = data.result?.token_accounts || []
        totalHolders = data.result?.total || totalHolders

        console.log(`[Helius] Page ${page}: got ${accounts.length} accounts, total: ${totalHolders}`)

        if (accounts.length === 0) {
          console.log(`[Helius] No more accounts on page ${page}`)
          break
        }

        // Add to our collection
        for (const acc of accounts) {
          allHolders.push({
            address: acc.owner,
            amount: acc.amount || 0,
          })
        }

        // If we got less than 1000, we've reached the end
        if (accounts.length < 1000) {
          break
        }

        page++
      }

      console.log(`[Helius] Total fetched: ${allHolders.length} holders across ${page} pages`)

      // Sort by amount descending to get top holders
      allHolders.sort((a, b) => b.amount - a.amount)

      return {
        holders: allHolders,
        totalHolders: totalHolders || allHolders.length,
      }
    } catch (error) {
      console.error("Error fetching token accounts:", error)
      throw error
    }
  }

  async getFirstTransaction(address: string): Promise<HeliusEnhancedTransaction | null> {
    try {
      let oldestSignature: string | null = null
      let oldestTimestamp: number = Infinity
      let before: string | undefined = undefined
      let iterations = 0
      const maxIterations = 50 // Support up to 50k transactions
      let totalSigsFetched = 0

      console.log(`[Helius] Finding first tx for ${address.slice(0, 8)}...`)

      while (iterations < maxIterations) {
        const params: { limit: number; before?: string } = { limit: 1000 }
        if (before) params.before = before

        const signatures = await this.rpcCall<HeliusSignaturesResponse["result"]>(
          "getSignaturesForAddress",
          [address, params]
        )

        if (!signatures || signatures.length === 0) {
          console.log(`[Helius] No more signatures after ${totalSigsFetched} total`)
          break
        }

        totalSigsFetched += signatures.length

        const lastSig = signatures[signatures.length - 1]
        if (lastSig.blockTime && lastSig.blockTime < oldestTimestamp) {
          oldestTimestamp = lastSig.blockTime
          oldestSignature = lastSig.signature
        }

        if (signatures.length < 1000) {
          console.log(`[Helius] Reached end at ${totalSigsFetched} signatures`)
          break
        }

        before = lastSig.signature
        iterations++

        // Log progress every 10 iterations
        if (iterations % 10 === 0) {
          const oldestDate = new Date(oldestTimestamp * 1000).toISOString().split('T')[0]
          console.log(`[Helius] Iteration ${iterations}: ${totalSigsFetched} sigs, oldest so far: ${oldestDate}`)
        }
      }

      if (iterations >= maxIterations) {
        console.log(`[Helius] Hit max iterations (${maxIterations}), may not have reached oldest tx`)
      }

      if (!oldestSignature) {
        console.log(`[Helius] No oldest signature found`)
        return null
      }

      const oldestDate = new Date(oldestTimestamp * 1000).toISOString()
      console.log(`[Helius] Oldest tx: ${oldestDate} (${totalSigsFetched} total signatures)`)

      const transactions = await this.parseTransactions([oldestSignature])
      return transactions[0] || null
    } catch (error) {
      console.error("[Helius] Error getting first transaction:", error)
      return null
    }
  }
}

export const heliusClient = new HeliusClient()
