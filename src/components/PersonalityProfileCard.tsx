"use client"

import { DeployerPersonality } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Sparkles,
  Calendar,
  Skull,
  Target,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PersonalityProfileCardProps {
  personality: DeployerPersonality | null
}

export function PersonalityProfileCard({ personality }: PersonalityProfileCardProps) {
  if (!personality) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Deployer Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to build deployer profile.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getProfileConfig = () => {
    switch (personality.profileType) {
      case "serial_rugger":
        return {
          icon: Skull,
          label: "Serial Rugger",
          color: "text-risk-extreme",
          bgColor: "bg-risk-extreme/10",
          borderColor: "border-risk-extreme/30",
          description: "High-frequency rug puller",
        }
      case "pump_and_dumper":
        return {
          icon: TrendingDown,
          label: "Pump & Dumper",
          color: "text-risk-high",
          bgColor: "bg-risk-high/10",
          borderColor: "border-risk-high/30",
          description: "Creates hype then exits",
        }
      case "legitimate":
        return {
          icon: CheckCircle,
          label: "Legitimate",
          color: "text-risk-low",
          bgColor: "bg-risk-low/10",
          borderColor: "border-risk-low/30",
          description: "Shows legitimate patterns",
        }
      case "new_deployer":
        return {
          icon: Sparkles,
          label: "New Deployer",
          color: "text-risk-moderate",
          bgColor: "bg-risk-moderate/10",
          borderColor: "border-risk-moderate/30",
          description: "Limited history available",
        }
      default:
        return {
          icon: HelpCircle,
          label: "Unknown",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
          borderColor: "border-border",
          description: "Unable to determine pattern",
        }
    }
  }

  const config = getProfileConfig()
  const ProfileIcon = config.icon

  const getRiskBadgeVariant = () => {
    switch (personality.riskLevel) {
      case "extreme": return "extreme" as const
      case "high": return "high" as const
      case "medium": return "moderate" as const
      default: return "low" as const
    }
  }

  const getFrequencyLabel = () => {
    switch (personality.timing.launchFrequency) {
      case "rapid": return "Rapid (< daily)"
      case "regular": return "Regular (weekly)"
      case "occasional": return "Occasional (monthly)"
      case "rare": return "Rare"
      default: return "Unknown"
    }
  }

  const getLiquidityLabel = () => {
    switch (personality.liquidity.typicalLiquidityRemovalSpeed) {
      case "immediate": return "Immediate exit"
      case "fast": return "Fast exit (1-2 days)"
      case "gradual": return "Gradual selling"
      case "holds": return "Tends to hold"
      default: return "Unknown"
    }
  }

  return (
    <Card className={cn("border", personality.riskLevel !== "low" ? config.borderColor : "")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Deployer Profile
          </CardTitle>
          <Badge variant={getRiskBadgeVariant()}>
            {personality.riskLevel.toUpperCase()} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Type */}
        <div className={cn("p-4 rounded-lg", config.bgColor)}>
          <div className="flex items-center gap-3 mb-2">
            <ProfileIcon className={cn("w-8 h-8", config.color)} />
            <div>
              <h3 className={cn("font-bold text-lg", config.color)}>
                {config.label}
              </h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <p className="text-sm mt-3">{personality.personalitySummary}</p>
          <div className="text-xs text-muted-foreground mt-2">
            Confidence: {personality.confidence}
          </div>
        </div>

        {/* Behavioral Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Launch Frequency */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Launch Frequency</span>
            </div>
            <div className={cn(
              "font-semibold text-sm",
              personality.timing.launchFrequency === "rapid" ? "text-risk-high" : ""
            )}>
              {getFrequencyLabel()}
            </div>
          </div>

          {/* Exit Pattern */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs">Exit Pattern</span>
            </div>
            <div className={cn(
              "font-semibold text-sm",
              personality.liquidity.typicalLiquidityRemovalSpeed === "immediate" ? "text-risk-high" : ""
            )}>
              {getLiquidityLabel()}
            </div>
          </div>

          {/* Naming Style */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">Naming Style</span>
            </div>
            <div className="font-semibold text-sm capitalize">
              {personality.naming.namingStyle}
            </div>
          </div>

          {/* Token Mortality */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Skull className="w-4 h-4" />
              <span className="text-xs">Token Mortality</span>
            </div>
            <div className={cn(
              "font-semibold text-sm",
              personality.behavior.percentTokensDead > 70 ? "text-risk-high" : ""
            )}>
              {personality.behavior.percentTokensDead.toFixed(0)}% dead
            </div>
          </div>
        </div>

        {/* Timing Preferences */}
        {(personality.timing.preferredDayOfWeek || personality.timing.preferredTimeOfDay) && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1 text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-semibold">Timing Preferences</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {personality.timing.preferredDayOfWeek && (
                <Badge variant="outline" className="text-xs">
                  Prefers {personality.timing.preferredDayOfWeek}s
                </Badge>
              )}
              {personality.timing.preferredTimeOfDay && (
                <Badge variant="outline" className="text-xs">
                  {personality.timing.preferredTimeOfDay} launches
                </Badge>
              )}
              {personality.timing.avgDaysBetweenLaunches !== null && (
                <Badge variant="outline" className="text-xs">
                  ~{personality.timing.avgDaysBetweenLaunches.toFixed(1)} days between launches
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Common Themes */}
        {personality.naming.commonThemes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Common Token Themes</h4>
            <div className="flex flex-wrap gap-1">
              {personality.naming.commonThemes.map((theme) => (
                <Badge key={theme} variant="outline" className="text-xs capitalize">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Risk Indicators */}
        {personality.riskIndicators.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-risk-high" />
              Risk Indicators
            </h4>
            <ul className="space-y-1">
              {personality.riskIndicators.map((indicator, i) => (
                <li
                  key={i}
                  className="text-sm text-risk-high flex items-start gap-2"
                >
                  <span className="text-risk-high mt-1">-</span>
                  {indicator}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Positive Indicators */}
        {personality.positiveIndicators.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-risk-low" />
              Positive Signs
            </h4>
            <ul className="space-y-1">
              {personality.positiveIndicators.map((indicator, i) => (
                <li
                  key={i}
                  className="text-sm text-risk-low flex items-start gap-2"
                >
                  <span className="text-risk-low mt-1">+</span>
                  {indicator}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Token Lifespan Stats */}
        {personality.behavior.avgTokenLifespanDays !== null && (
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            Avg token lifespan: {personality.behavior.avgTokenLifespanDays.toFixed(1)} days
            {personality.behavior.longestSurvivingToken && (
              <span className="ml-2">
                | Longest: {personality.behavior.longestSurvivingToken.name} ({personality.behavior.longestSurvivingToken.days.toFixed(0)}d)
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
