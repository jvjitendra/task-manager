FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD sh -c 'gunicorn --bind 0.0.0.0:${PORT:-5000} app:app'
