import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY', 'demo')
BASE_URL = 'https://www.alphavantage.co/query'


def search_symbols(query):
    params = {
        'function': 'SYMBOL_SEARCH',
        'keywords': query,
        'apikey': API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    if 'bestMatches' in data:
        return [
            {
                'symbol': match['1. symbol'],
                'name': match['2. name']
            }
            for match in data['bestMatches']
        ]
    return []

def get_quote(symbol):
    params = {
        'function': 'GLOBAL_QUOTE',
        'symbol': symbol,
        'apikey': API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    if 'Global Quote' in data and data['Global Quote']:
        quote = data['Global Quote']
        return {
            'symbol': quote.get('01. symbol', symbol),
            'price': float(quote.get('05. price', 0)),
            'change': float(quote.get('09. change', 0)),
            'changePercent': quote.get('10. change percent', '0%').rstrip('%'),
            'volume': int(quote.get('06. volume', 0))
        }
    return None

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to the Stock Search API'})


@app.route('/search/<query>')
def search_stock(query):
    matches = search_symbols(query)
    if matches:
        return jsonify(matches)
    else:
        return jsonify({'error': 'No matches found'}), 404

@app.route('/quote/<symbol>')
def quote_stock(symbol):
    data = get_quote(symbol.upper())
    if data:
        return jsonify(data)
    else:
        return jsonify({'error': 'Quote not available'}), 404

if __name__ == '__main__':
    app.run(debug=True)
