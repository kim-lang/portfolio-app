import { useState } from 'react'

interface Props {
  mode: 'buy' | 'sell'
  apiBase: string
  symbol: string
  colSpan: number
  price?: number
  maxShares?: number
  onSuccess: () => void
  onCancel: () => void
  onError: (message: string) => void
}

export default function TradeFormRow({ mode, apiBase, symbol, colSpan, price, maxShares, onSuccess, onCancel, onError }: Props) {
  const [shares, setShares] = useState('')
  const isBuy = mode === 'buy'
  const numShares = parseFloat(shares)
  const total = price && shares && !isNaN(numShares) ? (numShares * price).toFixed(2) : null

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
        <form className="buy-form" onSubmit={handleSubmit} noValidate>
          <span className="buy-label">Shares to {mode}:</span>
          <input
            type="number"
            min="1"
            max={maxShares}
            step="1"
            placeholder="0"
            className="shares-input"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault()
                const current = parseFloat(shares) || 0
                const next = e.key === 'ArrowUp' ? Math.floor(current) + 1 : Math.ceil(current) - 1
                if (next >= 0) setShares(String(next))
              }
            }}
            autoFocus
          />
          {total !== null && price !== undefined && (
            <span className="buy-total">
              × ${price.toFixed(2)} = ${total}
            </span>
          )}
          {!isBuy && shares && maxShares !== undefined && (
            <span className="buy-label">of {maxShares.toFixed(4)}</span>
          )}
          <button type="submit" className={isBuy ? 'confirm-buy-button' : 'confirm-sell-button'}>
            Confirm
          </button>
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </form>
      </td>
    </tr>
  )
}
