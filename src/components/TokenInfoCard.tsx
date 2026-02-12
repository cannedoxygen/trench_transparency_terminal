"use client"

import { TokenMetadata } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { shortenAddress } from "@/lib/utils"
import { ExternalLink, Copy } from "lucide-react"

interface TokenInfoCardProps {
  mint: string
  metadata: TokenMetadata | null
}

export function TokenInfoCard({ mint, metadata }: TokenInfoCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Token Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Name & Symbol */}
        <div className="flex items-center gap-4">
          {metadata?.image && (
            <img
              src={metadata.image}
              alt={metadata.name || "Token"}
              className="w-12 h-12 rounded-full bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
          )}
          <div>
            <div className="font-semibold">
              {metadata?.name || "Unknown Token"}
            </div>
            {metadata?.symbol && (
              <div className="text-sm text-muted-foreground">
                ${metadata.symbol}
              </div>
            )}
          </div>
        </div>

        {/* Mint Address */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">Mint Address</div>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {shortenAddress(mint, 8)}
            </code>
            <button
              onClick={() => copyToClipboard(mint)}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Copy address"
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
            <a
              href={`https://solscan.io/token/${mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted rounded transition-colors"
              title="View on Solscan"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Additional Info */}
        {metadata?.supply && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Supply</div>
            <div className="text-sm">
              {Number(metadata.supply).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
