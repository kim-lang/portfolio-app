export interface Snapshot {
  date: string
  value: number
  cost_basis: number
}

export interface Transaction {
  transaction_id: number
  symbol: string
  date: string
  buy: boolean
  price: number
  shares: number
}

export interface Holding {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number | null
}

export interface StockQuote {
  price: number
  change: number
  changePercent: number
}

export interface StockMatch {
  symbol: string
  name: string
  quote: StockQuote | null
  loadingQuote: boolean
  buyOpen: boolean
}
