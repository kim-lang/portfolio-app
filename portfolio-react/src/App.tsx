import { useState } from 'react'
import './App.css'

interface StockMatch {
  symbol: string
  name: string
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
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError('Failed to search stocks')
      setResults([])
    } finally {
      setLoading(false)
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

        <div className="results">
          {results.map((stock) => (
            <div key={stock.symbol} className="stock-item">
              <h3>{stock.symbol}</h3>
              <p>{stock.name}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
