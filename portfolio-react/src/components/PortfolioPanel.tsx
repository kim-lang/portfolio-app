import { useState } from 'react'
import TradeFormRow from './TradeFormRow'

export interface Holding {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number | null
}

interface Props {
  apiBase: string
  holdings: Holding[]
  onSellSuccess: () => void
  onError: (message: string) => void
}

export default function PortfolioPanel({ apiBase, holdings, onSellSuccess, onError }: Props) {
  const [openSell, setOpenSell] = useState<string | null>(null)

  const toggleSell = (symbol: string) =>
    setOpenSell((prev) => (prev === symbol ? null : symbol))

  return (
    <aside className="portfolio-panel">
      <h2>Portfolio</h2>
      <div className="portfolio-table-wrapper">
        {holdings.length === 0 ? (
          <p className="empty">No holdings yet.</p>
        ) : (
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Shares</th>
                <th>Avg Cost</th>
                <th>Price</th>
                <th>Value</th>
                <th>Gain/Loss</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const value = h.currentPrice !== null ? h.currentPrice * h.shares : null
                const gain = value !== null ? value - h.avgPrice * h.shares : null
                const gainPct = gain !== null ? (gain / (h.avgPrice * h.shares)) * 100 : null
                return (
                  <>
                    <tr key={h.symbol}>
                      <td className="symbol">{h.symbol}</td>
                      <td>{h.shares.toFixed(4)}</td>
                      <td>${h.avgPrice.toFixed(2)}</td>
                      <td>{h.currentPrice !== null ? `$${h.currentPrice.toFixed(2)}` : '…'}</td>
                      <td>{value !== null ? `$${value.toFixed(2)}` : '—'}</td>
                      <td className={gain !== null ? (gain >= 0 ? 'positive' : 'negative') : ''}>
                        {gain !== null ? `${gain >= 0 ? '+' : ''}$${gain.toFixed(2)} (${gainPct!.toFixed(2)}%)` : '—'}
                      </td>
                      <td>
                        <button className="sell-button" onClick={() => toggleSell(h.symbol)}>
                          Sell
                        </button>
                      </td>
                    </tr>
                    {openSell === h.symbol && (
                      <TradeFormRow
                        key={`${h.symbol}-sell`}
                        mode="sell"
                        apiBase={apiBase}
                        symbol={h.symbol}
                        colSpan={7}
                        price={h.currentPrice ?? h.avgPrice}
                        maxShares={h.shares}
                        onSuccess={() => { setOpenSell(null); onSellSuccess() }}
                        onError={onError}
                      />
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </aside>
  )
}
