import { TokenInput, ExampleTokens } from "@/components/TokenInput"
import { WalletReputationCard } from "@/components/WalletReputationCard"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            See Who Really{" "}
            <span className="text-accent">Launched</span> That Token
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transparent Solana token intelligence. Paste a mint address to
            analyze deployer behavior, funding sources, and risk signals.
          </p>

          <TokenInput />
          <ExampleTokens />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Paste Token Mint</h3>
              <p className="text-muted-foreground text-sm">
                Enter any Solana SPL token mint address to begin analysis
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Deployer Detection</h3>
              <p className="text-muted-foreground text-sm">
                We identify the likely deployer wallet and analyze its history
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Risk Assessment</h3>
              <p className="text-muted-foreground text-sm">
                Get an explainable risk score with clear signals and evidence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet Reputation Section */}
      <section className="border-t border-border py-16 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">Check Any Wallet</h2>
          <p className="text-muted-foreground text-center mb-8">
            Lookup the reputation score for any Solana wallet
          </p>
          <WalletReputationCard showSearch={true} />
        </div>
      </section>

      {/* Transparency Section */}
      <section className="border-t border-border py-16 px-4 bg-card">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Transparent Intelligence</h2>
          <p className="text-muted-foreground mb-6">
            Every risk score comes with clear explanations. We show you exactly
            what signals we detected and why. No black boxes.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-background rounded-lg px-4 py-2 border border-border">
              Funding Source Analysis
            </div>
            <div className="bg-background rounded-lg px-4 py-2 border border-border">
              Wallet Age Detection
            </div>
            <div className="bg-background rounded-lg px-4 py-2 border border-border">
              Cash-out Tracking
            </div>
            <div className="bg-background rounded-lg px-4 py-2 border border-border">
              Deployer Attribution
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Trench Transparency Terminal
          </div>
          <div className="text-sm text-muted-foreground">
            Powered by{" "}
            <a
              href="https://helius.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Helius
            </a>
          </div>
          <div className="text-xs text-muted-foreground">
            Not financial advice. Read-only intelligence.
          </div>
        </div>
      </footer>
    </main>
  )
}
