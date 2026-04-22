# Portfolio App

A stock portfolio tracker with a Flask REST API and React frontend, backed by Postgres.

## Requirements

- [Podman](https://podman.io/) — for containerised runs
- Python 3.11+ with `venv` — for local dev
- Node 20+ — for local frontend dev

---

## Containerised (Podman pod)

All three services — Postgres, Flask, and React/nginx — run inside a single Podman pod.

### First-time setup

```bash
make setup
```

This runs in order: `build` → `volume` → `pod` → `start-db` → `db-init` → `start-flask` → `start-react`.

The app is available at **http://localhost:3000**.

### Day-to-day

| Command | Description |
|---|---|
| `make start` | Start all containers (pod must already exist) |
| `make stop` | Stop all containers individually |
| `make restart` | Full clean and restart |
| `make clean` | Stop and remove all containers and the pod |

### Building images

```bash
make build          # build both
make build-flask    # Flask only
make build-react    # React only
```

The React image bakes `VITE_API_BASE=/api` at build time so the frontend proxies through nginx to Flask.

### Logs

```bash
make logs-flask
make logs-react
make logs-db
```

### Database

```bash
make db-init    # apply schema (required once after first start-db)
make db-mock    # load mock snapshots and transactions
make db-shell   # open a psql shell inside the running container
```

---

## Local development

Run Flask and React directly on the host against a standalone Postgres container.

### One-time setup

```bash
make backend-venv       # create Python venv
make install            # pip install + npm install
```

### Start Postgres (standalone container, port 5432)

```bash
make db-up
```

Apply the schema once:

```bash
# Wait a few seconds for Postgres to be ready, then:
podman exec -i portfolio-db-dev psql -U postgres -d portfolio < portfolio-rest/schema.sql
```

Reset the database:

```bash
make db-reset
```

Remove the data volume entirely:

```bash
make db-volume-rm
```

### Run the backend

Set any required environment variables, then:

```bash
export ALPHA_VANTAGE_API_KEY=your_key_here   # if using alphavantage provider
make dev-flask
```

Flask runs at **http://localhost:5000**.

### Run the frontend

```bash
make dev-react
```

React dev server runs at **http://localhost:5173** and reads `VITE_API_BASE` from `portfolio-react/.env`.

### Stop Postgres when done

```bash
make db-down
```

---

## Configuration

| File | Purpose |
|---|---|
| `portfolio-rest/config.ini` | Provider selection, cache TTL, rate limit delays, database URL |
| `portfolio-react/.env` | `VITE_API_BASE` (dev server URL), `VITE_BATCH_QUOTES` flag |

### Stock provider

Set `provider` under `[settings]` in `config.ini`:

```ini
[settings]
provider = yfinance       # default — no API key needed
; provider = alphavantage  # requires ALPHA_VANTAGE_API_KEY env var
; provider = mock          # static data, no network calls
```

### Rate limiting

Adjust per-provider delays in `config.ini`:

```ini
[yfinance]
request_delay = 0.5       # seconds between quote calls

[alphavantage]
request_delay = 12.0      # free tier: 5 requests/min
```

### Batch quotes

Set `VITE_BATCH_QUOTES=true` in `portfolio-react/.env` to fetch all quotes in a single `/quotes` request instead of one `/quote` per symbol. Requires a dev server restart to take effect.
