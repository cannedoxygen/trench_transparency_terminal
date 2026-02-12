"use client"

import { useState } from "react"
import { Transfer } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { shortenAddress, formatTimeAgo } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"

interface TransfersTableProps {
  transfers: Transfer[]
  deployerAddress: string | null
}

const PAGE_SIZE = 5

export function TransfersTable({
  transfers,
  deployerAddress,
}: TransfersTableProps) {
  const [page, setPage] = useState(0)

  if (!transfers || transfers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent transfer activity found
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalPages = Math.ceil(transfers.length / PAGE_SIZE)
  const startIndex = page * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const currentTransfers = transfers.slice(startIndex, endIndex)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <span className="text-sm text-muted-foreground">
            {transfers.length} transactions
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransfers.map((transfer) => (
                <TableRow key={transfer.signature}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transfer.type === "send" ? (
                        <ArrowUpRight className="w-4 h-4 text-risk-high" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-risk-low" />
                      )}
                      <Badge
                        variant={
                          transfer.type === "send" ? "high" : "low"
                        }
                      >
                        {transfer.type === "send" ? "Out" : "In"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {transfer.isToken
                        ? `${transfer.amount.toLocaleString()} ${transfer.tokenSymbol || "tokens"}`
                        : `${transfer.amount.toFixed(4)} SOL`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <code className="text-xs">
                        {shortenAddress(transfer.counterparty, 4)}
                      </code>
                      {transfer.counterpartyTag && (
                        <span className="text-xs text-muted-foreground">
                          {transfer.counterpartyTag}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatTimeAgo(transfer.timestamp)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://solscan.io/tx/${transfer.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-muted rounded transition-colors inline-flex"
                      title="View transaction"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {deployerAddress && (
          <div className="mt-4 pt-4 border-t border-border">
            <a
              href={`https://solscan.io/account/${deployerAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              View full transaction history on Solscan →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
