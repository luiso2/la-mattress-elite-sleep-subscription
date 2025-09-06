# LA Mattress Elite Sleep+ Subscription Portal

## Overview
This is a Next.js application for LA Mattress's Elite Sleep+ subscription service, featuring Stripe integration for payment processing and member management.

## Design Updates

### Brand Colors
The application now uses LA Mattress brand colors:
- **Primary Blue**: `#1e40af` - Used for headings and primary text
- **Light Blue/Turquoise**: `#00bcd4` - Used for accents and highlights
- **Yellow**: `#ffd700` - Used for primary CTAs and important buttons
- **Light Background**: `#e3f2fd` - Used for info sections and cards
- **Text Colors**: 
  - Primary: `#171717`
  - Secondary: `#4b5563`

### Mobile-First Design
- All components are optimized for mobile devices first
- Responsive breakpoints ensure proper scaling on tablets and desktops
- Touch-friendly button sizes and spacing
- Optimized typography for readability on all screen sizes

### Key Features
1. **Responsive Navigation**: Mobile hamburger menu with smooth transitions
2. **Consistent Branding**: LA Mattress logo and colors throughout
3. **Improved Typography**: Clear hierarchy and better readability
4. **Enhanced Forms**: Better input styling with focus states
5. **Professional Cards**: Clean, modern pricing and benefit cards

## Pages Updated

### Home Page (`/`)
- Hero section with member benefits
- Trust indicators
- Dual CTA buttons
- Mobile-optimized layout

### Pricing Page (`/pricing`)
- Three-tier pricing structure
- Mobile-first card layout
- "Most Popular" badge for recommended plan
- Clear feature lists
- Contact information

### Login/Register Pages
- Branded forms with LA Mattress colors
- Mobile-friendly input fields
- Clear error messaging
- Benefits preview on registration

### Member Portal (`/portal`)
- Benefits preview section
- Simplified email-based access
- Contact support information

## Components

### Navbar
- Sticky navigation
- Mobile hamburger menu
- "One-Year Low Price Guarantee" banner (desktop)
- LA Mattress branding

## CSS Architecture
- Custom CSS variables for brand colors
- Utility classes for common button styles
- Mobile-first responsive containers
- Improved focus states for accessibility

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables
Create a `.env.local` file with:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_id_for_basic_plan
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_id_for_premium_plan
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_id_for_enterprise_plan
```

## Notes
- All text is optimized for readability
- Forms include proper validation
- Buttons have hover and disabled states
- Colors meet WCAG accessibility standards
- Mobile menu includes all navigation options