# Ride Hailing Application

## Overview
This project is a full-stack ride-hailing application re-envisioned as a comprehensive mobile veterinary clinic service app. Its primary purpose is to enable users to request and manage mobile veterinary appointments, providing real-time updates for both customers and veterinary professionals. Key capabilities include phone-based authentication, real-time GPS tracking of veterinary vehicles, multi-language support (Arabic/English), and an integrated invoicing and payment system. The vision is to offer convenient, accessible, and high-quality mobile veterinary care.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application is a full-stack solution utilizing React 18 with TypeScript for the frontend and Node.js with Express.js for the backend. PostgreSQL, managed by Drizzle ORM, serves as the primary database.

**Frontend:**
- **Framework & Libraries**: React 18, TypeScript, Wouter for routing, TanStack Query for server state management, Radix UI and shadcn/ui for components, and React Hook Form with Zod for form handling.
- **Styling**: Tailwind CSS with CSS variables for theming, featuring a consistent purple color scheme (#8B2F8B) and custom images for visual elements. Glass morphism and 3D effects enhance interactive elements.
- **Localization**: Comprehensive multi-language support (Arabic/English) including RTL/LTR text direction, language-aware date/time formatting, and persistent language selection.
- **Design Principles**: Responsive design, custom visual components (e.g., interactive maps, animated vehicle/building elements), and professional aesthetics with consistent branding.
- **Typography**: Uses Comic Relief and Delius/Cairo Play for general text, with Chewy for specific educational sections.

**Backend:**
- **Runtime & Framework**: Node.js, TypeScript, Express.js for REST APIs.
- **Database**: PostgreSQL with Drizzle ORM for storing data related to users, Vets Vans, bookings, pets, invoices, payments, products, services, and sessions.
- **Authentication**: Phone number and password-based authentication with session-based authorization and OTP email verification for account creation.
- **Core Features**:
    - **Booking Management**: Real-time status updates, location-based matching, distance/cost estimation, and real-time GPS tracking.
    - **Notification System**: Real-time browser and audio notifications for new requests (for professionals), and email notifications for booking confirmations and pre-appointment alerts.
    - **Data Persistence**: Robust PostgreSQL-based storage with CRUD operations and multi-layered data protection.
    - **Invoice & Payment System**: Generation of professional, bilingual invoices with tax/discount calculations, pet vitals tracking, and email-based invoice link delivery.
    - **Admin Dashboard**: Centralized management for Vets Vans, products, services, user accounts, and sales reports with Excel export.
    - **Location Services**: Precise customer location detection with reverse geocoding (OpenStreetMap) and Vets Van location management.

**System Design Choices:**
- **Modularity**: Clear separation of frontend and backend concerns.
- **Real-time Updates**: Polling mechanisms for continuous status updates.
- **Data Integrity**: Robust database protection and import data protection.
- **User Experience**: Intuitive UI/UX, responsive design, dynamic language switching, custom animations, and clear visual feedback.
- **Scalability**: Database-backed session management and optimized data handling.

## External Dependencies

**Frontend:**
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Libraries**: Radix UI primitives, shadcn/ui, Lucide React (icons)
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS, class-variance-authority, PostCSS
- **Form Validation**: Zod
- **Date Handling**: date-fns
- **Maps**: Leaflet
- **Fonts**: Google Fonts

**Backend:**
- **Database**: PostgreSQL, Drizzle ORM, Neon Database
- **Validation**: Zod
- **Email Service**: Microsoft Graph API (Outlook integration), with SMTP fallback
- **SMS Service**: Taqnyat platform API
- **Development**: tsx
- **Build Tools**: Vite (frontend), esbuild (backend)
- **Excel Export**: XLSX, file-saver
- **CSV Parsing**: papaparse