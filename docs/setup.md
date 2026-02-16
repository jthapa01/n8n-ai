# Environment Setup Guide

This guide will help you set up the n8n-ai project locally.

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- PostgreSQL database (or Neon serverless PostgreSQL)
- ngrok account (for webhook testing)

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Run database migrations:

```bash
npx prisma migrate dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# ===========================================
# DATABASE
# ===========================================
# PostgreSQL connection string
# For Neon: Get from https://console.neon.tech
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# ===========================================
# AUTHENTICATION (Better Auth)
# ===========================================
# Random secret for signing sessions (generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET="your-random-secret-here"

# Base URL of your application
BETTER_AUTH_URL="http://localhost:3000"

# ===========================================
# ENCRYPTION
# ===========================================
# 64-character hex key for encrypting credentials (generate with: openssl rand -hex 32)
ENCRYPTION_KEY="your-64-char-hex-key-here"

# ===========================================
# AI PROVIDERS (Optional - add the ones you need)
# ===========================================
# OpenAI API Key - https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-..."

# Anthropic (Claude) API Key - https://console.anthropic.com/
ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini API Key - https://aistudio.google.com/apikey
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."

# ===========================================
# SENTRY (Optional - Error Tracking)
# ===========================================
# Get from https://sentry.io
SENTRY_AUTH_TOKEN="sntrys_..."

# ===========================================
# POLAR (Optional - Subscriptions/Payments)
# ===========================================
# Get from https://polar.sh
POLAR_ACCESS_TOKEN="polar_oat_..."
POLAR_SUCCESS_URL="http://localhost:3000"

# ===========================================
# NGROK (Required for Webhooks)
# ===========================================
# Your ngrok static URL (without https://)
# Get a free static domain at https://dashboard.ngrok.com/cloud-edge/domains
NGROK_URL="your-subdomain.ngrok-free.dev"

# ===========================================
# NEXT.JS
# ===========================================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Sample .env File

Here's a minimal `.env.example` you can copy:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/n8n_ai"

# Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-hex-32"
BETTER_AUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="generate-64-char-hex-key"

# AI Providers (add at least one)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY=""

# Webhooks
NGROK_URL="your-subdomain.ngrok-free.dev"

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Generating Secrets

### BETTER_AUTH_SECRET
```bash
openssl rand -hex 32
```

### ENCRYPTION_KEY
```bash
openssl rand -hex 32
```

## Running the Application

### Development Mode (All Services)

This starts Next.js, Inngest Dev Server, and ngrok tunnel:

```bash
npm run dev:all
```

### Individual Services

```bash
# Next.js only
npm run dev

# Inngest Dev Server only
npm run inngest:dev

# ngrok tunnel only
npm run ngrok:dev

# Prisma Studio (database viewer)
npm run db:studio
```

## Setting Up External Services

### 1. Database (Neon)

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

### 2. ngrok (Webhooks)

1. Sign up at [ngrok](https://ngrok.com)
2. Go to [Domains](https://dashboard.ngrok.com/cloud-edge/domains)
3. Create a free static domain
4. Copy the domain (without `https://`) to `NGROK_URL`
5. Update the `ngrok:dev` script in `package.json` with your domain

### 3. AI Providers

- **OpenAI**: [Get API Key](https://platform.openai.com/api-keys)
- **Anthropic**: [Get API Key](https://console.anthropic.com/)
- **Gemini**: [Get API Key](https://aistudio.google.com/apikey)

### 4. Polar (Optional - Payments)

1. Go to [Polar.sh](https://polar.sh)
2. Create an organization
3. Get your access token from settings

## Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Database Connection Issues
- Ensure `DATABASE_URL` is correct
- Check if SSL is required (`?sslmode=require`)

### Inngest Not Receiving Events
- Make sure Inngest Dev Server is running (`npm run inngest:dev`)
- Check the Inngest dashboard at `http://localhost:8288`

### Webhooks Not Working
- Ensure ngrok is running (`npm run ngrok:dev`)
- Verify `NGROK_URL` matches your ngrok domain
- Check ngrok dashboard for incoming requests
