# Gradix Production Auth Configuration

## Vercel Environment Variables

```txt
NEXT_PUBLIC_APP_URL=https://gradix.vercel.app
ROOT_DOMAIN=gradix.vercel.app
```

`NEXT_PUBLIC_APP_URL` is used to generate Supabase Auth email links for registration and password reset.

## Supabase Auth URL Configuration

```txt
Site URL:
https://gradix.vercel.app

Redirect URLs:
http://localhost:3000/**
https://gradix.vercel.app/**
```

Localhost is only for local development. Production verification and password-reset emails should start with `https://gradix.vercel.app`.
