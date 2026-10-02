# Backend Security API (Node.js / Express)

A secure REST API microservice demonstrating:
- **Dynamic API Key (`x-api-key`) Verification** with hot secret reloading from `/shared-secrets/api_secret.txt`.
- **AES-256 Database Encryption** using a static `DATABASE_ENCRYPTION_KEY` that guarantees long-term decryptability of persistent data.

## Endpoints
- `GET /health` (Public): Healthcheck endpoint.
- `GET /api/data` (Protected): Protected data retrieval.
- `POST /api/data` (Protected): Protected data submission.
- `POST /api/items` (Protected): Encrypts sensitive content with AES-256 and saves to persistent JSON database.
- `GET /api/items` (Protected): Retrieves and decrypts all records on-the-fly.
- `GET /api/status` (Protected): Diagnostics endpoint showing preview of active rotated API key and static DB key.

## Running Locally with Docker
```bash
docker build -t security-backend-api .
docker run -p 3000:3000 -v shared_secrets:/shared-secrets -v backend_data:/app/data security-backend-api
```
