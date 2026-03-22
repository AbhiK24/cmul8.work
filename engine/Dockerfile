FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY engine/ ./engine/

# Expose port
EXPOSE 8080

# Run the application as a package
CMD ["uvicorn", "engine.main:app", "--host", "0.0.0.0", "--port", "8080"]
