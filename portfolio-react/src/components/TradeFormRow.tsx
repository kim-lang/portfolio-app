import { useState } from 'react'

interface Props {
  mode: 'buy' | 'sell'
  apiBase: string
  symbol: string
  colSpan: number
  price?: number
  maxShares?: number
  onSuccess: () => void
  onError: (message: string) => void
}

export default function TradeFormRow({ mode, apiBase, symbol, colSpan, price, maxShares, onSuccess, onError }: Props) {
  const [shares, setShares] = useState('')
  const isBuy = mode === 'buy'
  const total = isBuy && price && shares ? (parseFloat(shares) * price || 0).toFixed(2) : null

  const handleSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault()
    const numShares = parseFloat(shares)
    if (isNaN(numShares) || numShares <= 0) return
    if (!isBuy && maxShares !== undefined && numShares > maxShares) return
    if (!price) return

    try {
      const res = await fetch(`${apiBase}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, price, shares: numShares }),
      })
      if (!res.ok) throw new Error()
      onSuccess()
    } catch {
      onError(`Failed to submit ${mode} order for ${symbol}`)
    }
  }

  return (
    <tr className={isBuy ? 'buy-row' : 'sell-row'}>
      <td colSpan={colSpan}>
        <form className="buy-form" onSubmit={handleSubmit}>
          <span className="buy-label">Shares to {mode}:</span>
          <input
            type="number"
            min="0.01"
            max={maxShares}
            step="any"
            placeholder="0"
            className="shares-input"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            autoFocus
          />
          {isBuy && total !== null && (
            <span className="buy-total">= ${total}</span>
          )}
          {!isBuy && shares && maxShares !== undefined && (
            <span className="buy-label">of {maxShares.toFixed(4)} shares</span>
          )}
          <button type="submit" className={isBuy ? 'confirm-buy-button' : 'confirm-sell-button'}>
            Confirm
          </button>
        </form>
      </td>
    </tr>
  )
}
