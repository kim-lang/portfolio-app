from abc import ABC, abstractmethod
import configparser


class StockProvider(ABC):

    def __init__(self, config: configparser.ConfigParser):
        self.config = config

    @abstractmethod
    def search(self, query: str) -> list[dict]:
        """Return list of {symbol, name} dicts matching query."""

    @abstractmethod
    def get_quote(self, symbol: str) -> dict | None:
        """Return {price, change, changePercent} for symbol, or None."""
