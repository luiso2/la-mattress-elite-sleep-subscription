# LA Mattress Elite Sleep+ Subscription Portal

A professional subscription management platform for LA Mattress's Elite Sleep+ membership program, built with Next.js 14+ and Stripe integration.

![LA Mattress Elite Sleep+](https://img.shields.io/badge/LA%20Mattress-Elite%20Sleep%2B-00bcd4)

## 🚀 Features

- **Beautiful, Mobile-First Design**: Responsive UI optimized for all devices
- **Secure Authentication**: JWT-based auth system
- **Stripe Integration**: Complete payment processing and subscription management
- **Member Portal**: Exclusive benefits dashboard for Elite Sleep+ members
- **Multiple Subscription Tiers**: Basic, Premium, and Elite plans
- **Professional Branding**: LA Mattress brand colors and styling throughout

## 🎨 Design System

### Brand Colors
- Primary Blue: `#1e40af`
- Accent Cyan: `#00bcd4`  
- CTA Yellow: `#ffd700`
- Light Background: `#e3f2fd`

### Key Pages
- **Home**: Hero section with benefits overview
- **Pricing**: Three-tier pricing cards with features
- **Login/Register**: Clean auth forms with benefits preview
- **Member Portal**: Access exclusive member benefits
- **Dashboard**: Manage subscriptions and view analytics

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **Styling**: Tailwind CSS with custom utilities
- **Payments**: Stripe (Checkout, Customer Portal, Webhooks)
- **Authentication**: JWT tokens
- **API**: Next.js Route Handlers

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Stripe account
- Git

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/la-mattress-subscription.git
cd la-mattress-subscription
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure your `.env.local` file**
```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_...
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_...

# Application Configuration
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏗️ Setting Up Stripe

1. **Create Products in Stripe Dashboard**
   - Basic Sleep+ ($9.99/month)
   - Premium Sleep+ ($19.99/month)
   - Elite Sleep+ ($49.99/month)

2. **Create Prices for each product**
   - Set as recurring monthly subscriptions
   - Copy the price IDs to your `.env.local`

3. **Set up Webhook Endpoint**
   - Add endpoint: `https://your-domain.com/api/webhook/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

4. **Configure Customer Portal**
   - Enable in Stripe Dashboard
   - Set allowed actions (cancel, update payment method, etc.)

## 🚀 Running the Application

### Development
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 📁 Project Structure

```
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Dashboard pages
│   ├── login/         # Auth pages
│   ├── portal/        # Member portal
│   ├── pricing/       # Subscription plans
│   └── page.tsx       # Homepage
├── components/        # Reusable components
├── lib/              # Utilities and services
└── public/           # Static assets
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Subscriptions
- `POST /api/subscription/create-checkout` - Create Stripe checkout
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/portal` - Access Stripe customer portal

### Portal
- `POST /api/portal/login` - Member portal access
- `GET /api/portal/data` - Get member benefits data

## 🧪 Testing

### Test Cards
Use these Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication: `4000 0025 0000 3155`

### Test Member Portal
Email: `test@example.com`

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Ensure Node.js 18+ support
- Configure environment variables
- Set up SSL for production

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

## 🆘 Support

For issues or questions:
- Email: support@lamattress.com
- Phone: Call Now: 1-800-218-3578

## 📄 License

This project is proprietary to LA Mattress. All rights reserved.

---

Built with ❤️ for better sleep by LA Mattress