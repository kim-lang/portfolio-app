import { useState } from 'react'
import TradeFormRow from './TradeFormRow'
import type { Holding, Transaction } from '../types'


type Tab = 'portfolio' | 'transactions'
type SortDir = 'asc' | 'desc'

type HoldingSort = 'symbol' | 'shares' | 'avgPrice' | 'currentPrice' | 'value' | 'gain'
type TxnSort = 'date' | 'symbol' | 'buy' | 'shares' | 'price' | 'total'

interface Sort<T> { field: T; dir: SortDir }

interface Props {
  apiBase: string
  holdings: Holding[]
  transactions: Transaction[]
  onSellSuccess: () => void
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`sort-icon${active ? ' sort-icon--active' : ''}`}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

export default function PortfolioPanel({ apiBase, holdings, transactions, onSellSuccess }: Props) {
  const [tab, setTab] = useState<Tab>('portfolio')
  const [openSell, setOpenSell] = useState<string | null>(null)
  const [openBuy, setOpenBuy] = useState<string | null>(null)
  const [hSort, setHSort] = useState<Sort<HoldingSort>>({ field: 'symbol', dir: 'asc' })
  const [tSort, setTSort] = useState<Sort<TxnSort>>({ field: 'date', dir: 'desc' })

  const toggleSell = (symbol: string) => {
    setOpenSell((prev) => (prev === symbol ? null : symbol))
    setOpenBuy(null)
  }

  const toggleBuy = (symbol: string) => {
    setOpenBuy((prev) => (prev === symbol ? null : symbol))
    setOpenSell(null)
  }

  function sortBy<T>(current: Sort<T>, field: T): Sort<T> {
    return { field, dir: current.field === field && current.dir === 'asc' ? 'desc' : 'asc' }
  }

  const sortedHoldings = [...holdings].sort((a, b) => {
    const aVal = a.currentPrice !== null ? a.currentPrice * a.shares : null
    const bVal = b.currentPrice !== null ? b.currentPrice * b.shares : null
    const aGain = aVal !== null ? aVal - a.avgPrice * a.shares : null
    const bGain = bVal !== null ? bVal - b.avgPrice * b.shares : null

    const map: Record<HoldingSort, number> = {
      symbol:       a.symbol.localeCompare(b.symbol),
      shares:       a.shares - b.shares,
      avgPrice:     a.avgPrice - b.avgPrice,
      currentPrice: (a.currentPrice ?? 0) - (b.currentPrice ?? 0),
      value:        (aVal ?? 0) - (bVal ?? 0),
      gain:         (aGain ?? 0) - (bGain ?? 0),
    }
    return hSort.dir === 'asc' ? map[hSort.field] : -map[hSort.field]
  })

  const sortedTxns = [...transactions].sort((a, b) => {
    const map: Record<TxnSort, number> = {
      date:   new Date(a.date).getTime() - new Date(b.date).getTime(),
      symbol: a.symbol.localeCompare(b.symbol),
      buy:    Number(a.buy) - Number(b.buy),
      shares: a.shares - b.shares,
      price:  a.price - b.price,
      total:  (a.shares * a.price) - (b.shares * b.price),
    }
    return tSort.dir === 'asc' ? map[tSort.field] : -map[tSort.field]
  })

  const th = (label: string, field: HoldingSort) => (
    <th className="sortable" onClick={() => setHSort(sortBy(hSort, field))}>
      {label}<SortIcon active={hSort.field === field} dir={hSort.dir} />
    </th>
  )

  const tt = (label: string, field: TxnSort) => (
    <th className="sortable" onClick={() => setTSort(sortBy(tSort, field))}>
      {label}<SortIcon active={tSort.field === field} dir={tSort.dir} />
    </th>
  )

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
                  {th('Symbol', 'symbol')}
                  {th('Shares', 'shares')}
                  {th('Avg Cost', 'avgPrice')}
                  {th('Price', 'currentPrice')}
                  {th('Value', 'value')}
                  {th('Gain/Loss', 'gain')}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h) => {
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
                        <td className="action-buttons">
                          <button className="buy-button" onClick={() => toggleBuy(h.symbol)}>Buy</button>
                          <button className="sell-button" onClick={() => toggleSell(h.symbol)}>Sell</button>
                        </td>
                      </tr>
                      {openBuy === h.symbol && (
                        <TradeFormRow
                          key={`${h.symbol}-buy`}
                          mode="buy"
                          apiBase={apiBase}
                          symbol={h.symbol}
                          colSpan={7}
                          price={h.currentPrice ?? h.avgPrice}
                          onSuccess={() => { setOpenBuy(null); onSellSuccess() }}
                          onCancel={() => setOpenBuy(null)}
                        />
                      )}
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
                          onCancel={() => setOpenSell(null)}
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
                  {tt('Date', 'date')}
                  {tt('Symbol', 'symbol')}
                  {tt('Type', 'buy')}
                  {tt('Shares', 'shares')}
                  {tt('Price', 'price')}
                  {tt('Total', 'total')}
                </tr>
              </thead>
              <tbody>
                {sortedTxns.map((t) => (
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
