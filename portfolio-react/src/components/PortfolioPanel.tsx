import { useEffect, useState } from 'react'
import TradeFormRow from './TradeFormRow'
import type { Holding, Transaction } from '../types'

export type { Holding }

type Tab = 'portfolio' | 'transactions'

interface Props {
  apiBase: string
  holdings: Holding[]
  onSellSuccess: () => void
  onError: (message: string) => void
}

export default function PortfolioPanel({ apiBase, holdings, onSellSuccess, onError }: Props) {
  const [tab, setTab] = useState<Tab>('portfolio')
  const [openSell, setOpenSell] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    if (tab !== 'transactions') return
    fetch(`${apiBase}/transactions`)
      .then((r) => r.ok ? r.json() : [])
      .then(setTransactions)
      .catch(() => {})
  }, [tab, apiBase])

  const toggleSell = (symbol: string) =>
    setOpenSell((prev) => (prev === symbol ? null : symbol))

  return (
    <aside className="portfolio-panel">
      <div className="panel-tabs">
        <button
          className={`panel-tab${tab === 'portfolio' ? ' panel-tab--active' : ''}`}
          onClick={() => setTab('portfolio')}
        >
          Portfolio
        </button>
        <button
          className={`panel-tab${tab === 'transactions' ? ' panel-tab--active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          Transactions
        </button>
      </div>

      <div className="portfolio-table-wrapper">
        {tab === 'portfolio' && (
          holdings.length === 0 ? (
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
          )
        )}

        {tab === 'transactions' && (
          transactions.length === 0 ? (
            <p className="empty">No transactions yet.</p>
          ) : (
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Shares</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.transaction_id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td className="symbol">{t.symbol}</td>
                    <td className={t.buy ? 'positive' : 'negative'}>{t.buy ? 'Buy' : 'Sell'}</td>
                    <td>{t.shares.toFixed(4)}</td>
                    <td>${t.price.toFixed(2)}</td>
                    <td>${(t.shares * t.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </aside>
  )
}
