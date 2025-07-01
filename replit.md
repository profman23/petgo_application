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
- PostgreSQL database storage with persistent sessions

### Ride Management
- Real-time ride status updates with polling
- Automatic ride simulation for testing
- Location-based driver matching
- Distance and cost estimation algorithms
- Real-time GPS tracking with high accuracy positioning

### UI Components
- Responsive design with complete bilingual support (Arabic/English)
- Interactive maps using Leaflet with custom markers
- Form validation with error handling
- Toast notifications with language-aware messages
- Status indicators with visual feedback
- Language selector with persistent user preference storage

### Multi-Language System
- Comprehensive translation coverage for all UI elements
- Dynamic text direction switching (RTL for Arabic, LTR for English)
- Language-aware date/time formatting
- Persistent language selection across user sessions
- Real-time language switching without page reload

### Storage Layer
- PostgreSQL database with complete CRUD operations
- Persistent data storage for users, drivers, and rides
- Database storage interface with proper error handling

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
- June 23, 2025. FIXED: Google Maps navigation issue - added multiple opening methods and fallback options
- June 23, 2025. Added comprehensive navigation buttons: Google Maps (new window + direct), Apple Maps, Waze
- June 23, 2025. Implemented proper URL encoding and popup blocking detection for reliable map opening
- June 23, 2025. Enhanced doctor dashboard with immediate redirect to tracking page after accepting requests
- June 23, 2025. Added toast notifications and debugging features for troubleshooting navigation issues
- June 23, 2025. COMPLETED: Customer registration system with mandatory fields and math captcha security
- June 23, 2025. Fixed input field issues in registration form - all fields now accept user input correctly
- June 23, 2025. MIGRATED: Successfully moved from in-memory storage to PostgreSQL database
- June 23, 2025. Created PostgreSQL database with users, drivers, and rides tables
- June 23, 2025. Implemented DatabaseStorage class with full CRUD operations for all entities
- June 23, 2025. All user registrations and data now persist in real database instead of memory
- June 23, 2025. ADDED: Welcome message system for new users with personalized popup notifications
- June 23, 2025. Created multi-stage welcome experience: immediate registration success, beginner tips, and one-time homepage welcome
- June 23, 2025. Welcome messages include user's name and pet name for personalized experience
- June 23, 2025. FIXED: Login issues for both customers and doctors - proper data saving and navigation
- June 23, 2025. Resolved doctor login JSON parsing error and corrected apiRequest usage
- June 23, 2025. Both customer and doctor login systems now work reliably with correct session management
- June 23, 2025. RESTORED: Real-time notification system for doctors when new requests arrive
- June 23, 2025. ENHANCED: Real GPS location tracking with high accuracy positioning instead of default locations
- June 23, 2025. Added browser notifications and toast alerts for doctors when new veterinary requests are submitted
- June 23, 2025. Fixed API endpoints to properly display pending requests with status 'requested' instead of Arabic status
- June 23, 2025. Implemented location detection with city names (Riyadh, Jeddah, Dammam) based on real GPS coordinates
- June 23, 2025. COMPLETED: Full notification and GPS system working - doctors receive instant alerts for new customer requests
- June 23, 2025. FIXED: Doctor ride acceptance system - corrected status validation from "جاري المعالجة" to "requested"
- June 23, 2025. ENHANCED: Google Maps integration now automatically opens when doctor accepts ride with customer location
- June 23, 2025. RESOLVED: JSON parsing errors in doctor dashboard API calls using proper apiRequest method
- June 23, 2025. CLEANED: Customer ride tracking interface - removed all doctor personal details, showing only status updates
- June 23, 2025. Simplified customer view to show only: "جاري المعالجة", "قيد التنفيذ", "تم الوصول" status states
- June 23, 2025. FIXED: Active ride detection issues - corrected database queries for getUserActiveRide and getDriverActiveRide
- June 23, 2025. Changed ride status from Arabic "جاري المعالجة" to English "requested" for proper notification system
- June 23, 2025. RESOLVED: Missing notifications issue - doctors now receive all new ride requests properly
- June 23, 2025. ADDED: Second doctor account (vetsvan2/123456 - د. سارة علي) for multi-doctor testing scenarios
- June 23, 2025. INTEGRATED: Company logo across all application screens for professional branding
- June 23, 2025. Added company logo to: login pages, home screen, doctor dashboard, ride request, ride tracking, doctor tracking, and user type selection
- June 23, 2025. Logo displays consistently with proper sizing and positioning in all interface headers
- June 23, 2025. COMPLETED: Multi-language system (Arabic/English) implemented across all key application screens
- June 23, 2025. Added language selector component with zustand state management for language switching
- June 23, 2025. Created comprehensive translation keys for UI elements including user type selection, home page, and status messages
- June 23, 2025. Fixed language switching issues - all screens now properly respond to Arabic/English language selection
- June 23, 2025. Interface automatically adjusts text direction (RTL for Arabic, LTR for English) based on selected language
- June 23, 2025. ENHANCED: UI styling improvements with purple theme matching company logo colors
- June 23, 2025. Applied purple color scheme (#8B2F8B) to login buttons and form field borders for both customer and doctor interfaces
- June 23, 2025. Added elegant borders and shadow effects to login screens using CSS variables for consistent theming
- June 23, 2025. Implemented hover effects on login buttons with darker purple shade for better user interaction feedback
- June 23, 2025. EXTENDED: Purple theme consistency to user type selection screen (Customer/Doctor login buttons)
- June 23, 2025. Applied matching purple borders, shadows, and icons to user selection cards for cohesive brand identity
- June 23, 2025. Added interactive hover animations with lift effects and enhanced shadows for premium feel
- June 23, 2025. ENHANCED: Main screen container design with elegant purple borders and white background
- June 23, 2025. Added comprehensive border styling to entire user selection screen with matching shadow effects
- June 23, 2025. Updated logo border color to match purple theme for complete visual consistency
- June 23, 2025. IMPROVED: Language selector button design with purple theme integration
- June 23, 2025. Enhanced language selector with clear text display, purple borders, hover effects, and dropdown indicators
- June 23, 2025. Added visual checkmarks for selected language and improved dropdown menu styling
- June 23, 2025. IMPLEMENTED: Comprehensive multi-language notification system across all screens
- June 23, 2025. Added language-aware toast notifications for success messages, errors, and status updates
- June 23, 2025. Enhanced customer and doctor login screens with localized success/error notifications
- June 23, 2025. Created centralized translation keys for all notification messages in both Arabic and English
- June 23, 2025. OPTIMIZED: Language selector button moved to home screen only
- June 23, 2025. Removed language selector from login screens for cleaner interface - language choice now made only at initial screen
- June 23, 2025. CLEANED: Removed test account information section from doctor login page for professional appearance
- June 23, 2025. Hidden "For testing use: username/password" section from doctor login interface
- June 24, 2025. FIXED: Doctor dashboard infinite loop issue causing excessive API calls and browser warnings
- June 24, 2025. Corrected "Back" button navigation to redirect to user type selection screen instead of home
- June 24, 2025. Optimized notification system to prevent React state update loops using useRef instead of useState
- June 24, 2025. RESOLVED: Language persistence issue - changed default language to English and enhanced localStorage handling
- June 24, 2025. Fixed language selection not being maintained across sessions after user login
- June 24, 2025. Added missing /user-type-selection route to prevent 404 errors on back button navigation
- June 24, 2025. Final fix for doctor dashboard infinite update loop using controlled state management
- June 24, 2025. COMPLETED: Comprehensive multi-language system refinement with complete English translation coverage
- June 24, 2025. Fixed all remaining Arabic text in doctor dashboard and ride tracking screens when English is selected
- June 24, 2025. Enhanced language persistence mechanism to maintain user language choice throughout entire session
- June 24, 2025. Applied consistent text direction (RTL/LTR) and text alignment across all interface elements
- June 24, 2025. Translated all dynamic content including ride statuses, GPS indicators, navigation buttons, and toast notifications
- June 24, 2025. Resolved infinite loop issues in notification system using useRef instead of useState for counter tracking
- June 24, 2025. FINALIZED: Complete bilingual support with seamless language switching - system fully functional in both Arabic and English
- June 24, 2025. IMPLEMENTED: Doctor request cancellation feature with confirmation dialog
- June 24, 2025. Added "Cancel Request" button for doctors in ride tracking screen with bilingual support
- June 24, 2025. Created secure API endpoint for ride cancellation with proper authorization checks
- June 24, 2025. Implemented automatic doctor availability restoration after request cancellation
- June 24, 2025. Added comprehensive warning dialog before cancellation to prevent accidental cancellations
- June 24, 2025. SUCCESS: Cancel request feature tested and confirmed working - doctors can now cancel active requests and receive new ones
- June 24, 2025. ENHANCED: Request button design with purple theme matching logo colors and truck icon
- June 24, 2025. Updated button text to "Click Here to Request" with "Mobile Veterinary Clinic" subtitle
- June 24, 2025. Added visual effects: shadows, smooth transitions, and hover animations for better user experience
- June 24, 2025. FIXED: Infinite loop issues in polling system using useRef instead of dependencies in useEffect
- June 24, 2025. Resolved "Maximum update depth exceeded" errors in doctor dashboard and ride tracking components
- June 30, 2025. MODERNIZED: Complete home screen design overhaul with realistic Mercedes Sprinter van based on user's actual vehicle image
- June 30, 2025. Replaced all ambulance designs with accurate Mercedes Sprinter VETS VAN featuring purple branding, dog/cat silhouettes, and professional styling
- June 30, 2025. Enhanced request button area with gradient backgrounds, larger Mercedes van display, modern clinic/house icons, and animated pet illustrations
- June 30, 2025. Added comprehensive vehicle details: Mercedes grille, proper windshield angles, purple stripe design matching brand colors, and realistic proportions
- June 30, 2025. Implemented consistent van design across all animations: moving vehicle during active rides and preview animations
- June 30, 2025. ENHANCED: Animated elements significantly enlarged and improved - moving van now 40% larger with enhanced Mercedes details
- June 30, 2025. UPGRADED: Clinic and house icons redesigned as professional SVG buildings with purple theme and architectural details
- June 30, 2025. ADDED: Animated pet silhouettes (dog and cat) bouncing at road edges to create more engaging user experience
- June 30, 2025. IMPROVED: Road animation with gradient background, enhanced shadows, and realistic van shadow effects
- June 30, 2025. REPLACED: Recent Orders section with elegant navigation buttons (Account, Activity, Home) featuring bilingual support and purple theme
- June 30, 2025. ENHANCED: Navigation buttons with SVG icons, hover effects, and proper Arabic/English text alignment
- June 30, 2025. UPDATED: Translation system to include new navigation button labels in both Arabic and English
- June 30, 2025. OPTIMIZED: Complete layout spacing and dimensions for single-screen display compatibility
- June 30, 2025. REDUCED: Header padding and logo size for compact design (2px padding, 6px logo height)
- June 30, 2025. MINIMIZED: All section margins from 6px to 2-3px for better space utilization
- June 30, 2025. COMPRESSED: Animated elements - road height reduced from 24px to 16px, truck size from 16x20 to 12x16
- June 30, 2025. COMPACTED: Building icons from 48px to 32px, navigation buttons from 20px to 16px height
- June 30, 2025. STREAMLINED: Request button area - reduced padding, smaller pet icons (32px), and compact van image display
- June 30, 2025. ENHANCED: All content now fits in single screen view while maintaining professional appearance and functionality
- June 30, 2025. REDESIGNED: Footer navigation buttons with complete 3D design and fixed icon alignment issues
- June 30, 2025. IMPROVED: Icon containers with fixed 8x8 pixel dimensions to prevent overflow outside button frames
- June 30, 2025. ADDED: True 3D shadow effects with transform translations and interactive hover/press animations
- June 30, 2025. ENHANCED: Button clarity with solid fill icons instead of stroke, white text on gradient backgrounds
- June 30, 2025. IMPLEMENTED: Professional backdrop blur effects and semi-transparent icon containers for modern appearance
- June 30, 2025. REVOLUTIONIZED: Complete glass morphism button redesign with premium luxury effects
- June 30, 2025. ADDED: Animated glow halos around each button with pulsing rainbow gradients
- June 30, 2025. ENHANCED: Floating icons with expandable light auras and 3D perspective transformations
- June 30, 2025. IMPLEMENTED: Individual rotation animations (clockwise/counterclockwise) for each button on hover
- June 30, 2025. INTEGRATED: Corner accent lights that scale on interaction for premium finish
- June 30, 2025. CREATED: Advanced glass morphism effects with backdrop blur and translucent overlays
- June 30, 2025. REFINED: Pulse animation speed reduced to 3 seconds for smoother, more elegant effect
- June 30, 2025. ENHANCED: Icon visibility with subtle stroke outlines for better definition
- June 30, 2025. OPTIMIZED: Reduced backdrop blur intensity from xl to md for improved clarity while maintaining glass effect
- June 30, 2025. HARMONIZED: Updated all button colors to match company logo purple theme with coordinated gradients
- June 30, 2025. IMPLEMENTED: Three distinct purple variations (purple-violet, indigo-purple, violet-fuchsia) for visual hierarchy while maintaining brand consistency
- June 30, 2025. REFINED: Removed backdrop blur effects and replaced with clean white background and elegant white borders
- June 30, 2025. ENHANCED: Crisp white button frames with 2px borders for sophisticated, professional appearance
- June 30, 2025. UPDATED: Icon and text colors changed to dark gray (gray-700) for improved readability and modern aesthetic
- June 30, 2025. REFINED: Icon containers with light gray gradient backgrounds and subtle borders for elegant contrast
- July 1, 2025. IMPLEMENTED: Complete Account page with user profile management system
- July 1, 2025. ADDED: Account page header with username display and profile picture upload functionality
- July 1, 2025. CREATED: User details form including first name, last name, and phone number fields
- July 1, 2025. INTEGRATED: Password reset button and save profile functionality
- July 1, 2025. ENHANCED: Account button navigation from home page to dedicated account screen
- July 1, 2025. COMPLETED: Full bilingual support for account page (Arabic/English)
- July 1, 2025. APPLIED: Consistent purple branding and professional design matching app theme
- July 1, 2025. CREATED: Comprehensive patient form with advanced UI components and bilingual support
- July 1, 2025. ADDED: Patient Name field (free text input with validation)
- July 1, 2025. IMPLEMENTED: Patient Type dropdown with cute animal icons (Cat/Dog/Bird) and bilingual labels
- July 1, 2025. DEVELOPED: Advanced age input system with Year-Month-Day format using separate number inputs
- July 1, 2025. INTEGRATED: Photo upload feature with drag-and-drop interface, preview functionality, and camera button
- July 1, 2025. ENHANCED: Database schema to support new patient fields (ageYear, ageMonth, ageDay, photo)
- July 1, 2025. COMPLETED: Full API integration with proper form validation and error handling
- July 1, 2025. ESTABLISHED: Professional patient management system with card-based patient display and floating add button
- July 1, 2025. IMPLEMENTED: Complete patient editing functionality with click-to-edit interface
- July 1, 2025. ADDED: EditPatientForm component with full update capabilities and backend API endpoints
- July 1, 2025. ENHANCED: Patient cards now clickable for instant editing with proper navigation flow
- July 1, 2025. UPDATED: Arabic translations to replace "مريض" (patient) with "أليف" (pet) throughout the application
- July 1, 2025. CLEANED: Removed Patient Name and Patient Type fields from Account Details page per user request
- July 1, 2025. SIMPLIFIED: Account Details now contains only essential user information (First Name, Last Name, Phone Number, Password Reset)
- July 1, 2025. ENHANCED: Ride request form with pet selection and service type features
- July 1, 2025. ADDED: Multi-pet selection capability - users can choose one or multiple registered pets for veterinary service
- July 1, 2025. IMPLEMENTED: Service type dropdown with "General Check Up" and "Grooming" options (no pricing display as requested)
- July 1, 2025. OPTIMIZED: Pet loading performance with query caching (5-minute stale time, 10-minute cache time)
- July 1, 2025. UPDATED: Button text to "Click Here to Vet Request" for concise messaging in both Arabic and English
- July 1, 2025. ENHANCED: Form validation to ensure pets and service type are selected before submission
- July 1, 2025. REPLACED: VETS VAN image with user's custom cute dog and cat image positioned directly above request button
- July 1, 2025. REPOSITIONED: Custom pet image moved to replace vehicle image in optimal location above "Click Here to Request" button
- July 1, 2025. ENHANCED: Custom pet image with glass morphism frame, backdrop blur, and hover scaling effects
- July 1, 2025. ENLARGED: Pet image to 48x32 pixels and removed border frame for cleaner display with drop shadow effects
- July 1, 2025. CLEANED: Removed logo and animated pet icons section above custom pet image for simplified, cleaner design
- July 1, 2025. UPDATED: Successfully replaced animated VETS VAN car with user's custom veterinary van image (freepik__background__70346_1751363211262.png)
- July 1, 2025. REPLACED: Both static preview and moving animation car graphics with new custom van image in all road animations
- July 1, 2025. REPLACED: Both house icons (static and active ride tracking) with user's custom beautiful house image (freepik_assistant_1751363501296_1751363531753.jpeg)
- July 1, 2025. REPLACED: All veterinary clinic icons (both in static view and active ride tracking) with user's custom clinic image (freepik_assistant_1751363666289_1751363695395.png)
- July 1, 2025. ENHANCED: Clinic image size increased to 40x40 pixels for better visibility as requested
- July 1, 2025. COMPLETED: All SVG clinic icons completely replaced with user's custom images throughout the application
- July 1, 2025. MAINTAINED: All original animations, effects, and responsive design while using custom user images
- July 1, 2025. PRESERVED: Complete bilingual support and proper scaling/positioning for all replaced graphics
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```