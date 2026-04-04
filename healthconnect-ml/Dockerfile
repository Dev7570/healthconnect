FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY models/ models/
COPY app.py .

EXPOSE 5001

CMD ["python", "app.py"]
