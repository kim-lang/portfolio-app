import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, LineStyle, AreaSeries, LineSeries } from 'lightweight-charts'
import type { Snapshot, Transaction } from '../types'

interface Props {
  apiBase: string
}

export default function PortfolioChart({ apiBase }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [snapshotRes, txnRes] = await Promise.all([
          fetch(`${apiBase}/snapshots`),
          fetch(`${apiBase}/transactions`),
        ])
        if (snapshotRes.ok) setSnapshots(await snapshotRes.json())
        if (txnRes.ok) setTransactions(await txnRes.json())
      } catch { /* fail silently */ }
    }
    fetchData()
  }, [apiBase])

  useEffect(() => {
    if (!containerRef.current || snapshots.length === 0) return

    containerRef.current.replaceChildren()
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#555',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: { borderColor: '#ddd' },
      timeScale: { borderColor: '#ddd', timeVisible: false },
      height: 240,
    })

    const valueSeries = chart.addSeries(AreaSeries, {
      lineColor: '#1565c0',
      topColor: 'rgba(21, 101, 192, 0.2)',
      bottomColor: 'rgba(21, 101, 192, 0)',
      lineWidth: 2,
      priceFormat: { type: 'price', prefix: '$' },
    })

    const costSeries = chart.addSeries(LineSeries, {
      color: '#aaa',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceFormat: { type: 'price', prefix: '$' },
    })

    valueSeries.setData(snapshots.map((s) => ({ time: s.date, value: s.value })))
    costSeries.setData(snapshots.map((s) => ({ time: s.date, value: s.cost_basis })))

    // Build map of nearest snapshot date -> transactions (deduplicated by id)
    const snapshotDates = new Set(snapshots.map((s) => s.date))
    const txnsByDate = new Map<string, Transaction[]>()
    const seen = new Set<number>()

    transactions.forEach((t) => {
      if (seen.has(t.transaction_id)) return
      seen.add(t.transaction_id)
      const date = t.date.split('T')[0]
      const nearestDate = snapshotDates.has(date)
        ? date
        : snapshots.reduce((prev, curr) =>
            Math.abs(new Date(curr.date).getTime() - new Date(date).getTime()) <
            Math.abs(new Date(prev.date).getTime() - new Date(date).getTime())
              ? curr : prev
          ).date
      const existing = txnsByDate.get(nearestDate) ?? []
      txnsByDate.set(nearestDate, [...existing, t])
    })

    chart.subscribeCrosshairMove((param) => {
      const tooltip = tooltipRef.current
      const container = containerRef.current
      if (!tooltip || !container) return

      if (!param.time) {
        tooltip.style.display = 'none'
        return
      }

      const txns = txnsByDate.get(param.time as string)
      if (!txns || txns.length === 0) {
        tooltip.style.display = 'none'
        return
      }

      const x = param.point?.x ?? 0
      const y = param.point?.y ?? 0
      const tooltipWidth = 170

      tooltip.style.display = 'block'
      tooltip.style.left = x + tooltipWidth > container.clientWidth
        ? `${x - tooltipWidth - 8}px`
        : `${x + 12}px`
      tooltip.style.top = `${Math.max(0, y - 20)}px`
      tooltip.innerHTML = txns
        .map((t) =>
          `<div class="ct-row">` +
          `<span class="ct-badge ${t.buy ? 'ct-buy' : 'ct-sell'}">${t.buy ? '▲ Buy' : '▼ Sell'}</span>` +
          ` ${t.symbol}` +
          `<div class="ct-detail">${t.shares} shares @ $${t.price.toFixed(2)}</div>` +
          `</div>`
        )
        .join('')
    })

    chart.timeScale().fitContent()

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth })
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [snapshots, transactions])

  if (snapshots.length === 0) return null

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <h2 className="chart-title">Portfolio Value Over Time</h2>
        <div className="chart-legend">
          <span className="legend-value">&#9646; Market Value</span>
          <span className="legend-cost">&#9135; Cost Basis</span>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div ref={containerRef} />
        <div ref={tooltipRef} className="chart-tooltip" style={{ display: 'none' }} />
      </div>
    </div>
  )
}
