# Portfolio REST API

A Flask application for stock search using real data from Alpha Vantage API.

## Setup

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (sign up for a free account).

2. Set the API key as an environment variable:
   ```
   export ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

3. Install dependencies and run:
   ```
   make all
   ```
   This creates a virtual environment, installs dependencies, and starts the app.

   Or manually:
   - Create venv: `make venv`
   - Install: `make install`
   - Run: `make run`

The app will run on http://127.0.0.1:5000/

## Endpoints

- `GET /`: Welcome message
- `GET /stocks`: List real-time quotes for popular stocks (AAPL, GOOGL, MSFT, TSLA, AMZN)
- `GET /search/<query>`: Search for stock symbols by company name or keywords (e.g., /search/Apple)
- `GET /quote/<symbol>`: Get real-time quote data for a specific symbol (e.g., /quote/AAPL)

## Data Fields

### Search Response (/search)
- `symbol`: Stock ticker symbol
- `name`: Company name

### Quote Response (/quote or /stocks)
- `symbol`: Stock ticker symbol
- `price`: Current price
- `change`: Price change today
- `changePercent`: Percentage change today
- `volume`: Trading volume

## Notes

- Alpha Vantage has rate limits (5 calls/minute for free tier, 500/day).
- If no API key is set, it falls back to 'demo' key with limited functionality.
- Data is fetched live from Alpha Vantage.
- Use `make clean` to remove the virtual environment and Python cache files.
