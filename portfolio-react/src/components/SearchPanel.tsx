import { useState } from 'react'
import TradeFormRow from './TradeFormRow'
import type { StockMatch } from '../types'
import { useToast } from '../hooks/ToastContext'

interface Props {
  apiBase: string
  open: boolean
  onToggle: () => void
  onBuySuccess: () => void

}

export default function SearchPanel({ apiBase, open, onToggle, onBuySuccess }: Props) {
  if (!open) {
    return (
      <div className="search-panel search-panel--collapsed" onClick={onToggle} title="Expand search">
        <span className="search-panel-collapsed-label">Search</span>
      </div>
    )
  }
  const { addToast } = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockMatch[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch: NonNullable<React.ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`${apiBase}/search/${encodeURIComponent(query)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Search failed')
      const matches: StockMatch[] = data.map((s: Pick<StockMatch, 'symbol' | 'name'>) => ({
        ...s, quote: null, loadingQuote: true, buyOpen: false,
      }))
      setResults(matches)
      matches.forEach(({ symbol }) => fetchQuote(symbol))
    } catch (err) {
      addToast('error', 'Search failed', err instanceof Error ? err.message : 'Could not retrieve results')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const fetchQuote = async (symbol: string) => {
    setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, loadingQuote: true } : s))
    try {
      const response = await fetch(`${apiBase}/quote/${symbol}`)
      const quote = response.ok ? await response.json() : null
      setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, quote, loadingQuote: false } : s))
      return quote
    } catch {
      setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, loadingQuote: false } : s))
      return null
    }
  }

  const handleBuyClick = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation()
    setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, buyOpen: !s.buyOpen } : s))
  }

  const closeBuy = (symbol: string) =>
    setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, buyOpen: false } : s))

  return (
    <main className="search-panel">
      <div className="search-panel-title">
        <span>Search</span>
        <button className="panel-collapse-btn" onClick={onToggle} title="Collapse search">✕</button>
      </div>
      <div className="search-panel-body">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for stocks by name or symbol..."
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="results-wrapper">
        {results.length > 0 && (
          <table className="results-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>Change %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((stock) => (
                <>
                  <tr key={stock.symbol} className="clickable-row">
                    <td className="symbol">{stock.symbol}</td>
                    <td>{stock.name}</td>
                    <td>{stock.loadingQuote ? '…' : stock.quote ? `$${stock.quote.price.toFixed(2)}` : '—'}</td>
                    <td className={stock.quote ? (stock.quote.change >= 0 ? 'positive' : 'negative') : ''}>
                      {stock.loadingQuote ? '' : stock.quote ? (stock.quote.change >= 0 ? '+' : '') + stock.quote.change.toFixed(2) : '—'}
                    </td>
                    <td className={stock.quote ? (stock.quote.changePercent >= 0 ? 'positive' : 'negative') : ''}>
                      {stock.loadingQuote ? '' : stock.quote ? (stock.quote.changePercent >= 0 ? '+' : '') + stock.quote.changePercent.toFixed(2) + '%' : '—'}
                    </td>
                    <td>
                      <button className="buy-button" onClick={(e) => handleBuyClick(e, stock.symbol)}>
                        Buy
                      </button>
                    </td>
                  </tr>
                  {stock.buyOpen && (
                    <TradeFormRow
                      key={`${stock.symbol}-buy`}
                      mode="buy"
                      apiBase={apiBase}
                      symbol={stock.symbol}
                      colSpan={6}
                      price={stock.quote?.price}
                      onSuccess={() => { closeBuy(stock.symbol); onBuySuccess() }}
                      onCancel={() => closeBuy(stock.symbol)}

                    />
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
