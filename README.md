# RallyUp — Smart Round-Ups, Instant Financing

**RallyUp** is a fintech web application that turns everyday transaction spare change into buying power. Users link their bank accounts, and every purchase is automatically rounded up. Those round-ups become points (1 point = $1), which unlock instant financing through a Stripe-issued virtual card.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Color System & Brand](#color-system--brand)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Routes](#api-routes)
- [Business Rules](#business-rules)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Third-Party Integrations](#third-party-integrations)
- [Pages & Screens](#pages--screens)
- [Roadmap / TODO](#roadmap--todo)

---

## Overview

RallyUp solves a simple problem: **small savings are hard to accumulate, and instant financing is hard to access**. By automatically rounding up every transaction and converting the spare change into points, users build up a balance that gives them access to a Stripe-issued virtual card with immediate installment financing.

### How It Works

1. **Link Accounts** — Connect a bank account (Plaid) and/or credit card (Stripe)
2. **Auto Round-Up** — Every transaction rounds up to the nearest $0.50 or $1.00 (user's choice)
3. **Earn Points** — Round-ups become points at a 1:1 ratio ($0.55 round-up = 0.55 points)
4. **Shop & Finance** — Use a Stripe-issued virtual card to purchase items with instant financing
5. **Auto-Pay** — Pay in 4, 8, or 12 equal installments with mandatory automatic payments

---

## Core Features

### Transaction Round-Ups
- Plaid monitors linked bank account transactions in real-time
- Users choose rounding preference: **nearest $0.50** or **nearest $1.00**
- Example: $5.45 purchase → rounds to $6.00 (whole) → earns 0.55 points
- Example: $5.45 purchase → rounds to $5.50 (half) → earns 0.05 points

### Points System
- **1 point = $1.00 in value**
- Points accumulate automatically from round-ups
- Points balance, total earned, and total spent are all tracked
- Points are used as down-payment collateral for financing

### Virtual Card & Financing
- Stripe Issuing creates a virtual card for each user
- Users can finance purchases using their points as collateral
- **Financing limit**: Purchase cannot exceed **25% of stored points value**
- **12-month cap**: Total active financing cannot exceed total round-ups from the past 12 months
- Payment schedules: **4, 8, or 12** equal installments (bi-weekly payments)
- **Auto-payment is mandatory** for all financing plans

### Authentication
- NextAuth.js (latest) with **Credentials Provider**
- JWT-based sessions
- bcrypt password hashing (12 rounds)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Custom (inspired by Headless UI Catalyst kit in `/app/components/headlessui/`) |
| **Auth** | NextAuth.js (latest) + Credentials Provider |
| **Database** | MongoDB (via Vercel MongoDB integration, native driver — no Mongoose) |
| **Payments** | Stripe (payment methods, Issuing for virtual cards) |
| **Banking** | Plaid (account linking, transaction monitoring) |
| **Images** | Vercel Blob |
| **Deployment** | Vercel |

---

## Color System & Brand

The RallyUp brand uses a palette designed to convey **trust and security** while feeling **exciting and rewarding**:

| Color | Role | Hex Range | Usage |
|-------|------|-----------|-------|
| **Brand (Blue)** | Primary — Trust & Security | `#eef5ff` → `#0f1f4d` | Buttons, links, active states, primary CTAs |
| **Accent (Green)** | Growth & Money | `#edfcf2` → `#042919` | Success states, earnings, round-up indicators |
| **Gold** | Excitement & Rewards | `#fffbeb` → `#461902` | Points, badges, premium features, financing |
| **Navy** | Foundation & Depth | `#f0f4fd` → `#0c0e24` | Backgrounds, text, cards, layout |

The colors are defined as CSS custom properties in `app/globals.css` using Tailwind v4's `@theme inline` block, making them available as utility classes: `bg-brand-600`, `text-accent-400`, `ring-gold-300`, etc.

---

## Project Structure

```
rallyup/
├── app/
│   ├── globals.css              # Tailwind + custom color tokens
│   ├── layout.tsx               # Root layout (fonts, metadata)
│   ├── page.tsx                 # Landing page (marketing)
│   │
│   ├── login/page.tsx           # Sign-in page
│   ├── register/page.tsx        # Registration page
│   │
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard sidebar layout
│   │   ├── page.tsx             # Dashboard overview (stats, quick actions)
│   │   ├── accounts/page.tsx    # Link bank accounts & payment methods
│   │   ├── points/page.tsx      # Points balance & history
│   │   ├── roundups/page.tsx    # Round-up preference settings
│   │   ├── financing/page.tsx   # Virtual card & financing applications
│   │   └── settings/page.tsx    # Profile & payment settings
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   └── register/route.ts        # User registration
│   │   ├── plaid/
│   │   │   ├── create-link-token/route.ts   # Generate Plaid Link token
│   │   │   ├── exchange-token/route.ts      # Exchange public token
│   │   │   └── transactions/route.ts        # Fetch transactions
│   │   ├── stripe/
│   │   │   ├── connect-account/route.ts     # Attach payment method
│   │   │   └── virtual-card/route.ts        # Issue virtual card
│   │   ├── points/
│   │   │   ├── balance/route.ts         # Get points balance
│   │   │   └── history/route.ts         # Get round-up history
│   │   ├── financing/
│   │   │   ├── apply/route.ts           # Apply for financing (POST) + list plans (GET)
│   │   │   └── payments/route.ts        # Process installment payment
│   │   ├── roundups/
│   │   │   └── process/route.ts         # Process round-ups from transactions
│   │   └── settings/route.ts            # Get/update user settings
│   │
│   └── components/headlessui/   # UI component library (Catalyst-inspired)
│
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── mongodb.ts       # MongoDB client singleton
│   ├── stripe.ts        # Stripe client
│   ├── plaid.ts         # Plaid client
│   └── types.ts         # TypeScript interfaces for all data models
│
├── .env.example         # Required environment variables
├── package.json
└── README.md
```

---

## Data Models

All models are defined in `lib/types.ts`. MongoDB collections:

### `users`
| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Unique, lowercase |
| `name` | string | Display name |
| `passwordHash` | string | bcrypt hash |
| `roundUpPreference` | `'half' \| 'whole'` | Round to $0.50 or $1.00 |
| `autoPaymentEnabled` | boolean | Must be true for financing |
| `stripeCustomerId` | string? | Stripe customer ID |
| `stripeIssuingCardId` | string? | Virtual card ID |
| `plaidAccessToken` | string? | Plaid access token |
| `plaidItemId` | string? | Plaid item ID |

### `pointsBalances`
| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Reference to user |
| `balance` | number | Current available points |
| `totalEarned` | number | Lifetime points earned |
| `totalSpent` | number | Lifetime points spent on financing |

### `roundUpTransactions`
| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Reference to user |
| `originalAmount` | number | Original transaction amount |
| `roundedAmount` | number | Amount after rounding |
| `roundUpAmount` | number | Difference (points earned) |
| `plaidTransactionId` | string | Unique Plaid transaction ID |
| `status` | `'pending' \| 'completed' \| 'failed'` | Processing status |

### `financingPlans`
| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Reference to user |
| `itemDescription` | string | What was purchased |
| `totalAmount` | number | Total purchase price |
| `pointsUsedAsDownPayment` | number | Points applied upfront |
| `financedAmount` | number | Amount to pay in installments |
| `installments` | `4 \| 8 \| 12` | Number of payments |
| `installmentAmount` | number | Each payment amount |
| `paidInstallments` | number | Payments completed |
| `status` | `'active' \| 'completed' \| 'defaulted'` | Plan status |
| `nextPaymentDate` | Date | Next auto-pay date |

### `financingPayments`
| Field | Type | Description |
|-------|------|-------------|
| `financingPlanId` | string | Reference to plan |
| `userId` | string | Reference to user |
| `amount` | number | Payment amount |
| `installmentNumber` | number | Which installment (1-based) |
| `stripePaymentIntentId` | string? | Stripe payment reference |

### `linkedAccounts`
| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Reference to user |
| `provider` | `'stripe' \| 'plaid'` | Provider source |
| `accountName` | string | Display name |
| `accountType` | `'credit' \| 'checking' \| 'savings'` | Account type |
| `lastFour` | string | Last 4 digits |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create new user account |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth sign-in/session |
| POST | `/api/plaid/create-link-token` | Generate Plaid Link token |
| POST | `/api/plaid/exchange-token` | Exchange Plaid public token |
| GET | `/api/plaid/transactions` | Fetch recent transactions |
| POST | `/api/stripe/connect-account` | Attach Stripe payment method |
| POST | `/api/stripe/virtual-card` | Create/retrieve virtual card |
| GET | `/api/points/balance` | Get user's points balance |
| GET | `/api/points/history` | Get round-up transaction history |
| POST/GET | `/api/financing/apply` | Apply for financing / list plans |
| POST | `/api/financing/payments` | Process an installment payment |
| POST | `/api/roundups/process` | Process round-ups from transactions |
| GET/PATCH | `/api/settings` | Get/update user settings |

---

## Business Rules

### Round-Up Calculation
```
if preference === 'half':
    roundedAmount = Math.ceil(originalAmount * 2) / 2
if preference === 'whole':
    roundedAmount = Math.ceil(originalAmount)
roundUpAmount = roundedAmount - originalAmount
```

### Financing Eligibility
1. **Points coverage**: `purchaseAmount <= pointsBalance * 0.25`
   - User must have enough points — purchase can't exceed 25% of stored points value
2. **12-month cap**: `totalActiveFinancing + newPurchase <= totalRoundUpsLast12Months`
   - Total financing across all plans cannot exceed what was rounded up in the past year
3. **Auto-payment**: User must have `autoPaymentEnabled = true` and a linked payment method
4. **Installments**: 4, 8, or 12 equal bi-weekly payments

### Example Scenario
- User has 1,000 points ($1,000 value)
- 12-month round-up total: $1,000
- **Max single financing**: $250 (25% of 1,000 points)
- **Max total financing**: $1,000 (12-month cap)
- If they finance a $200 item in 4 payments: $50 every 2 weeks

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Stripe account (with Issuing enabled for virtual cards)
- Plaid account (sandbox for development)

### Installation

```bash
# Clone and install
cd rallyup
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name (default: `rallyup`) |
| `NEXTAUTH_URL` | App URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret for JWT encryption |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PLAID_CLIENT_ID` | Plaid client ID |
| `PLAID_SECRET` | Plaid secret key |
| `PLAID_ENV` | Plaid environment (`sandbox`, `development`, `production`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |

---

## Third-Party Integrations

### Stripe
- **Payment Methods**: Attach credit cards and bank accounts to customer profiles
- **Stripe Issuing**: Virtual cards for financing purchases
- **Payment Intents**: Process installment payments (off-session, auto-confirm)
- **Customers**: Manage user billing profiles

### Plaid
- **Link**: Secure bank account connection UI
- **Transactions**: Monitor transactions for round-up processing
- **Token Exchange**: Secure access token management

### Vercel Blob
- Store user avatars and any uploaded images
- Integrated with Vercel deployment

### MongoDB
- Direct native driver connection (no Mongoose)
- Connected through Vercel's MongoDB integration
- Collections: `users`, `pointsBalances`, `roundUpTransactions`, `financingPlans`, `financingPayments`, `linkedAccounts`

---

## Pages & Screens

| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Landing / Marketing page | No |
| `/login` | Sign in | No |
| `/register` | Create account | No |
| `/dashboard` | Dashboard overview with stats | Yes |
| `/dashboard/accounts` | Link bank accounts & payment methods | Yes |
| `/dashboard/points` | Points balance & history | Yes |
| `/dashboard/roundups` | Round-up preference (half/whole dollar) | Yes |
| `/dashboard/financing` | Virtual card & financing application | Yes |
| `/dashboard/settings` | Profile, auto-pay, danger zone | Yes |

---

## Roadmap / TODO

> **Edit this section together to prioritize features!**

### Phase 1 — MVP (Current)
- [x] Project structure & color system
- [x] Authentication (NextAuth + Credentials)
- [x] MongoDB data models & connection
- [x] API routes for all core features
- [x] Dashboard UI with sidebar navigation
- [x] Landing page
- [x] All page shells (accounts, points, round-ups, financing, settings)
- [ ] Install & configure all npm dependencies
- [ ] Plaid Link frontend integration (react-plaid-link)
- [ ] Stripe Elements frontend integration (@stripe/react-stripe-js)
- [ ] Wire up dashboard stats to real API data
- [ ] Add middleware for auth-protected routes
- [ ] Vercel Blob avatar upload

### Phase 2 — Core Functionality
- [ ] Plaid webhook for real-time transaction sync
- [ ] Stripe webhook for payment confirmations
- [ ] Automatic round-up processing (cron job or webhook-driven)
- [ ] Virtual card activation flow with address collection
- [ ] Financing application with real-time eligibility check
- [ ] Auto-payment scheduling (Stripe Billing or custom cron)
- [ ] Email notifications (payment due, payment processed, plan completed)

### Phase 3 — Polish & Growth
- [ ] Transaction search & filtering
- [ ] Financing plan detail page with payment timeline
- [ ] Points analytics & projections
- [ ] Dark mode toggle (currently follows system preference)
- [ ] Mobile-responsive sidebar improvements
- [ ] Push notifications
- [ ] Referral system
- [ ] Admin dashboard

### Phase 4 — Scale
- [ ] Rate limiting on API routes
- [ ] MongoDB indexes for performance
- [ ] Stripe Connect for marketplace features
- [ ] Plaid recurring transaction detection
- [ ] Credit score integration
- [ ] Multi-currency support
