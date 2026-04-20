# Portfolio Frontend

A React frontend for searching stocks using the Flask API backend.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

The app will run on http://127.0.0.1:5173/

## Features

- Search for stocks by company name or symbol
- Displays matching stock symbols and company names
- Connects to the Flask API at http://127.0.0.1:5000

## Notes

- Make sure the Flask backend is running before using the frontend
- The backend must have CORS enabled for cross-origin requests
