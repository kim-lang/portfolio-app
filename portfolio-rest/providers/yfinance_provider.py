import configparser
import logging
import yfinance as yf
import yfinance.exceptions as yfe  # type: ignore[import-untyped]
from .base import StockProvider
from exceptions import RateLimitError, SymbolNotFoundError, DataUnavailableError

logger = logging.getLogger(__name__)


class YFinanceProvider(StockProvider):

    def __init__(self, config: configparser.ConfigParser):
        super().__init__(config)

    def search(self, query: str) -> list[dict]:
        logger.info('yfinance search: %s', query)
        try:
            results = yf.Search(query, max_results=20).quotes
        except yfe.YFRateLimitError as e:
            logger.warning('Rate limited during search for "%s": %s', query, e)
            raise RateLimitError(str(e)) from e
        except yfe.YFException as e:
            logger.error('yfinance error during search for "%s": %s', query, e)
            raise DataUnavailableError(str(e)) from e
        except Exception as e:
            logger.error('Unexpected error during search for "%s": %s', query, e)
            raise DataUnavailableError(str(e)) from e

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
            price = info.last_price
            prev  = info.previous_close
            if price is None or prev is None:
                raise SymbolNotFoundError(symbol)
            return {
                'price':         round(price, 2),
                'change':        round(price - prev, 2),
                'changePercent': round((price - prev) / prev * 100, 2),
            }
        except (SymbolNotFoundError, RateLimitError):
            raise
        except yfe.YFRateLimitError as e:
            logger.warning('Rate limited fetching quote for %s: %s', symbol, e)
            raise RateLimitError(str(e)) from e
        except yfe.YFException as e:
            logger.error('yfinance error fetching quote for %s: %s', symbol, e)
            raise DataUnavailableError(str(e)) from e
        except (AttributeError, TypeError) as e:
            logger.warning('No data for symbol %s: %s', symbol, e)
            raise SymbolNotFoundError(symbol) from e
        except Exception as e:
            logger.error('Unexpected error fetching quote for %s: %s', symbol, e)
            raise DataUnavailableError(str(e)) from e
