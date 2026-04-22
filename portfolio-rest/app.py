import logging
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from config import load_config
from providers import get_provider
from exceptions import AppError, NoMatchesError, ValidationError
from db import init_db, get_session, Transaction, PortfolioSnapshot, PortfolioView
from services import take_snapshot

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.errorhandler(AppError)
def handle_app_error(e):
    return jsonify({'error': e.message}), e.status_code

config = load_config()
provider = get_provider()
logger.info('Using stock provider: %s', type(provider).__name__)

def _fetch_quote(symbol: str):
    return provider.cached_quote(symbol)

try:
    init_db(config)
    logger.info('Database connection established')
    scheduler = BackgroundScheduler()
    scheduler.add_job(lambda: take_snapshot(provider), 'cron', hour=17, minute=0)
    scheduler.start()
    logger.info('Snapshot scheduler started')
except RuntimeError as e:
    logger.warning('Database not available: %s', e)


@app.route('/')
def home():
    return jsonify({'message': 'Welcome to the Stock Search API'})


@app.route('/search/<query>')
def search_stock(query):
    matches = provider.search(query)
    if not matches:
        raise NoMatchesError()
    return jsonify(matches)


@app.route('/quotes')
def batch_quotes():
    raw = request.args.get('symbols', '')
    symbols = [s.strip().upper() for s in raw.split(',') if s.strip()]
    if not symbols:
        raise ValidationError('symbols query parameter is required')
    return jsonify(provider.get_quotes(symbols))


@app.route('/quote/<symbol>')
def quote_stock(symbol):
    data = _fetch_quote(symbol.upper())
    if not data:
        raise NoMatchesError()
    return jsonify(data)


def _record_transaction(buy: bool):
    body = request.get_json()
    symbol = (body.get('symbol') or '').upper()
    price  = body.get('price')
    shares = body.get('shares')

    if not symbol or price is None or shares is None:
        raise ValidationError('symbol, price, and shares are required')
    if float(price) <= 0 or float(shares) <= 0:
        raise ValidationError('price and shares must be positive')

    txn = Transaction(
        symbol=symbol,
        date=datetime.now(timezone.utc),
        buy=buy,
        price=float(price),
        shares=float(shares),
    )
    with get_session() as session:
        session.add(txn)
        session.commit()
        session.refresh(txn)
        logger.info('%s %s shares=%s price=%s', 'BUY' if buy else 'SELL', symbol, shares, price)
        return jsonify(txn.to_dict()), 201


@app.route('/buy', methods=['POST'])
def buy_stock():
    return _record_transaction(buy=True)


@app.route('/sell', methods=['POST'])
def sell_stock():
    return _record_transaction(buy=False)


@app.route('/transactions', methods=['GET'])
def list_transactions():
    with get_session() as session:
        txns = session.query(Transaction).order_by(Transaction.date.desc()).all()
        return jsonify([t.to_dict() for t in txns])


@app.route('/portfolio', methods=['GET'])
def get_portfolio():
    with get_session() as session:
        rows = session.query(PortfolioView).all()
        return jsonify([r.to_dict() for r in rows])


@app.route('/snapshots', methods=['GET'])
def get_snapshots():
    with get_session() as session:
        rows = session.query(PortfolioSnapshot).order_by(PortfolioSnapshot.date.asc()).all()
        return jsonify([r.to_dict() for r in rows])


@app.route('/snapshots/now', methods=['POST'])
def snapshot_now():
    take_snapshot(provider)
    return jsonify({'message': 'Snapshot taken'}), 201


if __name__ == '__main__':
    app.run(debug=True)
