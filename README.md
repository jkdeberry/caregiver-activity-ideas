# Caregiver Activity Ideas (working name)

Gentle, simple activity ideas for caregivers of older adults, including people with memory changes or dementia. Ideas only: this is not medical advice or therapy.

Enter a topic (or tap a suggestion), optionally add how the person is doing today, the setting, time available, and a line about them. You get one idea with supplies, steps, safety notes, and what to say if they get frustrated. You can try another, copy it, or print it.

## How it works

- Static site: `index.html`, `src/style.css`, `src/index.js`.
- `netlify/functions/generate.js` calls the Claude API server-side. The API key never reaches the browser.
- Nothing users type is stored.

## Deploy on Netlify

1. Connect this repo to Netlify (publish directory `.`, functions directory `netlify/functions`, already set in `netlify.toml`).
2. In Site settings → Environment variables, add `ANTHROPIC_API_KEY`. Optionally set `ANTHROPIC_MODEL` (defaults to `claude-haiku-4-5-20251001`).
3. Set a monthly spend limit on the key in the Anthropic console. The in-function rate limit is best-effort only.

## Run locally

```
npm i -g netlify-cli
ANTHROPIC_API_KEY=your-key netlify dev
```

Never commit a key. `.env` files are git-ignored.
