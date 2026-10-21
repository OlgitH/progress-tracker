# MY STUDIO

This is a simple app designed for The Studio in Bath that allows you to set goals and track progress of those goals, so we can monitor progression on a yealry basis.

## Useful scripts

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## API endpoints
## Social Exchange setup

1. Run `supabase_social_exchange_setup.sql`, then `supabase_social_exchange_seed.sql`, in the Supabase SQL editor.
2. Create a Slack app (bot) with scopes `chat:write`, `users:read`, `users:read.email`, install it to the workspace, and set `SLACK_BOT_TOKEN` in `.env.local` (and `NEXT_PUBLIC_SITE_URL` for the link in notifications).
3. Run `SLACK_BOT_TOKEN=... node scripts/link-slack-members.mjs > slack-links.sql` and run the output in Supabase. This adds emails and Slack ids to the seeded members so they link to their account on first sign-in.
