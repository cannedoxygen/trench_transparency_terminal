// Helius API specific types

export interface HeliusEnhancedTransaction {
  signature: string
  timestamp: number
  slot: number
  fee: number
  feePayer: string
  type: string
  source: string
  description: string
  tokenTransfers: HeliusTokenTransfer[]
  nativeTransfers: HeliusNativeTransfer[]
  accountData: HeliusAccountData[]
}

export interface HeliusTokenTransfer {
  fromUserAccount: string
  toUserAccount: string
  fromTokenAccount: string
  toTokenAccount: string
  tokenAmount: number
  mint: string
  tokenStandard: string
}

export interface HeliusNativeTransfer {
  fromUserAccount: string
  toUserAccount: string
  amount: number
}

export interface HeliusAccountData {
  account: string
  nativeBalanceChange: number
  tokenBalanceChanges: HeliusTokenBalanceChange[]
}

export interface HeliusTokenBalanceChange {
  userAccount: string
  tokenAccount: string
  mint: string
  rawTokenAmount: {
    tokenAmount: string
    decimals: number
  }
}

export interface HeliusAsset {
  id: string
  content: {
    metadata: {
      name?: string
      symbol?: string
    }
    links?: {
      image?: string
    }
  }
  token_info?: {
    supply?: number
    decimals?: number
    symbol?: string
  }
}

export interface HeliusSignaturesResponse {
  result: {
    signature: string
    slot: number
    blockTime: number
    err: null | object
  }[]
}
