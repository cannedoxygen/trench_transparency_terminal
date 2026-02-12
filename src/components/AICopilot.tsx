"use client"

import { useState, useRef, useEffect } from "react"
import { AnalysisReport } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AICopilotProps {
  report: AnalysisReport
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  "Should I ape this?",
  "What are the biggest red flags?",
  "Is the deployer trustworthy?",
  "Explain the insider clusters",
  "How risky is this compared to average?",
]

export function AICopilot({ report }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: messageText.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          report,
          history: messages,
        }),
      })

      const data = await response.json()

      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
      } else {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
        ])
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect to the AI. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-accent text-white shadow-lg",
          "hover:bg-accent/90 transition-all",
          "hover:scale-105 active:scale-95"
        )}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-semibold">Ask AI</span>
        <Sparkles className="w-4 h-4" />
      </button>
    )
  }

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl border-accent/20 flex flex-col",
        "transition-all duration-200",
        isExpanded
          ? "bottom-4 right-4 left-4 top-4 md:left-auto md:w-[600px] md:top-4"
          : "bottom-6 right-6 w-[380px] h-[500px]"
      )}
    >
      {/* Header */}
      <CardHeader className="pb-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            TrenchGuard AI
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ask me anything about this token
        </p>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="bg-muted rounded-lg rounded-tl-none p-3 text-sm">
                <p>
                  Hey! I&apos;ve analyzed <strong>{report.metadata?.name || "this token"}</strong> and I&apos;m ready to answer your questions.
                </p>
                <p className="mt-2 text-muted-foreground">
                  Risk Score: <span className={cn(
                    "font-semibold",
                    report.riskScore.label === "extreme" ? "text-risk-extreme" :
                    report.riskScore.label === "high" ? "text-risk-high" :
                    report.riskScore.label === "moderate" ? "text-risk-moderate" :
                    "text-risk-low"
                  )}>{report.riskScore.score}/100 ({report.riskScore.label})</span>
                </p>
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">
                Quick questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSuggestedQuestion(question)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full",
                      "bg-accent/10 text-accent hover:bg-accent/20",
                      "transition-colors"
                    )}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === "user"
                      ? "bg-foreground/10"
                      : "bg-accent/10"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-accent" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-lg p-3 text-sm max-w-[80%]",
                    message.role === "user"
                      ? "bg-accent text-white rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this token..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-accent hover:bg-accent/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  )
}
