FROM python:3.13.0-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VIRTUALENVS_CREATE=false
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="${POETRY_HOME}/bin:${PATH}"

# Set Python path to include the project directory
ENV PYTHONPATH=/app

# Copy poetry files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy project files
COPY manage.py .
COPY api ./api
COPY engine ./engine

# Expose port
EXPOSE 8000

# Run the application
CMD ["poetry", "run", "gunicorn", "--bind", "0.0.0.0:8000", "--chdir", "/app", "api.wsgi"]