FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure the model is downloaded during build or early runtime if possible, 
# but for now we'll let app.py handle it on startup (might be slow first time)

CMD ["gunicorn", "--bind", "0.0.0.0:8001", "app:app"]
