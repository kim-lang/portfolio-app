CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    symbol         VARCHAR(10)      NOT NULL,
    date           TIMESTAMPTZ      NOT NULL,
    buy            BOOLEAN          NOT NULL,
    price          DOUBLE PRECISION NOT NULL,
    shares         NUMERIC(18, 8)   NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id         SERIAL PRIMARY KEY,
    date       DATE             NOT NULL UNIQUE,
    value      DOUBLE PRECISION NOT NULL,
    cost_basis DOUBLE PRECISION NOT NULL
);

CREATE OR REPLACE VIEW portfolio AS
SELECT
    symbol,
    SUM(CASE WHEN buy THEN shares ELSE -shares END)                    AS shares,
    SUM(CASE WHEN buy THEN shares * price ELSE 0 END)
        / NULLIF(SUM(CASE WHEN buy THEN shares ELSE 0 END), 0)         AS avg_price,
    SUM(CASE WHEN buy THEN shares * price ELSE 0 END)
        / NULLIF(SUM(CASE WHEN buy THEN shares ELSE 0 END), 0)
        * SUM(CASE WHEN buy THEN shares ELSE -shares END)              AS total_cost
FROM transactions
GROUP BY symbol
HAVING SUM(CASE WHEN buy THEN shares ELSE -shares END) > 0;
