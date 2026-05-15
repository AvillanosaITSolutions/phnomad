# Visa Reminder (Minimal)

A focused utility app to help travelers avoid visa overstays.

Core message: Get SMS and email reminders before your visa expires.

## Stack

- Frontend: React + Vite + TypeScript + TailwindCSS + React Router + TanStack Query
- Backend: NestJS + TypeScript + Prisma + PostgreSQL + JWT + Google OAuth token login
- Notifications: PhilSMS API + Nodemailer
- Scheduler: Daily cron reminders
- Billing: Subscription model tracked in the database with PayMongo payment links

## Features

- Google-only authentication (`POST /auth/google`)
- Immediate onboarding for first-time users
- Visa CRUD and reminder settings
- Daily reminder checks for: 30, 14, 7, 3, 1, and expiry day
- Duplicate reminder prevention via `NotificationLog`
- Test endpoints for SMS and email
- Subscription persistence in the database and PayMongo-based payment flows

## Project Structure

- `frontend` - React application
- `backend` - NestJS API + Prisma schema
- `docker-compose.yml` - Frontend, backend, and PostgreSQL services

## Local Setup

1. Copy environment files:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
2. Install dependencies:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3. Generate Prisma client and run migrations:
   - `cd ../backend`
   - `npm run prisma:generate`
   - `npx prisma migrate dev --name init`
4. Run applications:
   - Backend: `npm run start:dev`
   - Frontend: `cd ../frontend && npm run dev`

## Docker Setup

1. Prepare env files (`backend/.env`, `frontend/.env`).
2. Run:
   - `docker compose up --build`

## API Endpoints

- `POST /auth/google`
- `GET /auth/me`
- `POST /visas`
- `GET /visas`
- `PATCH /visas/:id`
- `DELETE /visas/:id`
- `POST /notifications/test-sms`
- `POST /notifications/test-email`
- `GET /subscriptions/me`
- `POST /subscriptions/topup/checkout`
- `POST /subscriptions/paymongo/webhook`

## Billing Notes

- Subscription state is stored in the `Subscription` table and shown in the dashboard.
- Top-up checkout sessions are created server-side through PayMongo.
- The payment provider for a subscription is recorded in the `provider` field.
- SMS credits are sold as top-up packages in the dashboard.
- Webhook endpoint: `POST /subscriptions/paymongo/webhook`.
- Protect the webhook by setting `PAYMONGO_WEBHOOK_AUTH`. You can authorize either by:
   - `Authorization: Bearer <PAYMONGO_WEBHOOK_AUTH>` header, or
   - adding `?token=<PAYMONGO_WEBHOOK_AUTH>` to the webhook URL (for providers that cannot set custom headers).

## Product Scope Guardrails

This app intentionally excludes social, chat, maps, blogs, forums, marketplaces, AI features, and complex analytics.
