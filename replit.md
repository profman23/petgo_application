# Ride Hailing Application

## Overview

This is a full-stack ride hailing application built with a modern tech stack. The application allows users to request rides, track their status, and provides a complete ride management system with real-time updates. The frontend is built with React and TypeScript, while the backend uses Express.js with a PostgreSQL database managed through Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Simple in-memory session store
- **Development**: tsx for TypeScript execution in development

### Database Schema
The application uses three main tables:
- **users**: Customer information with phone-based authentication
- **drivers**: Driver profiles with location tracking and availability status
- **rides**: Ride requests with status tracking and location data

## Key Components

### Authentication System
- Phone number and password-based authentication
- Session-based authorization using Bearer tokens
- Simple in-memory session storage for development

### Ride Management
- Real-time ride status updates with polling
- Automatic ride simulation for testing
- Location-based driver matching
- Distance and cost estimation algorithms

### UI Components
- Responsive design with Arabic language support
- Interactive maps using Leaflet
- Form validation with error handling
- Toast notifications for user feedback
- Status indicators with visual feedback

### Storage Layer
- In-memory storage implementation for development
- Mock data initialization with sample drivers
- Abstracted storage interface for easy database integration

## Data Flow

1. **User Registration/Login**: Users authenticate using phone number and password
2. **Ride Request**: Users input pickup and destination locations
3. **Driver Matching**: System finds nearby available drivers
4. **Ride Tracking**: Real-time status updates through polling
5. **Ride Completion**: Status updates and cleanup

The application uses a polling mechanism to provide real-time updates, with the frontend querying the backend every 2 seconds during active rides.

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Libraries**: Radix UI primitives, Lucide React icons
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS, class-variance-authority
- **Form Validation**: Zod schema validation
- **Date Handling**: date-fns for date manipulation
- **Maps**: Leaflet for interactive maps

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL adapter
- **Neon Database**: Serverless PostgreSQL connection
- **Validation**: Zod for schema validation
- **Development**: tsx for TypeScript execution

### Development Tools
- **Build Tools**: Vite, esbuild for production builds
- **TypeScript**: Full TypeScript support across the stack
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Build Process
- **Development**: `npm run dev` runs both frontend (Vite) and backend (tsx)
- **Production Build**: 
  - Frontend: Vite builds to `dist/public`
  - Backend: esbuild bundles server code to `dist/index.js`
- **Production Start**: `npm run start` runs the built application

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable
- **Port Configuration**: Application runs on port 5000 with external port 80
- **Module System**: ESM modules throughout the application

### Replit Configuration
- **Modules**: Node.js 20, web development, PostgreSQL 16
- **Run Command**: `npm run dev` for development
- **Build Command**: `npm run build` for production
- **Deployment**: Autoscale deployment target

The application serves the built frontend statically in production while providing API endpoints under `/api/*` routes. The development setup includes Vite's middleware for hot module replacement and development features.

## Changelog

```
Changelog:
- June 23, 2025. Initial setup
- June 23, 2025. Added test user accounts for login testing (phone: 0501234567, password: 123456)
- June 23, 2025. Converted from ride-hailing to veterinary clinic service app
- June 23, 2025. Added doctor interface with request approval/rejection system (doctor account: vetsvan1/123456)
- June 23, 2025. Created separate login interfaces for customers and doctors
- June 23, 2025. Fixed authentication token system for API calls
- June 23, 2025. Implemented real-time request notifications between customer and doctor interfaces
- June 23, 2025. Fixed location detection issues - added Saudi Arabia boundary check and Riyadh fallback
- June 23, 2025. Added automatic token expiry detection and redirect to login when sessions expire
- June 23, 2025. COMPLETED: Full end-to-end testing confirmed - system working perfectly with real-time notifications
- June 23, 2025. FIXED: Token expiry detection and automatic redirect system implemented
- June 23, 2025. FINAL: Complete workflow tested and verified - notifications working 100%
- June 23, 2025. SUCCESS: User confirmed notifications are working - system ready for production deployment
- June 23, 2025. ENHANCED: Real GPS location tracking system implemented for both customers and doctors
- June 23, 2025. Added useGeolocation hook with high accuracy GPS positioning and continuous watching
- June 23, 2025. Created useDoctorLocation and useCustomerLocation hooks for automatic location updates
- June 23, 2025. Enhanced map component with custom icons for customers (blue) and doctors (green)
- June 23, 2025. Added GPS status indicators in both customer and doctor interfaces
- June 23, 2025. Implemented real-time location synchronization with server endpoints
- June 23, 2025. COMPLETED: Interactive map in doctor dashboard showing customer locations with pending requests
- June 23, 2025. Added doctor ride tracking page with dual location display (doctor + customer)
- June 23, 2025. Integrated Google Maps navigation - opens automatically after accepting ride request
- June 23, 2025. Enhanced map component to support displaying both doctor and customer locations simultaneously
- June 23, 2025. Added automatic redirect to tracking page after doctor accepts request
- June 23, 2025. Implemented call customer feature and direct navigation buttons in doctor interface
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```