#!/bin/bash

# Generate self-signed SSL certificate for nginx

echo "Generating self-signed SSL certificate..."

mkdir -p nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "SSL certificate generated successfully!"
echo "Certificate: nginx/ssl/cert.pem"
echo "Private Key: nginx/ssl/key.pem"
