// Risk score types
export type RiskLabel = "low" | "moderate" | "high" | "extreme"

export interface RiskScore {
  score: number
  label: RiskLabel
  reasons: string[]
  unknowns: string[]
}

// Deployer types
export interface DeployerInfo {
  address: string | null
  confidence: "high" | "medium" | "low" | "unknown"
  method: string
  evidence: string[]
}

// Funding types
export type FundingSourceType =
  | "mixer"
  | "bridge"
  | "exchange"
  | "unknown"
  | "direct"

export interface FundingInfo {
  sourceType: FundingSourceType
  sourceAddress: string | null
  taggedEntity: string | null
  confidence: "high" | "medium" | "low"
  timestamp: number | null
}

// Transfer types
export interface Transfer {
  signature: string
  timestamp: number
  type: "send" | "receive"
  amount: number
  counterparty: string
  counterpartyTag: string | null
  isToken?: boolean
  tokenSymbol?: string
}

// Identity types
export interface WalletIdentity {
  address: string
  tags: string[]
  isExchange: boolean
  isMixer: boolean
  isBridge: boolean
  label: string | null
}

// Token metadata
export interface TokenMetadata {
  mint: string
  name: string | null
  symbol: string | null
  decimals: number
  supply: string | null
  image: string | null
}

// Deployer history
export interface DeployedToken {
  mint: string
  name: string | null
  symbol: string | null
  deployedAt: number
  isRugged: boolean
  rugIndicators: string[]
  currentStatus: "active" | "dead" | "unknown"
}

export interface DeployerHistory {
  totalTokens: number
  ruggedTokens: number
  rugRate: number
  tokens: DeployedToken[]
  riskLevel: "low" | "medium" | "high" | "extreme"
}

// Holder analysis
export interface TokenHolder {
  address: string
  percentage: number
  isDeployer: boolean
  isSniper: boolean
  isInsider: boolean
  identity: string | null
  riskFlags: string[]
}

export interface HolderAnalysis {
  totalHolders: number
  topHolders: TokenHolder[]
  sniperCount: number
  insiderCount: number
  top10Concentration: number
  deployerHolding: number
  exchangeHoldings: number
  warnings: string[]
  riskLevel: "low" | "medium" | "high" | "extreme"
}

// Associated Wallets
export interface AssociatedWallet {
  address: string
  relationship: "funder" | "funder_of_funder" | "funded_by_deployer" | "shared_funder" | "token_deployer"
  amount: number | null
  timestamp: number | null
  identity: {
    name: string | null
    tags: string[]
    isExchange: boolean
    isMixer: boolean
  } | null
  tokensDeployed: number
  riskFlags: string[]
}

export interface AssociatedWalletsAnalysis {
  deployerAddress: string
  fundingChain: AssociatedWallet[]
  fundedWallets: AssociatedWallet[]
  relatedDeployers: AssociatedWallet[]
  sharedFunderWallets: AssociatedWallet[]
  totalAssociated: number
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

// Exchange Flow
export interface ExchangeTransfer {
  signature: string
  timestamp: number
  direction: "deposit" | "withdrawal"
  exchange: string
  amount: number
  token: string
  counterparty: string
}

export interface ExchangeFlowAnalysis {
  walletAddress: string
  totalDeposits: number
  totalWithdrawals: number
  netFlow: number
  recentTransfers: ExchangeTransfer[]
  exchangesUsed: string[]
  largestDeposit: ExchangeTransfer | null
  cashOutDetected: boolean
  cashOutAmount: number
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

// AI Summary
export interface AISummary {
  verdict: "safe" | "caution" | "danger" | "extreme_danger"
  headline: string
  summary: string
  keyPoints: string[]
  recommendation: string
}

// Deployer Personality Profile
export interface TimingPattern {
  avgDaysBetweenLaunches: number | null
  preferredDayOfWeek: string | null
  preferredTimeOfDay: string | null
  launchFrequency: "rapid" | "regular" | "occasional" | "rare" | "unknown"
}

export interface LiquidityPattern {
  typicalLiquidityRemovalSpeed: "immediate" | "fast" | "gradual" | "holds" | "unknown"
  avgTimeToFirstSell: number | null
  sellPatternDescription: string | null
}

export interface NamingPattern {
  usesMemeCoinNames: boolean
  usesTrendyKeywords: boolean
  commonThemes: string[]
  namingStyle: "meme" | "professional" | "generic" | "trendy" | "mixed"
}

export interface BehaviorMetrics {
  avgTokenLifespanDays: number | null
  longestSurvivingToken: { name: string; days: number } | null
  shortestLivedToken: { name: string; days: number } | null
  percentTokensDead: number
  totalValueExtracted: number | null
}

export interface DeployerPersonality {
  deployerAddress: string
  profileType: "serial_rugger" | "pump_and_dumper" | "legitimate" | "unknown" | "new_deployer"
  confidence: "high" | "medium" | "low"
  timing: TimingPattern
  liquidity: LiquidityPattern
  naming: NamingPattern
  behavior: BehaviorMetrics
  riskIndicators: string[]
  positiveIndicators: string[]
  personalitySummary: string
  riskLevel: "low" | "medium" | "high" | "extreme"
}

// Insider Cluster Detection
export interface InsiderWallet {
  address: string
  holding: number
  buyTimestamp: number | null
  fundingSource: string | null
  clusterId: number
  clusterRole: "leader" | "member"
  riskFlags: string[]
  identity: {
    name: string | null
    isExchange: boolean
  } | null
}

export interface InsiderCluster {
  id: number
  name: string
  type: "same_funder" | "coordinated_buy" | "fund_network" | "mixed"
  wallets: InsiderWallet[]
  totalHolding: number
  commonFunder: string | null
  avgBuyTime: number | null
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

export interface InsiderAnalysis {
  tokenMint: string
  totalInsiders: number
  totalInsiderHolding: number
  clusters: InsiderCluster[]
  coordinationScore: number
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

// Full analysis report
export interface AnalysisReport {
  mint: string
  timestamp: number
  deployer: DeployerInfo
  funding: FundingInfo
  identity: WalletIdentity | null
  riskScore: RiskScore
  recentTransfers: Transfer[]
  metadata: TokenMetadata | null
  walletAge: number | null // Deployer wallet's first activity
  tokenCreatedAt: number | null // Token's creation timestamp
  fundToDeployTime: number | null
  // New fields
  deployerHistory: DeployerHistory | null
  holderAnalysis: HolderAnalysis | null
  associatedWallets: AssociatedWalletsAnalysis | null
  exchangeFlows: ExchangeFlowAnalysis | null
  deployerPersonality: DeployerPersonality | null
  insiderAnalysis: InsiderAnalysis | null
  aiSummary: AISummary | null
}

// API response types
export interface AnalyzeResponse {
  success: boolean
  data?: AnalysisReport
  error?: string
  cached?: boolean
}

// Helius API response types
export interface HeliusIdentityResponse {
  identity?: {
    name?: string
    twitter?: string
    discord?: string
  }
  tags?: string[]
}

export interface HeliusFundedByResponse {
  funder?: string
  funderType?: string
  timestamp?: number
  amount?: number
}

export interface HeliusTransfer {
  signature: string
  timestamp: number
  type: string
  amount: number
  from: string
  to: string
  token?: string
}

export interface HeliusTransfersResponse {
  transfers: HeliusTransfer[]
  hasMore: boolean
}
