import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineStyle, AreaSeries, LineSeries } from 'lightweight-charts'

export interface Snapshot {
  date: string
  value: number
  cost_basis: number
}

interface Props {
  snapshots: Snapshot[]
}

export default function PortfolioChart({ snapshots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || snapshots.length === 0) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#555',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: '#ddd',
      },
      timeScale: {
        borderColor: '#ddd',
        timeVisible: false,
      },
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

    chart.timeScale().fitContent()

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth })
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [snapshots])

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
      <div ref={containerRef} />
    </div>
  )
}
