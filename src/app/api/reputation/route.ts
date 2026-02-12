import { NextRequest, NextResponse } from "next/server"
import { calculateWalletReputation, WalletReputation } from "@/lib/reputation/scorer"
import { isValidSolanaAddress } from "@/lib/utils"

interface ReputationResponse {
  success: boolean
  data?: WalletReputation
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ReputationResponse>> {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json(
      { success: false, error: "Missing address parameter" },
      { status: 400 }
    )
  }

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json(
      { success: false, error: "Invalid Solana address" },
      { status: 400 }
    )
  }

  try {
    const reputation = await calculateWalletReputation(address)
    return NextResponse.json({ success: true, data: reputation })
  } catch (error) {
    console.error("Reputation API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to calculate reputation" },
      { status: 500 }
    )
  }
}
