# Ride Hailing Application

## Overview
This is a full-stack ride hailing application, transformed into a comprehensive veterinary clinic service app. It enables users to request mobile veterinary services, track their status, and manage appointments. The system offers real-time updates for both customers and veterinary professionals, facilitating seamless service delivery and management. Key capabilities include phone-based authentication, real-time GPS tracking of Vets Vans, multi-language support (Arabic/English), and an integrated invoicing and payment system. The project's vision is to provide convenient, accessible, and high-quality mobile veterinary care.

## Recent Changes (August 11, 2025)
**🔧 MYFATOORAH API AUTHENTICATION TROUBLESHOOTING IN PROGRESS**: Built complete MyFatoorah payment gateway integration architecture including transaction database schema, API service utility, payment endpoints, success/error callback pages, and webhook handling. Currently troubleshooting 401 authentication errors with MyFatoorah API - tested both sandbox (apitest.myfatoorah.com) and production (api.myfatoorah.com) endpoints. API key is properly formatted (710 characters, Bearer token) but requires verification of key validity and environment compatibility.

**✅ FULL ACCESSIBILITY COMPLIANCE ACHIEVED ACROSS ALL CUSTOMER PAGES**: Successfully resolved all accessibility warnings throughout the customer interface by implementing proper React Hook Form structure patterns. Fixed FormControl component wrapper issues that were preventing ID forwarding from Radix UI Slot components to input elements. Customer login, ride request, and all form pages now have complete label-input associations for screen readers and browser autofill functionality.

**✅ INVOICE TIMING ISSUE COMPLETELY RESOLVED**: Fixed critical synchronization problem where invoice generation and immediate viewing showed stale data until browser refresh. Implemented comprehensive cache invalidation system that ensures fresh data loads immediately after invoice generation and when viewing invoices. System now properly displays correct invoice numbers (Vets9000XXX format) and updated balances/services without requiring browser refresh.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application is a full-stack solution using React 18 with TypeScript for the frontend and Node.js with Express.js for the backend. PostgreSQL, managed by Drizzle ORM, serves as the primary database.

**Frontend:**
- **Framework & Libraries**: React 18, TypeScript, Wouter for routing, TanStack Query for server state, Radix UI and shadcn/ui for components, React Hook Form with Zod for forms.
- **Styling**: Tailwind CSS with CSS variables for theming, supporting a consistent purple color scheme (#8B2F8B) matching brand identity. Custom images for vehicles, clinics, and houses are integrated throughout the UI.
- **Localization**: Comprehensive multi-language system with Arabic/English support, including RTL/LTR text direction, language-aware date/time formatting, and persistent language selection.
- **Design Principles**: Responsive design, custom visual components (e.g., interactive maps with Leaflet, animated vehicle/building elements), and professional aesthetics with consistent branding. Glass morphism and 3D effects are used for interactive elements.
- **Typography**: Comic Relief font for English text and Delius/Cairo Play for Arabic text across the customer interface, except for specific educational sections using Chewy and Cairo Play.

**Backend:**
- **Runtime & Framework**: Node.js, TypeScript, Express.js for REST APIs.
- **Database**: PostgreSQL with Drizzle ORM for data persistence (users, drivers/Vets Vans, rides/bookings, pets, invoices, payments, products, services, sessions).
- **Authentication**: Phone number and password-based authentication with session-based authorization using database-backed sessions for persistence and scalability. OTP email verification for account creation.
- **Core Features**:
    - **Ride/Booking Management**: Real-time status updates via polling, location-based matching, distance and cost estimation, real-time GPS tracking.
    - **Notification System**: Real-time browser and audio notifications for new requests (for doctors and admins), and email notifications for booking confirmations and pre-appointment alerts.
    - **Data Persistence**: Robust PostgreSQL-based storage with comprehensive CRUD operations and a multi-layered data protection system to ensure data integrity and prevent loss of imported products/services.
    - **Invoice & Payment System**: Generation of professional, bilingual invoices with tax and discount calculations, pet vitals tracking, and a system for sending invoice links via email.
    - **Admin Dashboard**: Centralized management for Vets Vans, products, services, user accounts, and comprehensive sales reports with Excel export functionality.
    - **Location Services**: Precise customer location detection with reverse geocoding (OpenStreetMap) and Vets Van location management for accurate proximity calculations.

**System Design Choices:**
- **Modularity**: Separation of frontend and backend concerns, distinct API endpoints for different functionalities.
- **Real-time Updates**: Polling mechanisms for continuous status updates.
- **Data Integrity**: Robust database protection, import data protection, and a smart initialization system prevent data loss.
- **User Experience**: Intuitive UI/UX with responsive design, dynamic language switching, custom animations, and clear visual feedback.
- **Scalability**: Database-backed session management and optimized data handling for production environments.

## External Dependencies

**Frontend:**
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Libraries**: Radix UI primitives, shadcn/ui, Lucide React (icons)
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS, class-variance-authority, PostCSS
- **Form Validation**: Zod
- **Date Handling**: date-fns
- **Maps**: Leaflet (for interactive maps, though simplified in later stages)
- **Fonts**: Google Fonts (Chewy, Cairo Play, Delius, Comic Relief)

**Backend:**
- **Database**: PostgreSQL, Drizzle ORM, Neon Database (serverless PostgreSQL)
- **Validation**: Zod
- **Email Service**: Microsoft Graph API (for Outlook integration), with SMTP fallback
- **SMS Service**: Taqnyat platform API
- **Development**: tsx (for TypeScript execution in dev)
- **Build Tools**: Vite (frontend), esbuild (backend)
- **Excel Export**: XLSX, file-saver
- **CSV Parsing**: papaparse