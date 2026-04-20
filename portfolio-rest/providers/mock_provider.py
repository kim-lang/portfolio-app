import configparser
from .base import StockProvider

_STOCKS = {
    'AAPL':  ('Apple Inc.',          189.45,  1.23,  0.65),
    'MSFT':  ('Microsoft Corp.',     415.20, -2.10, -0.50),
    'GOOGL': ('Alphabet Inc.',       175.80,  0.95,  0.54),
    'AMZN':  ('Amazon.com Inc.',     198.60,  3.40,  1.74),
    'TSLA':  ('Tesla Inc.',          172.30, -5.60, -3.15),
    'NVDA':  ('NVIDIA Corp.',        875.40,  12.30, 1.43),
    'META':  ('Meta Platforms Inc.', 505.10,  -3.20, -0.63),
}


class MockProvider(StockProvider):

    def __init__(self, config: configparser.ConfigParser):
        super().__init__(config)


    def search(self, query: str) -> list[dict]:
        q = query.lower()
        return [
            {'symbol': sym, 'name': name}
            for sym, (name, *_) in _STOCKS.items()
            if q in sym.lower() or q in name.lower()
        ]

    def get_quote(self, symbol: str) -> dict | None:
        row = _STOCKS.get(symbol.upper())
        if not row:
            return None
        _, price, change, change_pct = row
        return {'price': price, 'change': change, 'changePercent': change_pct}
