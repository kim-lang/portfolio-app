from abc import ABC, abstractmethod
import configparser
import logging
from cachetools import TTLCache

logger = logging.getLogger(__name__)


class StockProvider(ABC):

    def __init__(self, config: configparser.ConfigParser):
        self.config = config
        self._cache = TTLCache(
            maxsize=config.getint('cache', 'quote_maxsize', fallback=256),
            ttl=config.getint('cache', 'quote_ttl', fallback=60),
        )

    @abstractmethod
    def search(self, query: str) -> list[dict]:
        """Return list of {symbol, name} dicts matching query."""

    @abstractmethod
    def get_quote(self, symbol: str) -> dict | None:
        """Return {price, change, changePercent} for symbol, or None."""

    def cached_quote(self, symbol: str) -> dict | None:
        if symbol not in self._cache:
            q = self.get_quote(symbol)
            if q is not None:
                self._cache[symbol] = q
        return self._cache.get(symbol)

    def get_quotes(self, symbols: list[str]) -> dict[str, dict]:
        result = {}
        for s in symbols:
            try:
                q = self.cached_quote(s)
                if q is not None:
                    result[s] = q
            except Exception as e:
                logger.warning('Skipping %s in batch: %s', s, e)
        return result
