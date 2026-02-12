import { heliusClient } from "@/lib/helius/client"

export interface AssociatedWallet {
  address: string
  relationship: "funder" | "funder_of_funder" | "funded_by_deployer" | "shared_funder" | "token_deployer"
  amount: number | null // SOL amount if applicable
  timestamp: number | null
  identity: {
    name: string | null
    tags: string[]
    isExchange: boolean
    isMixer: boolean
  } | null
  tokensDeployed: number // Number of tokens this wallet has deployed
  riskFlags: string[]
}

export interface AssociatedWalletsAnalysis {
  deployerAddress: string
  fundingChain: AssociatedWallet[] // Who funded who (up the chain)
  fundedWallets: AssociatedWallet[] // Wallets deployer sent funds to
  relatedDeployers: AssociatedWallet[] // Other wallets that also deployed tokens
  sharedFunderWallets: AssociatedWallet[] // Wallets funded by same source
  totalAssociated: number
  riskLevel: "low" | "medium" | "high" | "extreme"
  warnings: string[]
}

/**
 * Analyze wallets associated with the deployer
 */
export async function analyzeAssociatedWallets(
  deployerAddress: string
): Promise<AssociatedWalletsAnalysis> {
  const warnings: string[] = []
  const fundingChain: AssociatedWallet[] = []
  const fundedWallets: AssociatedWallet[] = []
  const relatedDeployers: AssociatedWallet[] = []
  const sharedFunderWallets: AssociatedWallet[] = []

  console.log(`[AssociatedWallets] Analyzing associations for ${deployerAddress.slice(0, 8)}...`)

  try {
    // Step 1: Get deployer's funder (who funded the deployer?)
    const deployerFundedBy = await heliusClient.getWalletFundedBy(deployerAddress)

    if (deployerFundedBy?.funder) {
      const funderIdentity = await heliusClient.getWalletIdentity(deployerFundedBy.funder)

      const funderWallet: AssociatedWallet = {
        address: deployerFundedBy.funder,
        relationship: "funder",
        amount: deployerFundedBy.amount,
        timestamp: deployerFundedBy.timestamp,
        identity: funderIdentity ? {
          name: funderIdentity.name || deployerFundedBy.funderName || null,
          tags: funderIdentity.tags || [],
          isExchange: funderIdentity.category?.toLowerCase().includes("exchange") || false,
          isMixer: funderIdentity.category?.toLowerCase().includes("mixer") || false,
        } : null,
        tokensDeployed: 0,
        riskFlags: [],
      }

      // Check if funder is a mixer
      if (funderWallet.identity?.isMixer || deployerFundedBy.funderType?.toLowerCase().includes("mixer")) {
        funderWallet.riskFlags.push("Mixer wallet")
        warnings.push("Deployer funded through a mixer")
      }

      fundingChain.push(funderWallet)
      console.log(`[AssociatedWallets] Funder: ${deployerFundedBy.funder.slice(0, 8)}... (${deployerFundedBy.funderName || 'unknown'})`)

      // Step 2: Go up the funding chain - who funded the funder?
      const fundersFundedBy = await heliusClient.getWalletFundedBy(deployerFundedBy.funder)

      if (fundersFundedBy?.funder && fundersFundedBy.funder !== deployerFundedBy.funder) {
        const funder2Identity = await heliusClient.getWalletIdentity(fundersFundedBy.funder)

        const funder2Wallet: AssociatedWallet = {
          address: fundersFundedBy.funder,
          relationship: "funder_of_funder",
          amount: fundersFundedBy.amount,
          timestamp: fundersFundedBy.timestamp,
          identity: funder2Identity ? {
            name: funder2Identity.name || fundersFundedBy.funderName || null,
            tags: funder2Identity.tags || [],
            isExchange: funder2Identity.category?.toLowerCase().includes("exchange") || false,
            isMixer: funder2Identity.category?.toLowerCase().includes("mixer") || false,
          } : null,
          tokensDeployed: 0,
          riskFlags: [],
        }

        if (funder2Wallet.identity?.isMixer) {
          funder2Wallet.riskFlags.push("Mixer in funding chain")
          warnings.push("Funding chain includes a mixer")
        }

        fundingChain.push(funder2Wallet)
        console.log(`[AssociatedWallets] Funder's funder: ${fundersFundedBy.funder.slice(0, 8)}...`)
      }
    }

    // Step 3: Find wallets the deployer sent funds TO
    const deployerTransfers = await heliusClient.getWalletTransfers(deployerAddress, 100)

    if (deployerTransfers.transfers.length > 0) {
      // Get unique outgoing recipients
      const outgoingRecipients = new Map<string, { amount: number; timestamp: number }>()

      for (const transfer of deployerTransfers.transfers) {
        if (transfer.direction === "out" && transfer.counterparty) {
          const existing = outgoingRecipients.get(transfer.counterparty)
          if (!existing || transfer.token.amount > existing.amount) {
            outgoingRecipients.set(transfer.counterparty, {
              amount: transfer.token.amount,
              timestamp: transfer.timestamp,
            })
          }
        }
      }

      // Get identities for top recipients
      const recipientAddresses = Array.from(outgoingRecipients.keys()).slice(0, 10)
      const recipientIdentities = await heliusClient.batchGetIdentities(recipientAddresses)

      for (const [address, data] of Array.from(outgoingRecipients.entries())) {
        if (fundedWallets.length >= 10) break

        const identity = recipientIdentities.get(address)

        fundedWallets.push({
          address,
          relationship: "funded_by_deployer",
          amount: data.amount,
          timestamp: data.timestamp,
          identity: identity ? {
            name: identity.name || null,
            tags: identity.tags || [],
            isExchange: identity.category?.toLowerCase().includes("exchange") || false,
            isMixer: identity.category?.toLowerCase().includes("mixer") || false,
          } : null,
          tokensDeployed: 0,
          riskFlags: [],
        })
      }

      console.log(`[AssociatedWallets] Found ${fundedWallets.length} wallets funded by deployer`)
    }

    // Step 4: Check if any associated wallets also deployed tokens
    // Check the funder and funded wallets for token deployments
    const walletsToCheck = [
      ...fundingChain.map(w => w.address),
      ...fundedWallets.slice(0, 5).map(w => w.address),
    ]

    for (const walletAddress of walletsToCheck) {
      try {
        // Check for token creation transactions
        const walletHistory = await heliusClient.getAddressHistory(walletAddress, 50)

        let tokenCount = 0
        for (const tx of walletHistory) {
          if (tx.type?.toLowerCase().includes("create") ||
              tx.type?.toLowerCase().includes("initialize") ||
              tx.source?.toLowerCase().includes("pump")) {
            tokenCount++
          }
        }

        if (tokenCount > 0) {
          // Find this wallet in our lists and update
          const inFundingChain = fundingChain.find(w => w.address === walletAddress)
          const inFunded = fundedWallets.find(w => w.address === walletAddress)

          if (inFundingChain) {
            inFundingChain.tokensDeployed = tokenCount
            inFundingChain.riskFlags.push(`Also deployed ${tokenCount} token(s)`)
          }
          if (inFunded) {
            inFunded.tokensDeployed = tokenCount
            inFunded.riskFlags.push(`Also deployed ${tokenCount} token(s)`)
          }

          // Add to related deployers list
          const wallet = inFundingChain || inFunded
          if (wallet) {
            relatedDeployers.push({
              ...wallet,
              relationship: "token_deployer",
              tokensDeployed: tokenCount,
            })
          }

          console.log(`[AssociatedWallets] ${walletAddress.slice(0, 8)}... also deployed ${tokenCount} tokens`)
        }
      } catch (error) {
        // Skip if we can't check this wallet
      }
    }

    if (relatedDeployers.length > 0) {
      warnings.push(`${relatedDeployers.length} associated wallet(s) also deployed tokens`)
    }

    // Step 5: Check for wallets funded by the same source (shared funder)
    if (deployerFundedBy?.funder) {
      try {
        const funderOutgoing = await heliusClient.getWalletTransfers(deployerFundedBy.funder, 50)

        const siblingWallets = funderOutgoing.transfers
          .filter(t => t.direction === "out" && t.counterparty !== deployerAddress)
          .slice(0, 5)

        for (const transfer of siblingWallets) {
          if (!transfer.counterparty) continue

          const siblingIdentity = await heliusClient.getWalletIdentity(transfer.counterparty)

          sharedFunderWallets.push({
            address: transfer.counterparty,
            relationship: "shared_funder",
            amount: transfer.token.amount,
            timestamp: transfer.timestamp,
            identity: siblingIdentity ? {
              name: siblingIdentity.name || null,
              tags: siblingIdentity.tags || [],
              isExchange: siblingIdentity.category?.toLowerCase().includes("exchange") || false,
              isMixer: siblingIdentity.category?.toLowerCase().includes("mixer") || false,
            } : null,
            tokensDeployed: 0,
            riskFlags: [],
          })
        }

        if (sharedFunderWallets.length > 0) {
          console.log(`[AssociatedWallets] Found ${sharedFunderWallets.length} wallets with same funder`)
        }
      } catch (error) {
        // Skip if we can't check shared funder
      }
    }

    // Calculate risk level
    let riskLevel: "low" | "medium" | "high" | "extreme" = "low"

    const hasMixerInChain = fundingChain.some(w => w.identity?.isMixer || w.riskFlags.includes("Mixer wallet"))
    const hasRelatedDeployers = relatedDeployers.length > 0
    const manyAssociated = fundedWallets.length + fundingChain.length > 5

    if (hasMixerInChain && hasRelatedDeployers) {
      riskLevel = "extreme"
    } else if (hasMixerInChain || (hasRelatedDeployers && relatedDeployers.some(w => w.tokensDeployed > 3))) {
      riskLevel = "high"
    } else if (hasRelatedDeployers || manyAssociated) {
      riskLevel = "medium"
    }

    const totalAssociated = fundingChain.length + fundedWallets.length + sharedFunderWallets.length

    console.log(`[AssociatedWallets] Total associated: ${totalAssociated}, Risk: ${riskLevel}`)

    return {
      deployerAddress,
      fundingChain,
      fundedWallets,
      relatedDeployers,
      sharedFunderWallets,
      totalAssociated,
      riskLevel,
      warnings,
    }
  } catch (error) {
    console.error("[AssociatedWallets] Error:", error)
    return {
      deployerAddress,
      fundingChain: [],
      fundedWallets: [],
      relatedDeployers: [],
      sharedFunderWallets: [],
      totalAssociated: 0,
      riskLevel: "low",
      warnings: ["Unable to analyze associated wallets"],
    }
  }
}
