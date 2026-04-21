class AppError(Exception):
    status_code = 500

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class ValidationError(AppError):
    status_code = 400


class NoMatchesError(AppError):
    status_code = 404

    def __init__(self):
        super().__init__("No matches found")


class ProviderError(AppError):
    pass


class RateLimitError(ProviderError):
    status_code = 429


class SymbolNotFoundError(ProviderError):
    status_code = 404

    def __init__(self, symbol: str):
        super().__init__(f"No data for {symbol}")


class DataUnavailableError(ProviderError):
    status_code = 503
