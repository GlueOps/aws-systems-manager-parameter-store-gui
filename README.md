# AWS SSM Parameter Store GUI

A simple, local-only web GUI for managing AWS Systems Manager Parameter Store parameters. Runs entirely in a Docker container — just provide your AWS credentials via `.env`.

## Features

- **Browse** parameters by path prefix with breadcrumb navigation
- **Search** parameters by name
- **Create** new parameters (String, SecureString, StringList)
- **Edit** single parameters inline
- **Bulk edit** multiple parameters at once
- **Copy** parameters to a new path (e.g., `/dev/app/` → `/staging/app/`)
- **Delete** single or multiple parameters with confirmation
- **View history** — see all versions of a parameter with timestamps

## Quick Start

```bash
# 1. Copy the example env file and fill in your AWS credentials
cp .env.example .env

# 2. Edit .env with your credentials
#    AWS_ACCESS_KEY_ID=...
#    AWS_SECRET_ACCESS_KEY=...
#    AWS_REGION=us-east-1

# 3. Build and run
docker compose up --build

# 4. Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Yes | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | Your AWS secret key |
| `AWS_REGION` | Yes | AWS region (e.g., `us-east-1`) |
| `AWS_SESSION_TOKEN` | No | Session token for temporary credentials |

## Development

```bash
npm install

# Start API server with hot reload
npm run dev:server

# In another terminal, start Vite dev server
npm run dev:client

# Client runs on :5173 and proxies API calls to :3000
```
