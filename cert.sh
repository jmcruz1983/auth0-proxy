#/bin/sh

set -euo pipefail

BASE_DIR=${BASE_DIR:-.}
CERT_DIR=$BASE_DIR/certs
mkdir -p $CERT_DIR

KEY_PEM=$CERT_DIR/key.pem
CERT_PEM=$CERT_DIR/cert.pem

openssl req -new -newkey rsa:4096 -nodes -x509 \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" \
    -keyout $KEY_PEM -out $CERT_PEM

echo "Generated PEM certificate $CERT_PEM"