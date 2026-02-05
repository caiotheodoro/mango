# Installation Guide

Complete setup instructions for the Mango Expert chatbot.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Accounts for: Anthropic, Upstash, Unsplash (optional)

## 1. Clone and Install

```bash
git clone <repository-url>
cd mango
npm install
```

## 2. Environment Configuration

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) | API key starting with `sk-ant-` |
| `UPSTASH_REDIS_REST_URL` | [Upstash Console](https://console.upstash.com/) | Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | [Upstash Console](https://console.upstash.com/) | Redis authentication token |
| `UPSTASH_VECTOR_REST_URL` | [Upstash Console](https://console.upstash.com/) | Vector DB REST endpoint |
| `UPSTASH_VECTOR_REST_TOKEN` | [Upstash Console](https://console.upstash.com/) | Vector DB authentication token |

### Optional Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `UNSPLASH_ACCESS_KEY` | [Unsplash Developers](https://unsplash.com/developers) | For mango images (falls back gracefully) |

### Example `.env.local`

```bash
# Anthropic (Required)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Upstash Redis (Required)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxZ

# Upstash Vector (Required)
UPSTASH_VECTOR_REST_URL=https://xxx-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxZ

# Unsplash (Optional)
UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 3. Upstash Setup

### Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token to `.env.local`

### Vector Database

1. In Upstash Console, go to Vector
2. Create a new index with:
   - **Dimensions:** 1536 (for OpenAI embeddings)
   - **Similarity:** Cosine
3. Copy the REST URL and Token to `.env.local`

## 4. Seed Knowledge Base

Populate the vector database with mango knowledge:

```bash
npm run seed
```

This indexes content from `src/lib/knowledge/content/`:
- `varieties.md` - Mango varieties and characteristics
- `nutrition.md` - Nutritional information
- `seasons.md` - Harvest calendars
- `exports.md` - Trade statistics
- `cultivation.md` - Growing techniques

## 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run seed` | Seed vector database |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:ui` | Run tests with UI |

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Set environment variables in Vercel Dashboard under Project Settings → Environment Variables.

### Other Platforms

The app uses Edge Runtime, so it's compatible with:
- Vercel Edge Functions
- Cloudflare Workers (with adapter)
- Netlify Edge Functions

Ensure your platform supports:
- Edge Runtime
- Streaming responses
- Environment variables

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"

Ensure `.env.local` has the correct key and restart the dev server.

### "Vector search returns no results"

Run `npm run seed` to populate the knowledge base.

### "Rate limit exceeded"

The app includes rate limiting. Wait a moment or adjust limits in `src/lib/constants.ts`.

### "Images not loading"

Check `UNSPLASH_ACCESS_KEY` is set. The app works without it but won't show images.

## Updating Knowledge Base

1. Edit markdown files in `src/lib/knowledge/content/`
2. Re-run `npm run seed`

Each file should have YAML frontmatter:

```markdown
---
title: Document Title
source: Source Name
sourceUrl: https://example.com/source
dataDate: 2024
---

Content here...
```
