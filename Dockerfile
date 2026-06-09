FROM python:3.11-slim

WORKDIR /app

RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3128

CMD ["gunicorn", "--bind", "0.0.0.0:3128", "--workers", "2", "--timeout", "120", "app:app"]
