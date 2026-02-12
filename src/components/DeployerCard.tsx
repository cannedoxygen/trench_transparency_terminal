"use client"

import { DeployerInfo, WalletIdentity } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { shortenAddress } from "@/lib/utils"
import { ExternalLink, Copy, AlertCircle } from "lucide-react"

interface DeployerCardProps {
  deployer: DeployerInfo
  identity: WalletIdentity | null
  walletAge: number | null // Deployer wallet first activity
  tokenCreatedAt: number | null // Token creation time
}

export function DeployerCard({
  deployer,
  identity,
  walletAge,
  tokenCreatedAt,
}: DeployerCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getConfidenceBadge = () => {
    switch (deployer.confidence) {
      case "high":
        return <Badge variant="low">High Confidence</Badge>
      case "medium":
        return <Badge variant="moderate">Medium Confidence</Badge>
      case "low":
        return <Badge variant="high">Low Confidence</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatAge = (timestamp: number | null) => {
    if (!timestamp) return "Unknown"
    const days = Math.floor((Date.now() / 1000 - timestamp) / 86400)
    if (days === 0) return "Less than 1 day"
    if (days === 1) return "1 day"
    if (days < 30) return `${days} days`
    if (days < 365) return `${Math.floor(days / 30)} months`
    return `${Math.floor(days / 365)} years`
  }

  if (!deployer.address) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Deployer Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <div>
              <div className="font-medium">Deployer Unknown</div>
              <div className="text-sm">
                Could not determine the deployer wallet for this token
              </div>
            </div>
          </div>
          {deployer.evidence.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">Details:</div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {deployer.evidence.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Deployer Analysis</CardTitle>
          {getConfidenceBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deployer Address */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Deployer Wallet
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {shortenAddress(deployer.address, 8)}
            </code>
            <button
              onClick={() => copyToClipboard(deployer.address!)}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Copy address"
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
            <a
              href={`https://solscan.io/account/${deployer.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted rounded transition-colors"
              title="View on Solscan"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Token & Wallet Ages */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Token Age</div>
            <div className="text-sm">{formatAge(tokenCreatedAt)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Wallet Age</div>
            <div className="text-sm">{formatAge(walletAge)}</div>
          </div>
        </div>

        {/* Identity Tags */}
        {identity && identity.tags.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              Identity Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {identity.tags.map((tag, i) => (
                <Badge key={i} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Detection Method */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Detection Method
          </div>
          <div className="text-sm capitalize">
            {deployer.method.replace(/_/g, " ")}
          </div>
        </div>

        {/* Evidence */}
        {deployer.evidence.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground mb-2">Evidence</div>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {deployer.evidence.slice(0, 5).map((e, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span className="break-all">{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
