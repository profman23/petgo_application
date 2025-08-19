# Ride Hailing Application

## Overview
This project is a full-stack ride-hailing application re-envisioned as a mobile veterinary clinic service app. Its primary purpose is to enable users to request and manage mobile veterinary appointments, providing real-time updates for both customers and veterinary professionals. Key capabilities include phone-based authentication, real-time GPS tracking of Vet Vans, multi-language support (Arabic/English), and an integrated invoicing and payment system. The business vision is to deliver convenient, accessible, and high-quality mobile veterinary care, with ambitions to streamline service delivery and management for enhanced customer satisfaction and operational efficiency.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application is a full-stack solution. The frontend is built with React 18 and TypeScript, while the backend utilizes Node.js with Express.js. PostgreSQL, managed by Drizzle ORM, serves as the primary database.

**Frontend:**
- **Framework & Libraries**: React 18, TypeScript, Wouter for routing, TanStack Query for server state, Radix UI and shadcn/ui for components, React Hook Form with Zod for forms.
- **Styling**: Tailwind CSS with CSS variables, adhering to a consistent purple color scheme (#8B2F8B). Custom images for vehicles, clinics, and houses are integrated. Design principles include responsive design, custom visual components (e.g., interactive maps with Leaflet), and professional aesthetics with consistent branding. Glass morphism and 3D effects are used for interactive elements.
- **Localization**: Comprehensive multi-language support (Arabic/English), including RTL/LTR text direction, language-aware date/time formatting, and persistent language selection.
- **Typography**: Comic Relief for English and Delius/Cairo Play for Arabic text across the customer interface, with specific educational sections using Chewy and Cairo Play.

**Backend:**
- **Runtime & Framework**: Node.js, TypeScript, Express.js for REST APIs.
- **Database**: PostgreSQL with Drizzle ORM for persistence (users, Vets Vans, bookings, pets, invoices, payments, products, services, sessions).
- **Authentication**: Phone number and password-based authentication with session-based authorization. OTP email verification for account creation.
- **Core Features**:
    - **Booking Management**: Real-time status updates via polling, location-based matching, distance and cost estimation, real-time GPS tracking.
    - **Enhanced Payment-Booking Linking**: Multi-tiered linking system using phone numbers as primary identifiers, with fuzzy name matching fallbacks, extended time windows (2-48 hours), and automated background jobs running every 15 minutes.
    - **Notification System**: Real-time browser and audio notifications for new requests (doctors/admins), and email notifications for booking confirmations and pre-appointment alerts.
    - **Data Persistence**: Robust PostgreSQL-based storage with comprehensive CRUD operations and multi-layered data protection.
    - **Invoice & Payment System**: Generation of professional, bilingual invoices with tax and discount calculations, pet vitals tracking, and email delivery of invoice links.
    - **Admin Dashboard**: Centralized management for Vets Vans, products, services, user accounts, sales reports with Excel export, and payment linking statistics.
    - **Location Services**: Precise customer location detection with reverse geocoding (OpenStreetMap) and Vets Van location management.

**System Design Choices:**
- **Modularity**: Clear separation of frontend and backend.
- **Real-time Updates**: Polling mechanisms for continuous status updates.
- **Data Integrity**: Robust database protection, import data protection, and smart initialization prevent data loss.
- **User Experience**: Intuitive UI/UX with responsive design, dynamic language switching, custom animations, and clear visual feedback.
- **Scalability**: Database-backed session management and optimized data handling.

## External Dependencies

**Frontend:**
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Libraries**: Radix UI primitives, shadcn/ui, Lucide React (icons)
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS, class-variance-authority, PostCSS
- **Form Validation**: Zod
- **Date Handling**: date-fns
- **Maps**: Leaflet
- **Fonts**: Google Fonts

**Backend:**
- **Database**: PostgreSQL, Drizzle ORM, Neon Database
- **Validation**: Zod
- **Payment Gateway**: MyFatoorah API
- **Email Service**: Microsoft Graph API (Outlook integration), with SMTP fallback
- **SMS Service**: Taqnyat platform API
- **Excel Export**: XLSX, file-saver
- **CSV Parsing**: papaparse