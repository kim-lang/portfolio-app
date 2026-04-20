from config import load_config
from .base import StockProvider
from .yfinance_provider import YFinanceProvider
from .alphavantage_provider import AlphaVantageProvider
from .mock_provider import MockProvider

_PROVIDERS = {
    'yfinance':      YFinanceProvider,
    'alphavantage':  AlphaVantageProvider,
    'mock':          MockProvider,
}


def get_provider() -> StockProvider:
    config = load_config()
    name = config.get('settings', 'provider', fallback='yfinance')
    cls = _PROVIDERS.get(name)
    if cls is None:
        raise ValueError(f'Unknown provider "{name}" in config.ini. Choose from: {list(_PROVIDERS)}')
    return cls(config)
