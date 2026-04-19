#!/bin/bash

# Generates a GitHub App installation token using openssl + curl.
# No external dependencies required.
#
# Usage: bash get-github-app-token.sh <APP_ID_ENV> <PRIVATE_KEY_ENV> <INSTALLATION_ID_ENV>
# Example: bash get-github-app-token.sh AND_LUCIQ_APP_ID AND_LUCIQ_PRIVATE_KEY AND_LUCIQ_INSTALLATION_ID
# Example: bash get-github-app-token.sh AND_INSTABUG_APP_ID AND_INSTABUG_PRIVATE_KEY AND_INSTABUG_INSTALLATION_ID

set -euo pipefail

APP_ID_ENV="${1:?Usage: $0 <APP_ID_ENV> <PRIVATE_KEY_ENV> <INSTALLATION_ID_ENV>}"
PRIVATE_KEY_ENV="${2:?Usage: $0 <APP_ID_ENV> <PRIVATE_KEY_ENV> <INSTALLATION_ID_ENV>}"
INSTALL_ID_ENV="${3:?Usage: $0 <APP_ID_ENV> <PRIVATE_KEY_ENV> <INSTALLATION_ID_ENV>}"

APP_ID="${!APP_ID_ENV:?Error: $APP_ID_ENV is not set}"
PRIVATE_KEY="${!PRIVATE_KEY_ENV:?Error: $PRIVATE_KEY_ENV is not set}"
INSTALL_ID="${!INSTALL_ID_ENV:?Error: $INSTALL_ID_ENV is not set}"

# Reconstruct PEM file from flattened env var
# CircleCI flattens multiline env vars into a single line,
# so we extract header/footer and re-wrap the base64 body at 64 chars
PEM_FILE=$(mktemp)
chmod 600 "$PEM_FILE"
trap 'rm -f "$PEM_FILE"' EXIT

BODY=$(printf '%s' "$PRIVATE_KEY" | sed 's/-----BEGIN RSA PRIVATE KEY-----//;s/-----END RSA PRIVATE KEY-----//;s/ //g')
{
    echo "-----BEGIN RSA PRIVATE KEY-----"
    echo "$BODY" | fold -w 64
    echo "-----END RSA PRIVATE KEY-----"
} > "$PEM_FILE"

# Base64url encode (RFC 4648): replace +/ with -_, strip =
b64url() {
    openssl base64 -A | tr '+/' '-_' | tr -d '='
}

NOW=$(date +%s)
IAT=$((NOW - 60))    # 60s clock skew allowance per GitHub docs
EXP=$((NOW + 600))   # 10min max JWT lifetime per GitHub docs

# Create JWT header and payload
HEADER=$(printf '{"alg":"RS256","typ":"JWT"}' | b64url)
PAYLOAD=$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' "$IAT" "$EXP" "$APP_ID" | b64url)

# Sign with RSA-SHA256
SIGNATURE=$(printf '%s.%s' "$HEADER" "$PAYLOAD" | openssl dgst -sha256 -sign "$PEM_FILE" -binary | b64url)

JWT_TOKEN="${HEADER}.${PAYLOAD}.${SIGNATURE}"

# Exchange JWT for installation token
RESPONSE=$(curl -sf -X POST \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/app/installations/${INSTALL_ID}/access_tokens") || {
    echo "Error: GitHub API request failed (HTTP error)" >&2
    exit 1
}

TOKEN=$(echo "$RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // "unknown error"')
    echo "Error: Failed to get installation token: $ERROR_MSG" >&2
    exit 1
fi

echo "$TOKEN"
