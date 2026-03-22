FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY shell/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY shell/ ./shell/

# Run the application as a package
CMD ["uvicorn", "shell.main:app", "--host", "0.0.0.0", "--port", "8080"]
