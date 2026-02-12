"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidSolanaAddress } from "@/lib/utils"

export function TokenInput() {
  const [mint, setMint] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedMint = mint.trim()

    if (!trimmedMint) {
      setError("Please enter a token mint address")
      return
    }

    if (!isValidSolanaAddress(trimmedMint)) {
      setError("Invalid Solana address format")
      return
    }

    setIsLoading(true)
    router.push(`/t/${trimmedMint}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Paste token mint address..."
          value={mint}
          onChange={(e) => {
            setMint(e.target.value)
            setError(null)
          }}
          className="flex-1 h-12 text-base px-4 bg-card border-border"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 px-8 text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Analyze"}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </form>
  )
}

export function ExampleTokens() {
  const router = useRouter()

  const examples = [
    {
      name: "BONK",
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    },
    {
      name: "WIF",
      mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    },
    {
      name: "POPCAT",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      <span className="text-muted-foreground text-sm">Try:</span>
      {examples.map((token) => (
        <button
          key={token.mint}
          onClick={() => router.push(`/t/${token.mint}`)}
          className="text-sm text-accent hover:text-accent/80 hover:underline transition-colors"
        >
          {token.name}
        </button>
      ))}
    </div>
  )
}
