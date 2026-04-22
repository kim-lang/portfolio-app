import configparser
import logging
import os
import time
import requests
from .base import StockProvider
from exceptions import RateLimitError, SymbolNotFoundError, DataUnavailableError

logger = logging.getLogger(__name__)

BASE_URL = 'https://www.alphavantage.co/query'


class AlphaVantageProvider(StockProvider):

    def __init__(self, config: configparser.ConfigParser):
        super().__init__(config)
        self.api_key = (
            config.get('alphavantage', 'api_key', fallback=None)
            or os.getenv('ALPHA_VANTAGE_API_KEY', 'demo')
        )
        self._request_delay = config.getfloat('alphavantage', 'request_delay', fallback=12.0)

    def _check_response(self, data: dict, symbol: str = '') -> None:
        if 'Note' in data or 'Information' in data:
            msg = data.get('Note') or data.get('Information', '')
            logger.warning('Alpha Vantage rate limit: %s', msg)
            raise RateLimitError(msg)
        if 'Error Message' in data:
            logger.warning('Alpha Vantage error for %s: %s', symbol, data['Error Message'])
            raise SymbolNotFoundError(symbol) if symbol else DataUnavailableError(data['Error Message'])

    def search(self, query: str) -> list[dict]:
        logger.info('Alpha Vantage search: %s', query)
        try:
            resp = requests.get(BASE_URL, params={
                'function': 'SYMBOL_SEARCH',
                'keywords': query,
                'apikey': self.api_key,
            })
            data = resp.json()
        except Exception as e:
            raise DataUnavailableError(str(e)) from e
        self._check_response(data)
        matches = [
            {'symbol': m['1. symbol'], 'name': m['2. name']}
            for m in data.get('bestMatches', [])
        ]
        logger.info('Found %d matches for: %s', len(matches), query)
        return matches

    def get_quote(self, symbol: str) -> dict | None:
        logger.info('Alpha Vantage quote: %s', symbol)
        time.sleep(self._request_delay)
        try:
            resp = requests.get(BASE_URL, params={
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': self.api_key,
            })
            data = resp.json()
        except Exception as e:
            raise DataUnavailableError(str(e)) from e
        self._check_response(data, symbol)
        quote = data.get('Global Quote')
        if not quote or not quote.get('05. price'):
            raise SymbolNotFoundError(symbol)
        try:
            price = float(quote['05. price'])
            prev  = float(quote['08. previous close'])
            return {
                'price': round(price, 2),
                'change': round(price - prev, 2),
                'changePercent': round((price - prev) / prev * 100, 2),
            }
        except (KeyError, ValueError) as e:
            logger.warning('Failed to parse quote for %s: %s', symbol, e)
            raise DataUnavailableError(f'Could not parse quote for {symbol}') from e
