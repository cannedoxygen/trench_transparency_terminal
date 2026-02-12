"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RiskScore } from "@/types"
import { Copy, Check, Share2, Twitter } from "lucide-react"

interface SharePanelProps {
  mint: string
  riskScore: RiskScore
  tokenName?: string | null
}

export function SharePanel({ mint, riskScore, tokenName }: SharePanelProps) {
  const [copied, setCopied] = useState(false)
  const [reportUrl, setReportUrl] = useState(`/t/${mint}`)

  useEffect(() => {
    setReportUrl(`${window.location.origin}/t/${mint}`)
  }, [mint])

  const shareText = `${tokenName || "Token"} Risk Analysis: ${riskScore.score}/100 (${riskScore.label.toUpperCase()})

${riskScore.reasons.slice(0, 3).map((r) => `• ${r.split("(")[0].trim()}`).join("\n")}

Full report: ${reportUrl}

via Trench Terminal`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(shareText)
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copy Link */}
        <div>
          <div className="text-sm text-muted-foreground mb-2">Report Link</div>
          <div className="flex gap-2">
            <code className="flex-1 text-sm bg-muted px-3 py-2 rounded truncate">
              {reportUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTwitterShare}
            className="flex items-center gap-2"
          >
            <Twitter className="w-4 h-4" />
            Share on X
          </Button>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground mb-2">Preview</div>
          <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-words">
            {shareText}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
