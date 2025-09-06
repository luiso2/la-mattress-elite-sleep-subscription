# Elite Sleep+ Subscription Platform (Next.js)

A complete subscription management platform built with Next.js 15, Stripe, and TypeScript.

## Features

- **Authentication System**: JWT-based authentication with register/login
- **Stripe Integration**: 
  - Subscription checkout
  - Billing portal
  - Webhook handling
  - Payment processing
- **User Dashboard**: View subscription status and manage account
- **Email Notifications**: Welcome emails, subscription confirmations
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **API Routes**: RESTful API endpoints for all operations
- **Security**: Rate limiting, CORS configuration, secure headers

## Tech Stack

- **Framework**: Next.js 15.5 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Payments**: Stripe
- **Authentication**: JWT
- **Email**: Nodemailer
- **Security**: bcryptjs, rate limiting

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Stripe account (for API keys)
- SMTP credentials (for emails)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stripe-subscription-next
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
- Stripe API keys
- JWT secret
- Email SMTP settings

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production

Build for production:

```bash
npm run build
npm start
```

## Deployment on Railway

This project is configured for easy deployment on Railway:

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically

Railway will detect Next.js and configure the build and start commands automatically.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Subscription
- `POST /api/subscription/create-checkout` - Create Stripe checkout session
- `POST /api/subscription/portal` - Access billing portal
- `POST /api/subscription/cancel` - Cancel subscription

### Webhooks
- `POST /api/webhook/stripe` - Stripe webhook endpoint

## Stripe Webhook Configuration

To receive webhooks from Stripe:

1. Get your webhook endpoint URL:
   - Local: Use ngrok or similar: `https://your-domain.ngrok.io/api/webhook/stripe`
   - Production: `https://your-domain.com/api/webhook/stripe`

2. Configure in Stripe Dashboard:
   - Go to Developers → Webhooks
   - Add endpoint with your URL
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. Copy the webhook signing secret to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Project Structure

```
stripe-subscription-next/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── subscription/ # Subscription endpoints
│   │   └── webhook/      # Webhook handlers
│   ├── dashboard/        # Dashboard page
│   ├── login/           # Login page
│   ├── pricing/         # Pricing page
│   ├── register/        # Registration page
│   └── page.tsx         # Home page
├── components/          # React components
├── lib/
│   ├── config/         # Configuration
│   ├── middleware/     # Auth middleware
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
└── middleware.ts       # Next.js middleware
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on auth endpoints
- CORS configuration
- Secure headers
- Environment variable validation
- Stripe signature verification for webhooks

## License

MIT