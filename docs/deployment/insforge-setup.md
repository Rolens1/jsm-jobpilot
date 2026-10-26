# InsForge Production Deployment & Security Setup Guide

This document defines the production security, network, and authentication configuration required in the InsForge dashboard for JobPilot deployments on Vercel.

---

## 1. Authentication & OAuth Callback Whitelisting

InsForge Auth utilizes PKCE (Proof Key for Code Exchange) flows for candidate authentication and OAuth providers. In production, callback URLs must be explicitly registered to prevent open redirect vulnerabilities and token interception.

### Permitted Redirect URIs
In your **InsForge Dashboard -> Authentication -> URL Configuration**:

Add the following authorized redirect URLs:
```text
http://localhost:3000/callback
https://<your-project-name>.vercel.app/callback
https://<your-custom-domain.com>/callback (if custom domain is active)
```

> **Security Rule**: Do not whitelist wildcard domains such as `https://*-<team>.vercel.app/callback`. Restricting redirects strictly to your canonical production domain isolates OAuth tokens from ephemeral or PR preview deployments.

---

## 2. CORS (Cross-Origin Resource Sharing) Allowed Origins

InsForge PostgreSQL API and Storage buckets enforce CORS policies on browser-initiated HTTP and WebSocket requests.

### Permitted CORS Origins
In your **InsForge Dashboard -> Project Settings -> API & CORS**:

Ensure the following origins are allowed:
```text
http://localhost:3000
https://<your-project-name>.vercel.app
https://<your-custom-domain.com>
```

---

## 3. Storage Bucket Configuration (`resumes`)

JobPilot stores candidate resumes as PDF files in a dedicated storage bucket.

### Bucket Policy
In your **InsForge Dashboard -> Storage -> Buckets**:

1. **Bucket Name**: `resumes`
2. **Public Access**: Disabled (Private)
3. **Row-Level Security (RLS)**:
   - **Upload (INSERT)**: Permitted only for authenticated users where path starts with their user ID: `auth.uid()::text = (storage.foldername(name))[1]`.
   - **Read (SELECT)**: Permitted only for authenticated users reading their own files.
   - **Delete (DELETE)**: Permitted only for authenticated users deleting their own files.

---

## 4. Production Database Connection & Environment Variables

JobPilot interacts with InsForge via `@insforge/sdk` and `@insforge/sdk/ssr`.

### Required Vercel Environment Variables
Add these to your **Vercel Project Settings -> Environment Variables**:

| Variable Name | Environment | Value Description |
|---|---|---|
| `NEXT_PUBLIC_INSFORGE_URL` | Production, Preview, Development | Base URL (e.g. `https://your-project.region.insforge.app`) |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Production, Preview, Development | Public Anonymous Key from InsForge API settings |
| `INSFORGE_API_KEY` | Production (Optional) | Service / secret key for backend maintenance (never expose to client) |

---

## 5. Session Cookie Security Invariants

In production (`NODE_ENV === "production"`):
- All session cookies set by `@insforge/sdk/ssr/middleware` (`insforge_access_token`, `insforge_refresh_token`) automatically carry:
  - `Secure: true` (only sent over HTTPS)
  - `HttpOnly: true` (inaccessible to browser JavaScript)
  - `SameSite: Lax` (prevents cross-site request forgery while preserving top-level navigation)
