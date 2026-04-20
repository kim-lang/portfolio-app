import logging
from flask import Flask, jsonify
from flask_cors import CORS
from providers import get_provider

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

provider = get_provider()
logger.info('Using stock provider: %s', type(provider).__name__)


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


if __name__ == '__main__':
    app.run(debug=True)
