import logging
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import load_config
from providers import get_provider
from db import init_db, get_session, Transaction

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

config = load_config()
provider = get_provider()
logger.info('Using stock provider: %s', type(provider).__name__)

try:
    init_db(config)
    logger.info('Database connection established')
except RuntimeError as e:
    logger.warning('Database not available: %s', e)


@app.route('/')
def home():
    return jsonify({'message': 'Welcome to the Stock Search API'})


@app.route('/search/<query>')
def search_stock(query):
    matches = provider.search(query)
    if not matches:
        return jsonify({'error': 'No matches found'}), 404
    return jsonify(matches)


@app.route('/quote/<symbol>')
def quote_stock(symbol):
    data = provider.get_quote(symbol.upper())
    if data:
        return jsonify(data)
    logger.warning('Quote not available for symbol: %s', symbol)
    return jsonify({'error': 'Quote not available'}), 404


def _record_transaction(buy: bool):
    body = request.get_json()
    symbol = (body.get('symbol') or '').upper()
    price  = body.get('price')
    shares = body.get('shares')

    if not symbol or price is None or shares is None:
        return jsonify({'error': 'symbol, price, and shares are required'}), 400
    if float(price) <= 0 or float(shares) <= 0:
        return jsonify({'error': 'price and shares must be positive'}), 400

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


if __name__ == '__main__':
    app.run(debug=True)
