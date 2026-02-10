# Backend FastAPI - Development
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copier la config uv
COPY pyproject.toml uv.lock .

# Installer uv puis les dépendances Python
RUN pip install --no-cache-dir uv \
    && uv sync --frozen --no-install-project

# Exposer le port
EXPOSE 8000

# Lancer l'application avec hot reload
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
