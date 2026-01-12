FROM python:3.11.14-slim

LABEL maintainer="tomer.klein@gmail.com"

ENV PYTHONIOENCODING=utf-8
ENV ENABLE_GOOGLE_ANALYTICS=True
ENV LANG=C.UTF-8

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends fping && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create working directory
RUN mkdir -p /opt/broadlinkmanager/data

WORKDIR /opt/broadlinkmanager/

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt

# Copy application files
COPY broadlinkmanager /opt/broadlinkmanager

EXPOSE 7020

ENTRYPOINT ["/usr/local/bin/python3", "broadlinkmanager.py"]