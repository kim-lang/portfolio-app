import configparser
import logging
import os
import requests
from .base import StockProvider

logger = logging.getLogger(__name__)

BASE_URL = 'https://www.alphavantage.co/query'


class AlphaVantageProvider(StockProvider):

    def __init__(self, config: configparser.ConfigParser):
        super().__init__(config)
        self.api_key = os.getenv('ALPHA_VANTAGE_API_KEY', 'demo')

    def search(self, query: str) -> list[dict]:
        logger.info('Alpha Vantage search: %s', query)
        resp = requests.get(BASE_URL, params={
            'function': 'SYMBOL_SEARCH',
            'keywords': query,
            'apikey': self.api_key,
        })
        data = resp.json()
        matches = [
            {'symbol': m['1. symbol'], 'name': m['2. name']}
            for m in data.get('bestMatches', [])
        ]
        logger.info('Found %d matches for: %s', len(matches), query)
        return matches

    def get_quote(self, symbol: str) -> dict | None:
        logger.info('Alpha Vantage quote: %s', symbol)
        resp = requests.get(BASE_URL, params={
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': self.api_key,
        })
        data = resp.json()
        quote = data.get('Global Quote')
        if not quote:
            logger.warning('No quote returned for: %s', symbol)
            return None
        try:
            price = float(quote['05. price'])
            prev  = float(quote['08. previous close'])
            return {
                'price': round(price, 2),
                'change': round(price - prev, 2),
                'changePercent': round((price - prev) / prev * 100, 2),
            }
        except (KeyError, ValueError):
            logger.warning('Failed to parse quote for: %s', symbol)
            return None
