import { useState } from 'react'
import './App.css'


interface StockQuote {
  price: number
  change: number
  changePercent: number
}

interface StockMatch {
  symbol: string
  name: string
  quote: StockQuote | null
  loadingQuote: boolean
  buyOpen: boolean
  shares: string
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_BASE = 'http://127.0.0.1:5000'

  const handleSearch: NonNullable<React.ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/search/${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setResults(data.map((s: Pick<StockMatch, 'symbol' | 'name'>) => ({ ...s, quote: null, loadingQuote: false, buyOpen: false, shares: '' })))
    } catch {
      setError('Failed to search stocks')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const fetchQuote = async (symbol: string) => {
    setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, loadingQuote: true } : s))
    try {
      const response = await fetch(`${API_BASE}/quote/${symbol}`)
      const quote = response.ok ? await response.json() : null
      setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, quote, loadingQuote: false } : s))
      return quote
    } catch {
      setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, loadingQuote: false } : s))
      return null
    }
  }

  const handleRowClick = (symbol: string) => fetchQuote(symbol)

  const handleBuyClick = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation()
    const stock = results.find((s) => s.symbol === symbol)
    if (!stock) return
    if (!stock.quote && !stock.loadingQuote) await fetchQuote(symbol)
    setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, buyOpen: !s.buyOpen } : s))
  }

  const handleConfirmBuy = (symbol: string): NonNullable<React.ComponentProps<'form'>['onSubmit']> => async (e) => {
    e.preventDefault()
    const stock = results.find((s) => s.symbol === symbol)
    if (!stock || !stock.quote) return
    const shares = parseFloat(stock.shares)
    if (isNaN(shares) || shares <= 0) return

    try {
      const response = await fetch(`${API_BASE}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, price: stock.quote.price, shares }),
      })
      if (!response.ok) throw new Error('Buy failed')
      setResults((prev) => prev.map((s) => s.symbol === symbol ? { ...s, buyOpen: false, shares: '' } : s))
    } catch {
      setError(`Failed to submit buy order for ${symbol}`)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Stock Search</h1>
      </header>

      <main>
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

        {error && <p className="error">{error}</p>}

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
                  <tr key={stock.symbol} onClick={() => handleRowClick(stock.symbol)} className="clickable-row">
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
                    <tr key={`${stock.symbol}-buy`} className="buy-row">
                      <td colSpan={6}>
                        <form className="buy-form" onSubmit={handleConfirmBuy(stock.symbol)}>
                          <span className="buy-label">Shares to buy:</span>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="0"
                            className="shares-input"
                            value={stock.shares}
                            onChange={(e) => setResults((prev) =>
                              prev.map((s) => s.symbol === stock.symbol ? { ...s, shares: e.target.value } : s)
                            )}
                            autoFocus
                          />
                          {stock.quote && stock.shares && (
                            <span className="buy-total">
                              = ${(parseFloat(stock.shares) * stock.quote.price || 0).toFixed(2)}
                            </span>
                          )}
                          <button type="submit" className="confirm-buy-button">Confirm</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}

export default App
