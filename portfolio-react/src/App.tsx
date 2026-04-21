import { useEffect, useState } from 'react'
import './App.css'
import PortfolioChart from './components/PortfolioChart'
import PortfolioPanel from './components/PortfolioPanel'
import type { Holding } from './components/PortfolioPanel'
import SearchPanel from './components/SearchPanel'

const API_BASE = 'http://127.0.0.1:5000'

function App() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [searchOpen, setSearchOpen] = useState(true)

  const fetchHoldings = async () => {
    try {
      const response = await fetch(`${API_BASE}/portfolio`)
      if (!response.ok) return
      const data: { symbol: string; shares: number; avg_price: number }[] = await response.json()
      const built: Holding[] = data.map((h) => ({
        symbol: h.symbol,
        shares: parseFloat(h.shares as unknown as string),
        avgPrice: parseFloat(h.avg_price as unknown as string),
        currentPrice: null,
        sellOpen: false,
      }))
      setHoldings(built)
      built.forEach(async (h) => {
        try {
          const r = await fetch(`${API_BASE}/quote/${h.symbol}`)
          if (!r.ok) return
          const quote = await r.json()
          setHoldings((prev) => prev.map((x) =>
            x.symbol === h.symbol ? { ...x, currentPrice: quote.price } : x
          ))
        } catch { /* leave as null */ }
      })
    } catch { /* portfolio unavailable */ }
  }

  useEffect(() => { fetchHoldings() }, [])

  return (
    <div className="app">
      <header>
        <h1>Stock Search</h1>
      </header>

      <div className="layout" style={{ gridTemplateColumns: searchOpen ? '1fr 1fr' : '1fr auto' }}>
        <PortfolioPanel
          apiBase={API_BASE}
          holdings={holdings}
          onSellSuccess={fetchHoldings}
        />
        <SearchPanel
          apiBase={API_BASE}
          open={searchOpen}
          onToggle={() => setSearchOpen((v) => !v)}
          onBuySuccess={fetchHoldings}
        />
      </div>

      <PortfolioChart apiBase={API_BASE} />
    </div>
  )
}

export default App
