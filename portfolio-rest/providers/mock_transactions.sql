TRUNCATE TABLE transactions RESTART IDENTITY;

-- Initial purchases Oct 1, 2025 — cost basis $10,000
-- AAPL $3,375 + MSFT $2,175 + GOOGL $1,650 + NVDA $1,300 + TSLA $1,500 = $10,000
INSERT INTO transactions (symbol, date, buy, price, shares) VALUES
    ('AAPL',  '2025-10-01 09:31:00+00', true, 225.00, 15),
    ('MSFT',  '2025-10-01 09:32:00+00', true, 435.00,  5),
    ('GOOGL', '2025-10-01 09:33:00+00', true, 165.00, 10),
    ('NVDA',  '2025-10-01 09:34:00+00', true, 130.00, 10),
    ('TSLA',  '2025-10-01 09:35:00+00', true, 250.00,  6),

-- Top up NVDA Oct 13 — cost basis $10,000 → $10,500 (+$500)
    ('NVDA',  '2025-10-13 10:15:00+00', true, 125.00,  4),

-- Add to TSLA Oct 27 — cost basis $10,500 → $11,200 (+$700)
    ('TSLA',  '2025-10-27 11:00:00+00', true, 350.00,  2),

-- Top up MSFT Nov 17 — cost basis $11,200 → $12,000 (+$800)
    ('MSFT',  '2025-11-17 09:45:00+00', true, 400.00,  2),

-- Sell TSLA Dec 5 — took profit after strong rally
    ('TSLA',  '2025-12-05 10:30:00+00', false, 390.00,  4),

-- Open META position Dec 15 — new holding
    ('META',  '2025-12-15 09:45:00+00', true, 595.00,  3),

-- Trim GOOGL Jan 8 — partial exit ahead of earnings
    ('GOOGL', '2026-01-08 11:15:00+00', false, 195.00,  5),

-- Add to NVDA Jan 22 — strong AI momentum
    ('NVDA',  '2026-01-22 09:35:00+00', true, 148.00,  6),

-- Buy more AAPL Feb 3 — dip after earnings sell-off
    ('AAPL',  '2026-02-03 10:00:00+00', true, 218.00,  8),

-- Sell META Feb 24 — cut position on guidance miss
    ('META',  '2026-02-24 14:00:00+00', false, 545.00,  2),

-- Open AMZN position Mar 10
    ('AMZN',  '2026-03-10 09:31:00+00', true, 225.00,  5),

-- Add to MSFT Mar 25 — pulled back to support
    ('MSFT',  '2026-03-25 10:45:00+00', true, 385.00,  3),

-- Sell remaining TSLA Apr 2 — full exit
    ('TSLA',  '2026-04-02 09:50:00+00', false, 172.00,  4),

-- Add to AAPL Apr 10 — bought the dip
    ('AAPL',  '2026-04-10 10:15:00+00', true, 185.00,  5);
