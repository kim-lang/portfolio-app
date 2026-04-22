REACT_IMAGE  = portfolio-react
FLASK_IMAGE  = portfolio-flask
POD_NAME     = portfolio-pod

BACKEND_DIR  = portfolio-rest
FRONTEND_DIR = portfolio-react

DB_NAME   ?= portfolio
DB_USER   ?= postgres
DB_PASS   ?= postgres
DB_PORT   ?= 5432
DB_VOLUME ?= portfolio-db-data

.PHONY: help build build-react build-flask volume pod start start-db start-flask start-react stop clean restart \
        logs-react logs-flask logs-db db-init db-mock db-shell db-logs db-volume-rm db-up db-down db-reset \
        backend-venv backend-install backend-run backend-clean frontend-install frontend-run install setup \
        dev-flask dev-react

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  build         Build both images"
	@echo "  build-react   Build the React image"
	@echo "  build-flask   Build the Flask image"
	@echo "  volume        Create the Postgres data volume"
	@echo "  pod           Create the pod"
	@echo "  start         Start all containers"
	@echo "  start-db      Start Postgres in pod"
	@echo "  start-flask   Start Flask in pod"
	@echo "  start-react   Start React in pod"
	@echo "  stop          Stop all containers"
	@echo "  clean         Stop and remove all containers and pod"
	@echo "  restart       Clean then recreate everything"
	@echo "  logs-react    Tail React logs"
	@echo "  logs-flask    Tail Flask logs"
	@echo "  logs-db       Tail Postgres logs"
	@echo "  db-init       Create database tables"
	@echo "  db-mock       Load mock data"
	@echo "  db-shell      Open a psql shell"
	@echo "  db-up         Start a standalone Postgres container (dev)"
	@echo "  db-down       Stop and remove the standalone Postgres container"
	@echo "  db-reset      db-down then db-up"
	@echo "  db-volume-rm  Remove the Postgres data volume"
	@echo "  setup         Full setup from scratch (build, volume, pod, start, db-init)"
	@echo "  dev-flask     Run Flask locally in dev mode"
	@echo "  dev-react     Run React locally in dev mode"

# --- Container build ---

build: build-react build-flask

build-react:
	podman build -t $(REACT_IMAGE) ./$(FRONTEND_DIR)

build-flask:
	podman build -t $(FLASK_IMAGE) ./$(BACKEND_DIR)

# --- Pod setup ---

volume:
	podman volume create $(DB_VOLUME) || true

pod:
	podman pod create \
		--name $(POD_NAME) \
		-p 3000:80 \
		-p 5000:5000 \
		-p 5432:5432

# --- Start containers ---

start-db:
	podman run -d \
		--pod $(POD_NAME) \
		--name portfolio-db \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASS) \
		-e POSTGRES_DB=$(DB_NAME) \
		-v $(DB_VOLUME):/var/lib/postgresql/data:Z \
		docker.io/library/postgres:16
	sleep 5

start-flask:
	podman run -d \
		--pod $(POD_NAME) \
		--name portfolio-flask \
		-e DATABASE_URL=postgresql://$(DB_USER):$(DB_PASS)@localhost:5432/$(DB_NAME) \
		-v ./$(BACKEND_DIR)/config.ini:/app/config.ini:ro,Z \
		$(FLASK_IMAGE)

start-react:
	podman run -d \
		--pod $(POD_NAME) \
		--name portfolio-react \
		$(REACT_IMAGE)

start: start-db start-flask start-react

# --- Lifecycle ---

stop:
	podman stop portfolio-react || true
	podman stop portfolio-flask || true
	podman stop portfolio-db || true

clean: stop
	podman rm portfolio-react -f || true
	podman rm portfolio-flask -f || true
	podman rm portfolio-db -f || true
	podman pod rm $(POD_NAME) || true

restart: clean pod start

# --- Logs ---

logs-react:
	podman logs -f portfolio-react

logs-flask:
	podman logs -f portfolio-flask

logs-db:
	podman logs -f portfolio-db

# --- Database (pod) ---

db-init:
	podman exec -i portfolio-db psql -U $(DB_USER) -d $(DB_NAME) < $(BACKEND_DIR)/schema.sql

db-mock:
	podman exec -i portfolio-db psql -U $(DB_USER) -d $(DB_NAME) < $(BACKEND_DIR)/providers/mock_snapshots.sql
	podman exec -i portfolio-db psql -U $(DB_USER) -d $(DB_NAME) < $(BACKEND_DIR)/providers/mock_transactions.sql

db-shell:
	podman exec -it portfolio-db psql -U $(DB_USER) -d $(DB_NAME)

db-logs:
	podman logs -f portfolio-db

db-volume-rm: stop
	podman volume rm $(DB_VOLUME)

# --- Database (standalone dev) ---

db-up:
	podman volume create $(DB_VOLUME) 2>/dev/null || true
	podman run -d \
		--name portfolio-db-dev \
		-e POSTGRES_DB=$(DB_NAME) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASS) \
		-p $(DB_PORT):5432 \
		-v $(DB_VOLUME):/var/lib/postgresql/data:Z \
		docker.io/library/postgres:16

db-down:
	podman stop portfolio-db-dev && podman rm portfolio-db-dev

db-reset: db-down db-up

# --- Dev ---

backend-venv:
	python3 -m venv $(BACKEND_DIR)/venv

backend-install:
	$(BACKEND_DIR)/venv/bin/pip install -r $(BACKEND_DIR)/requirements.txt

backend-run:
	$(BACKEND_DIR)/venv/bin/python $(BACKEND_DIR)/app.py

backend-clean:
	rm -rf $(BACKEND_DIR)/venv $(BACKEND_DIR)/__pycache__

frontend-install:
	cd $(FRONTEND_DIR) && npm install

frontend-run:
	cd $(FRONTEND_DIR) && npm run dev

install: backend-install frontend-install

dev-flask:
	cd $(BACKEND_DIR) && . venv/bin/activate && python app.py

dev-react:
	cd $(FRONTEND_DIR) && npm run dev

# --- Full setup ---

setup: build volume pod start-db db-init start-flask start-react
	@echo "Setup complete. App is running at http://localhost:3000"

# --- Clean dev artifacts ---

clean-dev: backend-clean
	cd $(FRONTEND_DIR) && rm -rf node_modules
