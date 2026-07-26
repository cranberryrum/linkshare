# Linkshare.live

Temporary link and text sharing via short 4-digit codes. Drop content, share the code, retrieve it elsewhere — no accounts required.

**Live:** [linkshare.live](https://linkshare.live)

## Features

- Share a URL or plain text as a “drop”
- Retrieve content with a 4-digit code
- 10-minute expiry on every drop
- Max 5 active drops at a time
- QR code for quick mobile handoff
- Countdown timers and toast feedback
- Apple-inspired UI with consistent spacing and overflow handling for long content

## Tech stack

| Layer | Tools |
| --- | --- |
| UI | React 18, TypeScript, Tailwind CSS |
| Build | Vite |
| Backend | Supabase |
| UX | Sonner (toasts), Lucide (icons), react-qr-code |
| Analytics | PostHog |

## Local setup

```bash
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173).

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

Supabase is configured in `src/lib/supabase.ts`. Prefer environment variables for keys; do not commit secrets.

## Project structure

```
src/
  components/   # Drop/retrieve forms, results, modals, layout
  contexts/     # Shared drop state (LinkContext)
  hooks/        # Countdown and async action helpers
  lib/          # Supabase client
  utils/        # Code generation
  App.tsx       # App shell
  main.tsx      # Entry point
  index.css     # Global styles / design tokens
```

## Usage

1. **Drop** — Enter a link or text, submit, and copy the 4-digit code (or show the QR).
2. **Retrieve** — Enter the code on another device to open the shared content.
3. Drops expire after 10 minutes and are limited to 5 active at once.
