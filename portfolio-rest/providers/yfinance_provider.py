import configparser
import logging
import yfinance as yf
from .base import StockProvider

logger = logging.getLogger(__name__)


class YFinanceProvider(StockProvider):

    def __init__(self, config: configparser.ConfigParser):
        super().__init__(config)


    def search(self, query: str) -> list[dict]:
        logger.info('yfinance search: %s', query)
        results = yf.Search(query, max_results=20).quotes
        matches = [
            {'symbol': r['symbol'], 'name': r.get('shortname', r.get('longname', ''))}
            for r in results
            if 'symbol' in r
        ]
        logger.info('Found %d matches for: %s', len(matches), query)
        return matches

    def get_quote(self, symbol: str) -> dict | None:
        logger.info('yfinance quote: %s', symbol)
        try:
            info = yf.Ticker(symbol).fast_info
            return {
                'price': round(info.last_price, 2),
                'change': round(info.last_price - info.previous_close, 2),
                'changePercent': round(
                    (info.last_price - info.previous_close) / info.previous_close * 100, 2
                ),
            }
        except Exception:
            logger.warning('Failed to fetch quote for: %s', symbol)
            return None
