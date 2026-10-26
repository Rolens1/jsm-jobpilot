# Rationale: 0016. Vercel Deployment Architecture, CI/CD Pipeline and Live Release

**Date**: 2026-10-26  
**Status**: In Progress  

## Context

JobPilot is a full stack Next.js 16 application incorporating Partial Prerendering, Cache Components, Turbopack, InsForge PostgreSQL BaaS, PostHog telemetry, and multi provider AI and search agents. We require a deployment architecture that supports modern Next.js 16 runtime features while maintaining seamless continuous integration and reliable serverless function execution.

## Options Considered

### Option 1: Vercel Native Edge & Serverless Platform with Git Integration (Chosen)
- **Architecture**: Host the application on Vercel natively linked to the GitHub repository `Rolens1/jsm-jobpilot`.
- **Pros**:
  - Full first class compatibility with Next.js 16 Turbopack, Partial Prerendering, Cache Components, and `proxy.ts`.
  - Zero server management, automatic SSL certificate provisioning, and global CDN edge routing.
  - Automated preview deployments for every pull request and instant production releases on merges to `master`.
  - Configurable serverless function memory and duration via `vercel.json`.
- **Cons**: Requires configuring environment variables in the Vercel dashboard and ensuring function execution remains under 60 seconds.

### Option 2: Self Hosted Node.js Container (Docker on AWS / Render / Railway)
- **Architecture**: Package the application into a standalone Docker container and deploy on a virtual machine or container runner.
- **Pros**: Unlimited execution duration for background jobs.
- **Cons**: High operational complexity, requires maintaining reverse proxies, SSL certificates, manual cache invalidation, and custom CI/CD pipelines. Lacks optimized Next.js edge caching.

### Option 3: Static Export
- **Architecture**: Compile application to pure static files (`output: 'export'`).
- **Cons**: Incompatible with Server Actions, authenticated HTTP-only cookies, dynamic API route handlers, and SSR PDF generation. Rejected.

## Decision

We choose **Option 1: Vercel Native Platform with Git Integration**. It is the reference deployment environment for Next.js 16, provides zero maintenance continuous deployment, and enables exact alignment with our production environment specification.

## References

- Vercel Next.js Deployment Documentation: `https://vercel.com/docs/frameworks/nextjs`
- Vercel Serverless Function Limits: `https://vercel.com/docs/functions/runtimes#maxduration`
- InsForge BaaS Production Guidelines: [docs/deployment/insforge-setup.md](docs/deployment/insforge-setup.md)
