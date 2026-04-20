CREATE TABLE IF NOT EXISTS transactions (
    transaction_id        SERIAL PRIMARY KEY,
    symbol    VARCHAR(10)      NOT NULL,
    date      TIMESTAMPTZ      NOT NULL,
    buy       BOOLEAN          NOT NULL,
    price     DOUBLE PRECISION NOT NULL
);
