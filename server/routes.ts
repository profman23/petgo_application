import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from 'url';
import type { User, Driver, Admin } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { loginSchema, insertUserSchema, rideRequestSchema, registerSchema, otpVerificationSchema, insertOtpVerificationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { emailService } from "./emailService";
import bcrypt from 'bcrypt';

// Extended Request interfaces for type safety
interface AuthenticatedRequest extends Request {
  user: User & { membershipType: string };
}

interface AdminRequest extends Request {
  admin: Admin;
}

// Use generic interface for middleware compatibility
interface AnyRequest extends Request {
  user?: User & { membershipType: string };
  admin?: Admin;
}
// Payment service removed per user request

// Simple session middleware - In-memory fallback for development
const sessions = new Map();

// Database session storage for production persistence
import { db } from "./db";
import { sessions as sessionsTable } from "@shared/schema";
import { eq, lt } from "drizzle-orm";

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function requireAuth(req: AnyRequest, res: Response, next: NextFunction) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    // Try database first for production persistence
    const [dbSession] = await db.select().from(sessionsTable).where(eq(sessionsTable.sid, sessionId));
    
    if (dbSession) {
      // Check if session expired
      if (new Date() > dbSession.expire) {
        await db.delete(sessionsTable).where(eq(sessionsTable.sid, sessionId));
        console.log('Session expired:', sessionId);
        return res.status(401).json({ message: 'Session expired' });
      }
      
      const sessionData = dbSession.sess as any;
      req.user = sessionData.user || sessionData;
      return next();
    }
    
    // Fallback to in-memory for development
    const session = sessions.get(sessionId);
    if (!session) {
      console.log('Invalid token:', sessionId);
      console.log('Available sessions:', Array.from(sessions.keys()));
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    req.user = session.user;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Error message translations
function getErrorMessage(key: string, language: string = 'ar'): string {
  const messages: Record<string, Record<string, string>> = {
    ar: {
      phoneExists: 'رقم الهاتف مستخدم بالفعل',
      emailExists: 'الإيميل مستخدم بالفعل',
      serverError: 'خطأ في الخادم',
      phoneInvalid: 'رقم الهاتف يجب أن يبدأ بـ 05 ويكون 10 أرقام',
      logoutSuccess: 'تم تسجيل الخروج بنجاح'
    },
    en: {
      phoneExists: 'Phone number already exists',
      emailExists: 'Email address already exists',
      serverError: 'Server error',
      phoneInvalid: 'Phone number must start with 05 and be 10 digits',
      logoutSuccess: 'Successfully logged out'
    }
  };
  
  return messages[language]?.[key] || messages.ar?.[key] || key;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateRideEstimates(distance: number) {
  const estimatedTime = Math.ceil(distance * 3); // 3 minutes per km
  const baseFare = 10;
  const perKmRate = 3;
  const estimatedCost = baseFare + (distance * perKmRate);
  
  return { estimatedTime, estimatedCost };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // PWA Routes - Serve Service Worker and Manifest
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, '../public/sw.js'));
  });

  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, '../public/manifest.json'));
  });

  // Serve PWA icons
  app.get('/icons/:iconName', (req, res) => {
    const iconName = req.params.iconName;
    res.sendFile(path.join(__dirname, '../public/icons', iconName));
  });

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return res.status(401).json({ message: 'رقم الهاتف أو الإيميل أو كلمة المرور غير صحيحة' });
      }
      
      // Check password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'رقم الهاتف أو الإيميل أو كلمة المرور غير صحيحة' });
      }
      
      const sessionId = generateSessionId();
      const userData = { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType };
      
      // Store session in database for production persistence
      try {
        await db.insert(sessionsTable).values({
          sid: sessionId,
          sess: { user: userData } as any,
          expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      } catch (dbError) {
        console.log('Database session storage failed, using memory fallback');
        sessions.set(sessionId, { user: userData });
      }
      
      res.json({ 
        token: sessionId, 
        user: userData
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Remove captcha from data
      const { captcha, ...userData } = validatedData;
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      // Check if phone or email already exists
      const existingUserByPhone = await storage.getUserByPhone(userData.phone);
      if (existingUserByPhone) {
        return res.status(400).json({ message: getErrorMessage('phoneExists', userLanguage) });
      }
      
      if (userData.email) {
        const existingUserByEmail = await storage.getUserByEmail(userData.email);
        if (existingUserByEmail) {
          return res.status(400).json({ message: getErrorMessage('emailExists', userLanguage) });
        }
      }
      
      // Generate OTP (6-digit number)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create OTP verification record with expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      await storage.createOtpVerification({
        email: userData.email,
        code: otpCode,
        expiresAt: expiresAt,
        userData: JSON.stringify({
          ...userData,
          name: `${userData.firstName} ${userData.lastName}`,
          membershipType: 'standard'
        })
      });
      
      // Send OTP email
      if (userData.email) {
        try {
          await emailService.sendOtpVerificationEmail(userData.email, userData.firstName || userData.lastName, otpCode);
          console.log(`✅ OTP email sent to ${userData.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send OTP email:', emailError);
          return res.status(500).json({ 
            message: userLanguage === 'ar' ? 'فشل في إرسال رمز التحقق' : 'Failed to send verification code' 
          });
        }
      }
      
      res.json({ 
        message: userLanguage === 'ar' ? 'تم إرسال رمز التحقق بنجاح' : 'Verification code sent successfully',
        email: userData.email
      });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      // Handle database unique constraint violations
      const dbError = error as any;
      if (dbError?.code === '23505') { // PostgreSQL unique constraint violation
        const userLanguage = req.body.preferredLanguage || 'ar';
        
        if (dbError.constraint === 'users_phone_unique') {
          return res.status(400).json({ message: getErrorMessage('phoneExists', userLanguage) });
        }
        if (dbError.constraint === 'users_email_unique') {
          return res.status(400).json({ message: getErrorMessage('emailExists', userLanguage) });
        }
      }
      
      console.error('Registration error:', error);
      const userLanguage = req.body.preferredLanguage || 'ar';
      res.status(500).json({ message: getErrorMessage('serverError', userLanguage) });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req: AnyRequest, res: Response) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      // Remove from database
      try {
        await db.delete(sessionsTable).where(eq(sessionsTable.sid, sessionId));
      } catch (dbError) {
        console.log('Database session deletion failed, removing from memory');
      }
      // Remove from memory fallback
      sessions.delete(sessionId);
    }
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  });

  // OTP Verification routes
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email } = otpVerificationSchema.parse(req.body);
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      // Check if email exists in system
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: userLanguage === 'en' ? 'Email address already exists' : 'الإيميل مستخدم بالفعل' 
        });
      }
      
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Clean up any existing OTPs for this email
      await storage.deleteOtpVerification(email);
      
      // Store OTP in database
      await storage.createOtpVerification({
        email,
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      // Send OTP email
      try {
        await emailService.sendOtpVerificationEmail(email, 'عزيزي المستخدم', otpCode);
        console.log(`✅ OTP email sent to ${email}`);
        
        res.json({ 
          message: userLanguage === 'en' 
            ? 'Verification code sent to your email' 
            : 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
          success: true 
        });
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError);
        res.status(500).json({ 
          message: userLanguage === 'en' 
            ? 'Failed to send verification code' 
            : 'فشل في إرسال رمز التحقق'
        });
      }
    } catch (error: unknown) {
      console.error('Send OTP error:', error);
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ 
        message: userLanguage === 'en' ? 'Server error' : 'خطأ في الخادم' 
      });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otpCode } = req.body;
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      if (!email || !otpCode) {
        return res.status(400).json({ 
          message: userLanguage === 'en' 
            ? 'Email and OTP code are required' 
            : 'الإيميل ورمز التحقق مطلوبان'
        });
      }
      
      // Find OTP verification record
      const otpRecord = await storage.getOtpVerification(email, otpCode);
      
      if (!otpRecord) {
        return res.status(400).json({ 
          message: userLanguage === 'en' 
            ? 'Invalid or expired verification code' 
            : 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        });
      }
      
      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        await storage.deleteOtpVerification(email);
        return res.status(400).json({ 
          message: userLanguage === 'en' 
            ? 'Verification code has expired' 
            : 'انتهت صلاحية رمز التحقق'
        });
      }
      
      // OTP is valid - create user account
      if (otpRecord.userData) {
        try {
          // Handle both string and already parsed userData
          let userData;
          if (typeof otpRecord.userData === 'string') {
            userData = JSON.parse(otpRecord.userData);
          } else if (typeof otpRecord.userData === 'object') {
            userData = otpRecord.userData;
          } else {
            throw new Error('Invalid userData format');
          }
          
          // Hash the password before storing
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          
          // Create the user account
          const newUser = await storage.createUser({
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            membershipType: userData.membershipType || 'standard'
          });
          
          // Send welcome email
          if (userData.email) {
            try {
              await emailService.sendWelcomeEmail(userData.email, userData.firstName || userData.name);
              console.log(`✅ Welcome email sent to ${userData.email}`);
            } catch (emailError) {
              console.error('❌ Failed to send welcome email:', emailError);
            }
          }
          
          // Clean up OTP record
          await storage.deleteOtpVerification(email);
          
          // Create session for automatic login
          const sessionId = generateSessionId();
          const newUserData = { 
            id: newUser.id, 
            phone: newUser.phone, 
            name: newUser.name, 
            membershipType: newUser.membershipType 
          };
          
          // Store session in database for production persistence
          try {
            await db.insert(sessionsTable).values({
              sid: sessionId,
              sess: { user: newUserData } as any,
              expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
          } catch (dbError) {
            console.log('Database session storage failed, using memory fallback');
            sessions.set(sessionId, { user: newUserData });
          }
          
          res.json({ 
            message: userLanguage === 'en' 
              ? 'Account created successfully' 
              : 'تم إنشاء الحساب بنجاح',
            verified: true,
            token: sessionId,
            user: newUserData
          });
        } catch (userCreationError) {
          console.error('User creation error:', userCreationError);
          return res.status(500).json({ 
            message: userLanguage === 'en' 
              ? 'Failed to create user account' 
              : 'فشل في إنشاء حساب المستخدم'
          });
        }
      } else {
        // Just verify OTP without creating user
        await storage.deleteOtpVerification(email);
        res.json({ 
          message: userLanguage === 'en' 
            ? 'Email verified successfully' 
            : 'تم التحقق من الإيميل بنجاح',
          verified: true 
        });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      res.status(500).json({ 
        message: userLanguage === 'en' ? 'Server error' : 'خطأ في الخادم' 
      });
    }
  });

  // Doctor login endpoint  
  app.post('/api/doctor/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Find driver by username
      const driver = await storage.getDriverByUsername(username);
      
      if (!driver || driver.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const sessionId = generateSessionId();
      const userData = { 
        id: driver.id, 
        phone: driver.phone, 
        name: driver.name, 
        membershipType: 'doctor',
        vetsVanId: driver.id, // Using driver.id as VetsVan ID
        vetsVanName: driver.vetsvanName
      };
      
      // Store session in database for production persistence
      try {
        await db.insert(sessionsTable).values({
          sid: sessionId,
          sess: { user: userData } as any,
          expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      } catch (dbError) {
        console.log('Database session storage failed, using memory fallback');
        sessions.set(sessionId, { user: userData });
      }
      
      res.json({ 
        token: sessionId, 
        user: { 
          id: driver.id, 
          phone: driver.phone, 
          name: driver.name, 
          membershipType: 'doctor',
          vetsVanId: driver.id,
          vetsVanName: driver.vetsvanName
        }
      });
    } catch (error: unknown) {
      console.error('Doctor login error:', error);
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  // Driver routes
  app.get('/api/drivers/available', requireAuth, async (req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error: unknown) {
      res.status(500).json({ message: 'خطأ في جلب السائقين' });
    }
  });

  app.get('/api/drivers/nearby', requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'الموقع مطلوب' });
      }
      
      const drivers = await storage.getAvailableDrivers();
      const nearbyDrivers = drivers.map(driver => {
        const distance = calculateDistance(
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          driver.latitude || 24.7136,
          driver.longitude || 46.6753
        );
        const eta = Math.ceil(distance * 2); // 2 minutes per km
        const { estimatedCost } = calculateRideEstimates(distance);
        
        return {
          ...driver,
          distance: Math.round(distance * 10) / 10,
          eta,
          estimatedCost: Math.round(estimatedCost)
        };
      }).sort((a, b) => a.distance - b.distance);
      
      res.json(nearbyDrivers);
    } catch (error: unknown) {
      res.status(500).json({ message: 'خطأ في جلب السائقين القريبين' });
    }
  });

  // Ride routes
  app.post('/api/rides/request', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rideData = rideRequestSchema.parse(req.body);
      
      // Check if user has active ride (excluding cancelled/rejected)
      const activeRide = await storage.getUserActiveRide(req.user.id);
      if (activeRide && !['cancelled', 'cancelled_by_doctor', 'rejected'].includes(activeRide.status)) {
        return res.status(400).json({ message: 'لديك رحلة نشطة بالفعل' });
      }
      
      // Calculate estimates
      const distance = calculateDistance(
        rideData.pickupLatitude,
        rideData.pickupLongitude,
        rideData.destinationLatitude || rideData.pickupLatitude,
        rideData.destinationLongitude || rideData.pickupLongitude
      );
      
      const { estimatedTime, estimatedCost } = calculateRideEstimates(distance);
      
      const ride = await storage.createRide({
        ...rideData,
        customerId: req.user.id,
        estimatedDistance: Math.round(distance * 10) / 10,
        estimatedTime,
        estimatedCost: Math.round(estimatedCost),
        status: 'requested'
      });
      
      res.json(ride);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'خطأ في طلب الرحلة' });
    }
  });

  // Get all rides for current user (for Activity page)
  app.get('/api/rides', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allRides = await storage.getAllRides();
      const userRides = allRides
        .filter(ride => ride.customerId === req.user.id)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Sort by newest first
        });
      
      res.json(userRides);
    } catch (error: unknown) {
      console.error('Error fetching user rides:', error);
      res.status(500).json({ message: 'خطأ في جلب الطلبات' });
    }
  });

  app.get('/api/rides/active', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ride = await storage.getUserActiveRide(req.user.id);
      if (!ride) {
        return res.json(null);
      }

      // If ride is cancelled/rejected, return null
      if (['cancelled', 'cancelled_by_doctor', 'rejected'].includes(ride.status)) {
        return res.json(null);
      }
      
      let driver = null;
      if (ride.driverId) {
        driver = await storage.getDriver(ride.driverId);
      }
      
      res.json({ ride, driver });
    } catch (error) {
      res.status(500).json({ message: 'خطأ في جلب الرحلة النشطة' });
    }
  });



  // Doctor location update endpoint
  app.put('/api/doctor/location', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { latitude, longitude, accuracy, timestamp } = req.body;
      
      // Validate coordinates
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      // Update doctor location in storage
      await storage.updateDriverLocation(user.id, latitude, longitude);
      
      res.json({ 
        message: 'Location updated successfully',
        coordinates: { latitude, longitude },
        accuracy,
        timestamp 
      });
    } catch (error) {
      console.error('Error updating doctor location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Customer location update endpoint
  app.put('/api/customer/location', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'customer') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { latitude, longitude, accuracy, timestamp } = req.body;
      
      // Validate coordinates
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      // Store customer location (could be extended to update active ride location)
      const activeRide = await storage.getUserActiveRide(user.id);
      if (activeRide) {
        // Update ride pickup location with real GPS coordinates
        activeRide.pickupLatitude = latitude;
        activeRide.pickupLongitude = longitude;
      }
      
      res.json({ 
        message: 'Customer location updated successfully',
        coordinates: { latitude, longitude },
        accuracy,
        timestamp 
      });
    } catch (error) {
      console.error('Error updating customer location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Doctor endpoints for ride management - updated to use VetsVan booking system
  app.get('/api/doctor/pending-rides', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get doctor's VetsVan ID from login session or find it by doctor ID
      const doctor = await storage.getDriver(user.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      const doctorVetsVanId = doctor.id; // The doctor's VetsVan ID
      
      // Get all bookings for this specific VetsVan only
      const allBookings = await storage.getAllBookings();
      const doctorBookings = allBookings.filter(booking => 
        booking.vetsVanId === doctorVetsVanId && 
        booking.status === 'booked'
      );
      
      // Get customer details for each booking
      const bookingsWithCustomers = await Promise.all(
        doctorBookings.map(async (booking) => {
          const customer = await storage.getUser(booking.userId);
          return {
            ...booking,
            customer: customer ? { 
              name: customer.name, 
              phone: customer.phone,
              id: customer.id
            } : null
          };
        })
      );
      
      res.json(bookingsWithCustomers);
    } catch (error) {
      console.error('Error fetching doctor pending bookings:', error);
      res.status(500).json({ message: 'خطأ في جلب الطلبات المعلقة' });
    }
  });

  app.post('/api/doctor/rides/:id/accept', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
      }
      
      if (ride.status !== 'requested') {
        return res.status(400).json({ message: 'لا يمكن قبول هذا الطلب' });
      }
      
      // Assign the current doctor (who accepted) to the ride
      const doctorId = user.id;
      console.log('Assigning doctor ID:', doctorId, 'to ride ID:', rideId);
      await storage.assignDriverToRide(rideId, doctorId);
      await storage.updateDriverAvailability(doctorId, false);
      await storage.updateRideStatus(rideId, 'confirmed');
      console.log('Ride assignment completed');
      
      // Simulate progression
      setTimeout(async () => {
        await storage.updateRideStatus(rideId, 'enroute');
        setTimeout(async () => {
          await storage.updateRideStatus(rideId, 'arrived');
        }, 10000);
      }, 5000);
      
      // إرجاع تفاصيل الطلب مع الرد
      const updatedRide = await storage.getRide(rideId);
      res.json({ 
        message: 'تم قبول الطلب بنجاح',
        ride: updatedRide
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      res.status(500).json({ message: 'خطأ في قبول الطلب' });
    }
  });

  // Get active ride for doctor
  app.get('/api/doctor/active-ride', requireAuth, async (req: any, res) => {
    try {
      const doctorId = req.user.id;
      console.log('Looking for active ride for doctor ID:', doctorId);
      
      // Debug: Get all rides to see what's in storage
      const allRides = await storage.getAllRides();
      console.log('All rides in storage:', allRides.map(r => ({ id: r.id, driverId: r.driverId, status: r.status })));
      
      const activeRide = await storage.getDriverActiveRide(doctorId);
      console.log('Found active ride for doctor:', activeRide);
      
      if (!activeRide) {
        return res.json({ ride: null });
      }

      // Get customer information
      const customer = await storage.getUser(activeRide.userId);
      
      res.json({
        ride: activeRide,
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone
        } : null
      });
    } catch (error) {
      console.error("Error fetching active ride:", error);
      res.status(500).json({ message: "Failed to fetch active ride" });
    }
  });

  app.post('/api/doctor/rides/:id/reject', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
      }
      
      // Allow rejection of requests with status 'requested' or 'جاري المعالجة'
      if (ride.status !== 'requested' && ride.status !== 'جاري المعالجة') {
        return res.status(400).json({ message: 'لا يمكن رفض هذا الطلب' });
      }
      
      await storage.updateRideStatus(rideId, 'rejected');
      res.json({ message: 'تم رفض الطلب' });
    } catch (error) {
      console.error('Error rejecting ride:', error);
      res.status(500).json({ message: 'خطأ في رفض الطلب' });
    }
  });

  // Doctor cancel ride
  app.put('/api/rides/:id/cancel', requireAuth, async (req: any, res) => {
    try {
      const rideId = parseInt(req.params.id);
      const user = req.user;
      
      console.log('Cancel request for ride:', rideId, 'by user:', user.id, 'type:', user.membershipType);
      
      // Get ride details first
      const ride = await storage.getRide(rideId);
      if (!ride) {
        console.log('Ride not found:', rideId);
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      console.log('Found ride:', ride);
      
      // Check if user is the assigned doctor
      if (user.membershipType === 'doctor' && ride.driverId !== user.id) {
        console.log('Doctor not assigned to this ride. Driver ID:', ride.driverId, 'User ID:', user.id);
        return res.status(403).json({ message: 'Unauthorized to cancel this ride' });
      }
      
      // Check if user is the customer
      if (user.membershipType === 'customer' && ride.customerId !== user.id) {
        console.log('Customer not owner of this ride. Customer ID:', ride.customerId, 'User ID:', user.id);
        return res.status(403).json({ message: 'Unauthorized to cancel this ride' });
      }
      
      // Update ride status to cancelled by doctor if doctor is cancelling
      const cancelStatus = user.membershipType === 'doctor' ? 'cancelled_by_doctor' : 'cancelled';
      await storage.updateRideStatus(rideId, cancelStatus);
      console.log(`Ride status updated to ${cancelStatus}`);
      
      // Make doctor available again if it was a doctor cancelling
      if (user.membershipType === 'doctor' && ride.driverId) {
        await storage.updateDriverAvailability(ride.driverId, true);
        console.log('Driver made available again');
      }
      
      res.json({ success: true, message: 'Ride cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling ride:', error);
      res.status(500).json({ message: 'Failed to cancel ride' });
    }
  });

  // Update ride status (for doctors)
  app.put('/api/rides/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      const { status } = req.body;
      const user = req.user;
      
      // Get ride details first
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Check if user is the assigned doctor
      if (user.membershipType === 'doctor' && ride.driverId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized to update this ride' });
      }
      
      await storage.updateRideStatus(rideId, status);
      res.json({ success: true });
    } catch (error: unknown) {
      console.error('Error updating ride status:', error);
      res.status(500).json({ message: 'Failed to update ride status' });
    }
  });

  // Simulate ride status updates
  app.post('/api/rides/:id/simulate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride || ride.customerId !== req.user.id) {
        return res.status(404).json({ message: 'الرحلة غير موجودة' });
      }
      
      // Simulate driver assignment and status updates
      setTimeout(async () => {
        await storage.updateRideStatus(rideId, 'processing');
        
        setTimeout(async () => {
          // Assign nearest driver
          const drivers = await storage.getAvailableDrivers();
          if (drivers.length > 0) {
            const nearestDriver = drivers.reduce((nearest, driver) => {
              const distance = calculateDistance(
                ride.pickupLatitude,
                ride.pickupLongitude,
                driver.latitude || 24.7136,
                driver.longitude || 46.6753
              );
              const nearestDistance = calculateDistance(
                ride.pickupLatitude,
                ride.pickupLongitude,
                nearest.latitude || 24.7136,
                nearest.longitude || 46.6753
              );
              return distance < nearestDistance ? driver : nearest;
            });
            
            await storage.assignDriverToRide(rideId, nearestDriver.id);
            await storage.updateDriverAvailability(nearestDriver.id, false);
            await storage.updateRideStatus(rideId, 'confirmed');
            
            setTimeout(async () => {
              await storage.updateRideStatus(rideId, 'enroute');
              
              setTimeout(async () => {
                await storage.updateRideStatus(rideId, 'arrived');
              }, 8000);
            }, 5000);
          }
        }, 3000);
      }, 2000);
      
      res.json({ message: 'تم بدء محاكاة الرحلة' });
    } catch (error: unknown) {
      res.status(500).json({ message: 'خطأ في محاكاة الرحلة' });
    }
  });

  // Get user profile
  app.get('/api/user/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  });

  // Update user profile
  app.put('/api/user/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName, email, name, petName, petType } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required' });
      }

      const userId = req.user.id;
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        name,
        petName,
        petType
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password from response
      const { password, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error: unknown) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  });

  // Reset password
  app.put('/api/user/reset-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate inputs
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      if (user.password !== currentPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      const updatedUser = await storage.updateUserPassword(userId, newPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update password' });
      }

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  });

  // Get user's patients
  app.get('/api/patients', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patients = await storage.getUserPatients(userId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Add new patient
  app.post('/api/patients', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, type, gender, ageYear, ageMonth, ageDay, photo } = req.body;
      
      if (!name || !type || !gender) {
        return res.status(400).json({ message: 'Patient name, type, and gender are required' });
      }
      
      const patient = await storage.createPatient({
        userId,
        name,
        type,
        gender,
        ageYear: ageYear || null,
        ageMonth: ageMonth || null,
        ageDay: ageDay || null,
        photo: photo || null,
      });
      
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // Update patient
  app.put('/api/patients/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patientId = parseInt(req.params.id);
      const { name, type, gender, ageYear, ageMonth, ageDay, photo } = req.body;
      
      if (!name || !type || !gender) {
        return res.status(400).json({ message: 'Patient name, type, and gender are required' });
      }
      
      const updatedPatient = await storage.updatePatient(patientId, userId, {
        name,
        type,
        gender,
        ageYear: ageYear || null,
        ageMonth: ageMonth || null,
        ageDay: ageDay || null,
        photo: photo || null,
      });
      
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found or unauthorized" });
      }
      
      res.json(updatedPatient);
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Get user's current location info for debugging
  app.get('/api/user/location-info', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        userId: user.id,
        username: user.username,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        message: 'نظام تحديد الموقع الدقيق مفعل - يمكنك رؤية موقعك التفصيلي في الصفحة الرئيسية',
        locationSystemStatus: 'active',
        features: [
          'تحديد الموقع بدقة عالية باستخدام GPS',
          'ترجمة الإحداثيات إلى عناوين تفصيلية',
          'دعم المدن السعودية مع نظام احتياطي ذكي',
          'عرض أسماء الشوارع والأحياء',
          'دعم اللغتين العربية والإنجليزية'
        ]
      });
    } catch (error) {
      console.error('Error fetching user location info:', error);
      res.status(500).json({ message: 'Failed to fetch user location info' });
    }
  });

  // Production Test Endpoint - No Database Operations
  app.get('/api/vetsvan/availability', (req: Request, res: Response) => {
    console.log('🧪 Production test endpoint hit');
    
    const testData = [
      {
        id: 1,
        vetsvanCode: "VETS001",
        vetsvanName: "VetsVan Riyadh East",
        shifts: [
          {
            id: 1,
            startTime: "09:00",
            endTime: "17:00",
            date: "2025-07-31",
            isBooked: false
          }
        ],
        distanceFromCustomer: "2.1"
      },
      {
        id: 2,
        vetsvanCode: "VETS002", 
        vetsvanName: "VetsVan Riyadh West",
        shifts: [
          {
            id: 2,
            startTime: "10:00",
            endTime: "18:00", 
            date: "2025-07-31",
            isBooked: false
          }
        ],
        distanceFromCustomer: "1.8"
      }
    ];
    
    res.json(testData);
  });
      
      // Function to calculate distance between two points using Haversine formula
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers
        return Math.round(distance * 10) / 10; // Round to 1 decimal place
      };
      
      // Group shifts by VetsVan ID and check for bookings
      const vetsvanWithShifts = drivers.map(driver => {
        const driverShifts = shifts.filter(shift => shift.vetsVanId === driver.id);
        
        // Add detailed booking information to each shift
        const shiftsWithBookingStatus = driverShifts.map(shift => {
          // Get all bookings for this shift (not just 'booked' status)
          const shiftBookings = bookings.filter(booking => 
            booking.shiftId === shift.id
          );
          
          return {
            ...shift,
            isBooked: shiftBookings.some(booking => 
              ['pending_review', 'confirmed', 'in_progress', 'completed'].includes(booking.status)
            ),
            bookingsCount: shiftBookings.length,
            bookings: shiftBookings // Include actual booking details with all statuses
          };
        });
        
        // Calculate distance from customer if location is provided
        let distanceFromCustomer = null;
        if (customerLat && customerLon && driver.latitude && driver.longitude) {
          distanceFromCustomer = calculateDistance(
            customerLat, 
            customerLon, 
            driver.latitude, 
            driver.longitude
          );
        }
        
        return {
          id: driver.id,
          vetsvanCode: driver.vetsvanCode,
          vetsvanName: driver.vetsvanName,
          isAvailable: driver.isAvailable,
          latitude: driver.latitude,
          longitude: driver.longitude,
          shifts: shiftsWithBookingStatus,
          distanceFromCustomer: distanceFromCustomer ? `${distanceFromCustomer}` : undefined
        };
      });
      
      // Find the closest VetsVan if customer location is available
      let closestVetsVanId = null;
      if (customerLat && customerLon) {
        let minDistance = Infinity;
        vetsvanWithShifts.forEach(vetsvan => {
          if (vetsvan.distanceFromCustomer) {
            const distance = parseFloat(vetsvan.distanceFromCustomer);
            if (distance < minDistance) {
              minDistance = distance;
              closestVetsVanId = vetsvan.id;
            }
          }
        });
      }
      
      // Add isClosest flag to each VetsVan
      const vetsvanWithClosestFlag = vetsvanWithShifts.map(vetsvan => ({
        ...vetsvan,
        isClosest: vetsvan.id === closestVetsVanId
      }));

      // Sort VetsVans by distance (closest first)
      const sortedVetsVans = vetsvanWithClosestFlag.sort((a, b) => {
        if (a.distanceFromCustomer && b.distanceFromCustomer) {
          return parseFloat(a.distanceFromCustomer) - parseFloat(b.distanceFromCustomer);
        }
        if (a.distanceFromCustomer && !b.distanceFromCustomer) return -1;
        if (!a.distanceFromCustomer && b.distanceFromCustomer) return 1;
        return 0;
      });

      console.log(`📤 Returning ${sortedVetsVans.length} VetsVans`);
      res.json(sortedVetsVans);
    } catch (error: unknown) {
      console.error('❌ DETAILED ERROR in VetsVan availability:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      res.status(500).json({ 
        message: 'Failed to fetch VetsVan availability',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Book an appointment
  app.post('/api/bookings', requireAuth, async (req: AnyRequest, res: Response) => {
    try {
      const { shiftId, vetsVanId, appointmentDate, appointmentTime, customerLocation, selectedPets, serviceType } = req.body;
      const userId = req.user!.id;
      
      console.log('📍 Creating booking with request body:', req.body);
      console.log('📍 Customer location received:', customerLocation);
      console.log('📍 User ID:', userId);
      console.log('🐾 Selected pets received:', selectedPets);
      console.log('🐾 Selected pets type:', typeof selectedPets);
      console.log('🐾 Selected pets length:', selectedPets?.length);
      console.log('🏥 Service type received:', serviceType);

      // Check if this specific time slot is already booked
      const existingBookings = await storage.getShiftBookings(shiftId);
      const timeSlotBooked = existingBookings.some(booking => 
        booking.appointmentTime === appointmentTime && 
        booking.appointmentDate === appointmentDate &&
        ['pending_review', 'confirmed', 'in_progress'].includes(booking.status)
      );
      
      if (timeSlotBooked) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }

      // Create booking with customer location
      const booking = await storage.createBooking({
        userId,
        shiftId,
        vetsVanId,
        appointmentDate,
        appointmentTime,
        status: 'pending_review',
        customerLocation: customerLocation || null,
        selectedPets: selectedPets || [],
        serviceType: serviceType || 'General Check Up'
      });

      // Get user details for the notification
      const user = await storage.getUser(userId);
      const customerName = user?.name || 'عميل جديد';
      
      // Get VetsVan details for email
      const vetsVan = await storage.getDriver(vetsVanId);
      const vetsVanName = vetsVan?.vetsvanName || 'VetsVan';
      
      // Send booking confirmation email if user has email
      if (user?.email) {
        try {
          await emailService.sendBookingConfirmationEmail(
            user.email,
            user.firstName || user.name,
            appointmentDate,
            appointmentTime,
            vetsVanName
          );
          console.log(`✅ Booking confirmation email sent to ${user.email}`);

          // Schedule pre-appointment notification (30 minutes before)
          emailService.schedulePreAppointmentNotification(
            user.email,
            user.firstName || user.name,
            appointmentDate,
            appointmentTime,
            vetsVanName
          );
          console.log(`📅 Pre-appointment notification scheduled for ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send booking confirmation email:', emailError);
          // Don't fail booking if email fails
        }
      }
      
      // Store notification for real-time updates
      // This could be enhanced with WebSocket or Server-Sent Events for real-time notifications
      console.log(`🔔 New booking notification for VetsVan ${vetsVanId}: ${customerName} booked ${appointmentTime} on ${appointmentDate}`);

      res.json({ 
        success: true, 
        booking,
        notification: {
          message: `New booking from ${customerName}`,
          vetsVanId,
          appointmentDate,
          appointmentTime
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Failed to book appointment' });
    }
  });

  // Get bookings for a specific VetsVan (Doctor)
  app.get('/api/doctor/bookings/:vetsVanId', requireAuth, async (req: any, res) => {
    try {
      const vetsVanId = parseInt(req.params.vetsVanId);
      const allBookings = await storage.getAllBookings();
      
      // Filter bookings for this specific VetsVan
      const vetsVanBookings = allBookings.filter(booking => 
        booking.vetsVanId === vetsVanId && booking.status === 'booked'
      );
      
      // Get user details for each booking
      const bookingsWithUserDetails = await Promise.all(
        vetsVanBookings.map(async (booking) => {
          const user = await storage.getUser(booking.userId);
          return {
            ...booking,
            customerName: user?.name || 'غير معروف',
            customerPhone: user?.phone || 'غير محدد'
          };
        })
      );
      
      res.json(bookingsWithUserDetails);
    } catch (error) {
      console.error('Error fetching VetsVan bookings:', error);
      res.status(500).json({ message: 'Failed to fetch VetsVan bookings' });
    }
  });

  // Get user's bookings for Activity page
  app.get('/api/user/bookings', requireAuth, async (req: AnyRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const userBookings = await storage.getUserBookings(userId);
      
      // Get VetsVan details for each booking
      const bookingsWithDetails = await Promise.all(
        userBookings.map(async (booking) => {
          const vetsVan = await storage.getDriver(booking.vetsVanId);
          const shift = await storage.getAllShifts().then(shifts => 
            shifts.find(s => s.id === booking.shiftId)
          );
          
          return {
            ...booking,
            vetsVanName: vetsVan?.vetsvanName || 'VetsVan',
            vetsVanCode: vetsVan?.vetsvanCode || '',
            carModel: vetsVan?.carModel || '',
            carColor: vetsVan?.carColor || '',
            plateNumber: vetsVan?.plateNumber || '',
            shiftDetails: shift || null
          };
        })
      );
      
      // Sort by appointment date and time (newest first)
      const sortedBookings = bookingsWithDetails.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`).getTime();
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`).getTime();
        return dateB - dateA;
      });
      
      res.json(sortedBookings);
    } catch (error: unknown) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Failed to fetch user bookings' });
    }
  });

  // Update booking status (Doctor only)
  app.put('/api/bookings/:id/status', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['pending_review', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') 
        });
      }
      
      console.log(`🔄 Doctor ${req.user.username} updating booking ${bookingId} status to: ${status}`);
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      console.log(`✅ Booking ${bookingId} status updated successfully to: ${status}`);
      res.json({ 
        success: true, 
        booking: updatedBooking,
        message: `Booking status updated to ${status}` 
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Failed to update booking status' });
    }
  });

  // Send tracking notification to customer (Doctor only)
  app.post('/api/bookings/:id/send-tracking', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied. Doctor only.' });
      }

      const bookingId = parseInt(req.params.id);
      
      // Get booking details
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Get customer details
      const customer = await storage.getUser(booking.userId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Get VetsVan details
      const vetsVan = await storage.getDriver(booking.vetsVanId);
      if (!vetsVan) {
        return res.status(404).json({ message: 'VetsVan not found' });
      }

      // Calculate estimated arrival time (random between 15-45 minutes)
      const estimatedMinutes = Math.floor(Math.random() * 31) + 15; // 15-45 minutes
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + estimatedMinutes);

      // Create tracking notification for customer
      const trackingNotification = {
        bookingId: bookingId,
        vetsVanCode: vetsVan.vetsvanCode,
        vetsVanName: vetsVan.vetsvanName,
        driverName: user.name || user.username,
        estimatedArrival: arrivalTime.toISOString(),
        status: 'on_way',
        message: {
          ar: `🚚 VETS VAN في الطريق إليك الآن! الوصول المتوقع خلال ${estimatedMinutes} دقيقة`,
          en: `🚚 VETS VAN is on the way to you! Expected arrival in ${estimatedMinutes} minutes`
        },
        createdAt: new Date().toISOString()
      };

      // Store tracking notification (we'll add this to customer activity)
      await storage.createTrackingNotification(trackingNotification);

      // Send email notification if customer has email
      if (customer.email) {
        try {
          await emailService.sendTrackingNotificationEmail(
            customer.email,
            customer.name || 'العميل الكريم',
            vetsVan.vetsvanCode,
            estimatedMinutes,
            booking.appointmentDate,
            booking.appointmentTime
          );
          console.log(`📧 Tracking email sent to ${customer.email}`);
        } catch (emailError) {
          console.error('Failed to send tracking email:', emailError);
          // Don't fail the request if email fails
        }
      }

      console.log(`🚚 Tracking notification sent for booking ${bookingId} - ETA: ${estimatedMinutes} minutes`);
      
      res.json({ 
        success: true, 
        message: 'Tracking notification sent successfully',
        trackingInfo: trackingNotification
      });
    } catch (error) {
      console.error('Error sending tracking notification:', error);
      res.status(500).json({ message: 'Failed to send tracking notification' });
    }
  });

  // Get bookings for current doctor's VetsVan (no VetsVan ID required)
  app.get('/api/doctor/bookings', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get doctor's VetsVan ID from user data (direct mapping from doctors table)
      const vetsVanId = user.vetsVanId || user.id;
      
      if (!vetsVanId) {
        return res.status(404).json({ message: 'VetsVan ID not found' });
      }
      
      const allBookings = await storage.getAllBookings();
      
      // Filter bookings for this specific VetsVan - show ALL bookings regardless of status
      const vetsVanBookings = allBookings.filter(booking => 
        booking.vetsVanId === vetsVanId
      );
      
      // Get user details for each booking
      const bookingsWithUserDetails = await Promise.all(
        vetsVanBookings.map(async (booking) => {
          const customer = await storage.getUser(booking.userId);
          return {
            ...booking,
            customerName: customer?.name || 'غير معروف',
            customerPhone: customer?.phone || 'غير محدد',
            customerLocation: booking.customerLocation ? {
              latitude: booking.customerLocation.latitude,
              longitude: booking.customerLocation.longitude,
              address: booking.customerLocation.address || null
            } : null
          };
        })
      );
      
      res.json(bookingsWithUserDetails);
    } catch (error) {
      console.error('Error fetching doctor bookings:', error);
      res.status(500).json({ message: 'Failed to fetch doctor bookings' });
    }
  });

  // Get individual booking details for doctor invoice
  app.get('/api/doctor/booking/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const bookingId = parseInt(req.params.bookingId);
      const booking = await storage.getBookingWithDetails(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify this booking belongs to the doctor's VetsVan
      const vetsVanId = user.vetsVanId || user.id;
      if (booking.vetsVanId !== vetsVanId) {
        return res.status(403).json({ message: 'Access denied - booking not for your VetsVan' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      res.status(500).json({ message: 'Failed to fetch booking details' });
    }
  });

  // Get user's bookings (Simple endpoint)
  app.get('/api/user/bookings-simple', requireAuth, async (req: AnyRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error: unknown) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  // Complete booking service (Doctor marks service as completed)
  app.post('/api/bookings/:bookingId/complete', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Get booking with user details to send email notification
      const bookingWithUser = await storage.getBookingWithUserDetails(bookingId);
      
      if (!bookingWithUser) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking status to completed
      await storage.updateBookingStatus(bookingId, 'completed');

      // Send email notification to customer if they have email
      if (bookingWithUser.user.email) {
        try {
          await emailService.sendServiceCompletionEmail(
            bookingWithUser.user.email,
            bookingWithUser.user.name,
            bookingWithUser.appointmentDate,
            bookingWithUser.appointmentTime
          );
          console.log(`✅ Service completion email sent to ${bookingWithUser.user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send service completion email:', emailError);
          // Don't fail the completion if email fails
        }
      }

      res.json({ 
        success: true, 
        message: 'Service marked as completed',
        booking: { ...bookingWithUser, status: 'completed' }
      });

    } catch (error) {
      console.error('Error completing booking:', error);
      res.status(500).json({ message: 'Failed to complete service' });
    }
  });

  // Get review for a specific booking
  app.get('/api/bookings/:bookingId/review', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const review = await storage.getBookingReview(bookingId);
      res.json(review);
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({ message: 'Failed to fetch review' });
    }
  });

  // Get user's reviews
  app.get('/api/user/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Failed to fetch user reviews' });
    }
  });

  // Get user's reviews
  app.get('/api/user/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  });

  // Complete service endpoint (for doctors)
  app.post('/api/bookings/:id/complete', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const doctorUserId = req.user.id;
      
      // Get the booking with user details
      const bookingWithUser = await storage.getBookingWithUserDetails(bookingId);
      
      if (!bookingWithUser) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking status to completed
      await storage.updateBookingStatus(bookingId, 'completed');
      
      // Send completion email to customer
      try {
        if (bookingWithUser.user.email) {
          await emailService.sendServiceCompletionEmail(
            bookingWithUser.user.email,
            bookingWithUser.user.firstName || bookingWithUser.user.username,
            bookingWithUser.appointmentDate,
            bookingWithUser.appointmentTime
          );
        }
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
        // Don't fail the entire request if email fails
      }
      
      res.json({ 
        message: 'Service completed successfully',
        booking: { ...bookingWithUser, status: 'completed' }
      });
    } catch (error) {
      console.error('Error completing service:', error);
      res.status(500).json({ message: 'Failed to complete service' });
    }
  });

  // Submit review endpoint for specific booking (for customers)
  app.post('/api/bookings/:bookingId/review', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { rating, comment } = req.body;
      const userId = req.user.id;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Valid rating (1-5) is required' });
      }

      // Verify booking exists and belongs to user
      const userBookings = await storage.getUserBookings(userId);
      const booking = userBookings.find(b => b.id === bookingId && b.status === 'completed');
      
      if (!booking) {
        return res.status(404).json({ message: 'Completed booking not found' });
      }

      // Check if user already reviewed this booking
      const existingReview = await storage.getBookingReview(bookingId);
      if (existingReview) {
        return res.status(409).json({ message: 'You have already reviewed this service' });
      }

      // Create the review
      const review = await storage.createReview({
        bookingId,
        userId,
        rating,
        comment: comment || null
      });

      res.json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: 'Failed to submit review' });
    }
  });

  // Get reviews for a booking
  app.get('/api/bookings/:bookingId/review', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const review = await storage.getBookingReview(bookingId);
      
      if (!review) {
        return res.status(404).json({ message: 'No review found for this booking' });
      }
      
      res.json(review);
    } catch (error) {
      console.error('Error fetching booking review:', error);
      res.status(500).json({ message: 'Failed to fetch review' });
    }
  });

  // Admin Authentication
  const adminSessions = new Map();

  function requireAdminAuth(req: any, res: any, next: any) {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const session = adminSessions.get(sessionId);
    
    if (!session || session.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    req.admin = session;
    next();
  }

  // Admin login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const sessionId = generateSessionId();
      adminSessions.set(sessionId, {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      });

      res.json({
        token: sessionId,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Get all drivers for admin
  app.get('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({ message: 'Failed to fetch drivers' });
    }
  });

  // Add new driver
  app.post('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
      const { vetsvanCode, vetsvanName, phone, username, password } = req.body;
      
      if (!vetsvanCode || !vetsvanName || !phone || !username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const driver = await storage.createDriver({
        vetsvanCode,
        vetsvanName,
        name: vetsvanName, // Use vetsvanName as the driver name
        phone,
        username,
        password,
        rating: 4.5,
        carModel: "Mercedes Sprinter",
        carColor: "أبيض",
        plateNumber: vetsvanCode,
        latitude: 24.7136,
        longitude: 46.6753,
        isAvailable: true
      });

      res.json(driver);
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ message: 'Failed to create driver' });
    }
  });

  // Delete driver
  app.delete('/api/admin/drivers/:id', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      await storage.deleteDriver(driverId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting driver:', error);
      res.status(500).json({ message: 'Failed to delete driver' });
    }
  });

  // Update driver availability
  app.put('/api/admin/drivers/:id/availability', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { isAvailable } = req.body;
      
      await storage.updateDriverAvailability(driverId, isAvailable);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating driver availability:', error);
      res.status(500).json({ message: 'Failed to update driver availability' });
    }
  });

  // Update driver location
  app.put('/api/admin/drivers/:id/location', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: 'Valid latitude and longitude are required' });
      }
      
      await storage.updateDriverLocation(driverId, latitude, longitude);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Update VetsVan data (edit function)
  app.put('/api/admin/drivers/:id', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { vetsvanCode, vetsvanName } = req.body;
      
      if (!vetsvanCode || !vetsvanName) {
        return res.status(400).json({ message: 'VetsVan code and name are required' });
      }
      
      await storage.updateVetsVanData(driverId, vetsvanCode, vetsvanName);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating VetsVan data:', error);
      res.status(500).json({ message: 'Failed to update VetsVan data' });
    }
  });

  // Shifts management endpoints
  app.get('/api/admin/shifts', requireAdminAuth, async (req, res) => {
    try {
      const shifts = await storage.getAllShifts();
      res.json(shifts);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      res.status(500).json({ message: 'Failed to fetch shifts' });
    }
  });

  app.post('/api/admin/shifts', requireAdminAuth, async (req, res) => {
    try {
      const shiftData = req.body;
      const shift = await storage.createShift(shiftData);
      res.json(shift);
    } catch (error) {
      console.error('Error creating shift:', error);
      res.status(500).json({ message: 'Failed to create shift' });
    }
  });

  app.delete('/api/admin/shifts/:id', requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteShift(id);
      res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
      console.error('Error deleting shift:', error);
      res.status(500).json({ message: 'Failed to delete shift' });
    }
  });

  // Admin: Get reports statistics
  app.get('/api/admin/reports', requireAdminAuth, async (req, res) => {
    try {
      const stats = await storage.getReportsStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching reports stats:', error);
      res.status(500).json({ message: 'Failed to fetch reports stats' });
    }
  });

  // Admin: Get detailed reviews with user and VetsVan information
  app.get('/api/admin/reviews-details', requireAdminAuth, async (req, res) => {
    try {
      const reviewsDetails = await storage.getDetailedReviews();
      res.json(reviewsDetails);
    } catch (error) {
      console.error('Error fetching detailed reviews:', error);
      res.status(500).json({ message: 'Failed to fetch detailed reviews' });
    }
  });

  // Admin: Get all generated invoices for sales report
  app.get('/api/admin/generated-invoices', requireAdminAuth, async (req, res) => {
    try {
      const generatedInvoices = await storage.getAllGeneratedInvoices();
      res.json(generatedInvoices);
    } catch (error) {
      console.error('Error fetching generated invoices:', error);
      res.status(500).json({ message: 'Failed to fetch generated invoices' });
    }
  });

  // Admin: Get detailed invoice items for specific booking
  app.get('/api/admin/invoice-details/:bookingId', requireAdminAuth, async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      // Get invoice items
      const invoiceItems = await storage.getInvoiceItems(parseInt(bookingId));
      
      // Get invoice status
      const invoiceStatus = await storage.getInvoiceStatus(parseInt(bookingId));
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      const response = {
        invoiceItems: invoiceItems || [],
        invoiceStatus: invoiceStatus || {
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          finalTotal: 0,
          notes: ''
        },
        booking: {
          id: booking.id,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          serviceType: booking.serviceType,
          pets: booking.pets || []
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      res.status(500).json({ message: 'Failed to fetch invoice details' });
    }
  });

  // Doctor VetsVan location endpoint
  app.get('/api/doctor/vetsvan-location', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get doctor's VetsVan ID from user data
      const vetsVanId = user.vetsVanId || user.id;
      
      if (!vetsVanId) {
        return res.status(404).json({ message: 'VetsVan ID not found' });
      }
      
      // Get VetsVan details from storage
      const vetsVan = await storage.getDriver(vetsVanId);
      
      if (!vetsVan) {
        return res.status(404).json({ message: 'VetsVan not found' });
      }
      
      const vetsVanInfo = {
        id: vetsVan.id,
        vetsvanCode: vetsVan.vetsvanCode,
        vetsvanName: vetsVan.vetsvanName,
        latitude: vetsVan.latitude,
        longitude: vetsVan.longitude,
        vehicleModel: vetsVan.vehicleModel || 'Mercedes Sprinter',
        vehicleColor: vetsVan.vehicleColor || 'White',
        plateNumber: vetsVan.plateNumber || 'ABC-123'
      };
      
      res.json(vetsVanInfo);
    } catch (error) {
      console.error('Error fetching VetsVan location:', error);
      res.status(500).json({ message: 'Failed to fetch VetsVan location' });
    }
  });

  // Doctor profile and account endpoints
  app.put('/api/doctor/profile', requireAuth, async (req, res) => {
    try {
      const user = req.user;
      
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { name, phone, email } = req.body;
      
      // Update doctor profile in database
      const updatedUser = await storage.updateUser(user.id, { name, phone, email });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  app.put('/api/doctor/change-password', requireAuth, async (req, res) => {
    try {
      const user = req.user;
      
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // For doctors, check current password against the driver's password
      const driver = await storage.getDriver(user.id);
      if (!driver || driver.password !== currentPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Update password
      const updatedUser = await storage.updateUserPassword(user.id, newPassword);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error changing doctor password:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  // Send SMS using Taqnyat API
  app.post('/api/admin/send-sms', requireAdminAuth, async (req, res) => {
    try {
      const { message, phoneNumber } = req.body;
      
      if (!message || !phoneNumber) {
        return res.status(400).json({ message: 'Message and phone number are required' });
      }

      // Taqnyat API configuration  
      const taqnyatApiUrl = 'https://api.taqnyat.sa/v1/messages';
      const bearerToken = process.env.TAQNYAT_API_KEY;
      
      if (!bearerToken) {
        console.error('TAQNYAT_API_KEY is not configured');
        return res.status(500).json({ message: 'SMS service not configured' });
      }

      // Prepare SMS data for Taqnyat
      const smsData = {
        recipients: [phoneNumber],
        body: message,
        sender: "Taqnyat.sa" // Registered sender name
      };

      // Log the request for debugging
      console.log('Sending SMS request to Taqnyat:', {
        url: taqnyatApiUrl,
        recipients: smsData.recipients,
        sender: smsData.sender,
        messageLength: message.length,
        hasApiKey: !!bearerToken,
        apiKeyLength: bearerToken ? bearerToken.length : 0
      });

      // Send SMS via Taqnyat API
      const response = await fetch(taqnyatApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smsData)
      });

      console.log('Taqnyat API Response Status:', response.status);
      console.log('Taqnyat API Response Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Taqnyat API Response Body:', responseText);

      if (!response.ok) {
        console.error('Taqnyat API Error - Status:', response.status);
        console.error('Taqnyat API Error - Body:', responseText);
        
        return res.status(500).json({ 
          message: 'Failed to send SMS via Taqnyat',
          error: `API returned ${response.status}: ${responseText}`,
          apiStatus: response.status
        });
      }

      // Try to parse JSON response
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('SMS sent successfully:', result);
      } catch (parseError) {
        console.error('Failed to parse Taqnyat response as JSON:', parseError);
        console.log('Response text:', responseText);
        
        // If response is successful but not JSON, treat as success
        if (response.status >= 200 && response.status < 300) {
          result = { message: 'SMS sent successfully', rawResponse: responseText };
        } else {
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
      }

      res.json({ 
        success: true, 
        message: 'SMS sent successfully',
        data: result 
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  });

  // Get all VetsVan requests for admin dashboard
  app.get('/api/admin/vetsvan-requests', requireAdminAuth, async (req, res) => {
    try {
      console.log('Admin VetsVan requests called - starting data fetch...');
      const detailedRequests = await storage.getAllVetsVanRequestsWithDetails();
      console.log('VetsVan requests data fetched successfully:', detailedRequests.length, 'requests');
      res.json(detailedRequests);
    } catch (error) {
      console.error('Error fetching VetsVan requests:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Failed to fetch VetsVan requests' });
    }
  });

  // Update booking status from admin dashboard
  app.put('/api/admin/booking/:bookingId/status', requireAdminAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { status } = req.body;
      
      if (!bookingId || !status) {
        return res.status(400).json({ message: 'Booking ID and status are required' });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      res.json({ success: true, booking: updatedBooking });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Failed to update booking status' });
    }
  });

  // Taqnyat Webhook endpoint for SMS status updates
  app.post('/api/webhook/taqnyat', async (req, res) => {
    try {
      console.log('Taqnyat Webhook received:', JSON.stringify(req.body, null, 2));
      
      const { 
        status, 
        messageId, 
        recipient, 
        message, 
        deliveredAt, 
        errorCode, 
        errorMessage 
      } = req.body;

      // Log the webhook data for debugging
      console.log('SMS Status Update:', {
        messageId,
        recipient,
        status,
        deliveredAt,
        errorCode,
        errorMessage
      });

      // Here you can save the status to database if needed
      // For now, we'll just log it
      
      // Always respond with 200 OK to acknowledge receipt
      res.status(200).send('VETSVANWEBHOOKRECEIVEDOK');
    } catch (error) {
      console.error('Error processing Taqnyat webhook:', error);
      // Still return 200 to prevent webhook retries
      res.status(200).send('VETSVANWEBHOOKRECEIVEDOK');
    }
  });

  // Send invoice link via email
  app.post('/api/send-invoice-email/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Generate invoice link
      const invoiceLink = `${req.protocol}://${req.get('host')}/invoice-view?bookingId=${bookingId}`;
      
      // Send email with invoice link
      const { emailService } = await import('./emailService');
      const emailSent = await emailService.sendInvoiceLinkEmail(
        booking.customerEmail,
        booking.customerName,
        `INV-${bookingId}`,
        invoiceLink
      );

      if (emailSent) {
        res.json({ 
          success: true, 
          message: 'Invoice link sent successfully',
          invoiceLink 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send invoice link' 
        });
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      res.status(500).json({ message: 'Failed to send invoice email' });
    }
  });

  // Invoice view endpoint for customers
  app.get('/api/invoice-view/:bookingId', async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Get invoice items
      const invoiceItems = await storage.getInvoiceItems(bookingId);
      
      // Get invoice status
      const invoiceStatus = await storage.getInvoiceStatus(bookingId);
      
      res.json({
        booking,
        invoiceItems,
        invoiceStatus,
        isGenerated: invoiceStatus?.isGenerated || false
      });
    } catch (error) {
      console.error('Error fetching invoice view:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  // Pet vitals API endpoints
  app.post('/api/pet-vitals', async (req, res) => {
    try {
      // Direct database insert as a workaround
      const { db } = await import('./db');
      const { petVitals } = await import('@shared/schema');
      
      // Use schema field names (camelCase) as defined in shared/schema.ts
      const vitalsData = {
        bookingId: req.body.bookingId,
        petId: req.body.petId,
        weight: req.body.weight ? req.body.weight.toString() : null,
        temperature: req.body.temperature ? req.body.temperature.toString() : null,
        heartRate: req.body.heartRate,
        notes: req.body.notes,
        recordedBy: req.body.recordedBy || 'doctor'
      };
      
      console.log('Received payload:', req.body);
      console.log('Vitals data for database:', vitalsData);
      
      console.log('Creating pet vital with vitals data:', vitalsData);
      
      const [newVital] = await db
        .insert(petVitals)
        .values(vitalsData)
        .returning();
      
      console.log('Pet vital created successfully:', newVital);
      res.json(newVital);
    } catch (error) {
      console.error('Error creating pet vital:', error);
      res.status(500).json({ message: 'Failed to create pet vital' });
    }
  });

  app.get('/api/pet-vitals/booking/:bookingId', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { petVitals } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const bookingId = parseInt(req.params.bookingId);
      const vitals = await db
        .select()
        .from(petVitals)
        .where(eq(petVitals.bookingId, bookingId));
        
      res.json(vitals);
    } catch (error) {
      console.error('Error fetching pet vitals:', error);
      res.status(500).json({ message: 'Failed to fetch pet vitals' });
    }
  });

  app.put('/api/pet-vitals/:id', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { petVitals } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const id = parseInt(req.params.id);
      
      // Use schema field names for update
      const updateData = {
        weight: req.body.weight,
        temperature: req.body.temperature,
        heartRate: req.body.heartRate,
        notes: req.body.notes,
        recordedBy: req.body.recordedBy
      };
      
      const [updatedVital] = await db
        .update(petVitals)
        .set(updateData)
        .where(eq(petVitals.id, id))
        .returning();
        
      res.json(updatedVital);
    } catch (error) {
      console.error('Error updating pet vital:', error);
      res.status(500).json({ message: 'Failed to update pet vital' });
    }
  });

  // Pet Attachments endpoints
  app.post('/api/pet-attachments', requireAuth, async (req: any, res) => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        return res.status(401).json({ message: 'Unauthorized - Doctor ID required' });
      }

      const attachmentData = {
        ...req.body,
        uploadedBy: doctorId.toString()
      };

      const newAttachment = await storage.createPetAttachment(attachmentData);
      res.status(201).json(newAttachment);
    } catch (error) {
      console.error('Error creating pet attachment:', error);
      res.status(500).json({ message: 'Error creating pet attachment' });
    }
  });

  app.get('/api/pet-attachments/booking/:bookingId', requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const attachments = await storage.getPetAttachmentsByBooking(bookingId);
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching pet attachments:', error);
      res.status(500).json({ message: 'Error fetching pet attachments' });
    }
  });

  // Get pet attachments for specific pet and booking
  app.get('/api/pet-attachments', requireAuth, async (req, res) => {
    try {
      const petId = parseInt(req.query.petId as string);
      const bookingId = parseInt(req.query.bookingId as string);
      
      if (isNaN(petId) || isNaN(bookingId)) {
        return res.status(400).json({ message: 'Invalid petId or bookingId in query parameters' });
      }
      
      const attachments = await storage.getPetAttachmentsByPet(petId, bookingId);
      res.json(attachments || []);
    } catch (error) {
      console.error('Error fetching pet attachments:', error);
      res.status(500).json({ message: 'Error fetching pet attachments', error: error.message });
    }
  });

  app.delete('/api/pet-attachments/:id', requireAuth, async (req: any, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const doctorId = req.user?.id?.toString();
      
      if (!doctorId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deleted = await storage.deletePetAttachment(attachmentId, doctorId);
      if (deleted) {
        res.json({ message: 'Attachment deleted successfully' });
      } else {
        res.status(404).json({ message: 'Attachment not found or unauthorized' });
      }
    } catch (error) {
      console.error('Error deleting pet attachment:', error);
      res.status(500).json({ message: 'Error deleting pet attachment' });
    }
  });

  // Invoice Items endpoints
  app.post('/api/invoice-items/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Items array is required' });
      }
      
      const savedItems = await storage.saveInvoiceItems(bookingId, items);
      res.json(savedItems);
    } catch (error) {
      console.error('Error saving invoice items:', error);
      res.status(500).json({ message: 'Failed to save invoice items' });
    }
  });

  app.get('/api/invoice-items/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const items = await storage.getInvoiceItems(bookingId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      res.status(500).json({ message: 'Failed to fetch invoice items' });
    }
  });

  app.delete('/api/invoice-items/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      await storage.deleteInvoiceItems(bookingId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting invoice items:', error);
      res.status(500).json({ message: 'Failed to delete invoice items' });
    }
  });

  // Invoice Status endpoints (Updated to create final invoice)
  app.post('/api/invoice-status/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { subtotal, taxAmount, discountAmount, finalTotal, notes } = req.body;
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Get doctor info
      const doctor = await storage.getDriver(req.user.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Get saved invoice items
      const invoiceItems = await storage.getInvoiceItems(bookingId);

      // Check if invoice already exists for this booking
      const existingInvoice = await storage.getGeneratedInvoiceByBooking(bookingId);
      if (existingInvoice) {
        return res.json(existingInvoice); // Return existing invoice instead of creating duplicate
      }

      // Generate unique invoice number
      const invoiceNumber = await storage.getNextInvoiceNumber();

      // Create permanent invoice record
      const invoiceData = {
        invoiceNumber,
        bookingId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        doctorName: doctor.name,
        vetsVanCode: doctor.vetsvanCode,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        serviceType: booking.serviceType,
        pets: booking.pets || [],
        items: invoiceItems.map(item => ({
          id: item.id.toString(),
          description: item.description,
          quantity: parseInt(item.quantity as any),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0),
          discountType: item.discountType || 'none',
          vatRate: 15,
          vatAmount: parseFloat(item.vatAmount || 0),
          totalBeforeVat: parseFloat(item.totalBeforeVat || item.total),
          totalAfterVat: parseFloat(item.totalAfterVat || (item.total * 1.15)),
          total: parseFloat(item.total)
        })),
        subtotal: subtotal.toString(),
        totalDiscountAmount: discountAmount.toString(),
        vatAmount: taxAmount.toString(),
        finalTotal: finalTotal.toString(),
        notes: notes || null,
        generatedBy: req.user.id,
        isEmailSent: false
      };

      const savedInvoice = await storage.createGeneratedInvoice(invoiceData);
      
      // Also save to old invoice_status table for backward compatibility
      try {
        const statusData = {
          bookingId,
          isGenerated: true
        };
        await storage.saveInvoiceStatus(statusData);
      } catch (statusError) {
        // Ignore if already exists due to unique constraint
        console.log('Invoice status already exists, skipping...');
      }

      res.json(savedInvoice);
    } catch (error) {
      console.error('Error saving invoice status:', error);
      res.status(500).json({ message: 'Failed to save invoice status' });
    }
  });

  app.get('/api/invoice-status/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // First check if there's a generated invoice (new system)
      const generatedInvoice = await storage.getGeneratedInvoiceByBooking(bookingId);
      if (generatedInvoice) {
        return res.json({ 
          id: generatedInvoice.id,
          bookingId: generatedInvoice.bookingId,
          isGenerated: true,
          invoiceNumber: generatedInvoice.invoiceNumber,
          generatedAt: generatedInvoice.generatedAt
        });
      }

      // Fallback to old system
      const status = await storage.getInvoiceStatus(bookingId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching invoice status:', error);
      res.status(500).json({ message: 'Failed to fetch invoice status' });
    }
  });

  // New endpoint for all generated invoices
  app.get('/api/generated-invoices', requireAuth, async (req: any, res) => {
    try {
      const invoices = await storage.getAllGeneratedInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching generated invoices:', error);
      res.status(500).json({ message: 'Failed to fetch generated invoices' });
    }
  });

  // New endpoint for specific generated invoice
  app.get('/api/generated-invoice/:invoiceNumber', async (req: any, res) => {
    try {
      const invoiceNumber = req.params.invoiceNumber;
      const invoice = await storage.getGeneratedInvoiceByNumber(invoiceNumber);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error fetching generated invoice:', error);
      res.status(500).json({ message: 'Failed to fetch generated invoice' });
    }
  });

  app.put('/api/invoice-status/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const updateData = req.body;
      
      const updatedStatus = await storage.updateInvoiceStatus(bookingId, updateData);
      res.json(updatedStatus);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({ message: 'Failed to update invoice status' });
    }
  });

  // Products and Services endpoints
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  app.post('/api/products', requireAdminAuth, async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.post('/api/services', requireAdminAuth, async (req, res) => {
    try {
      const service = await storage.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Failed to create service' });
    }
  });

  app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.updateProduct(parseInt(id), req.body);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.put('/api/services/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const service = await storage.updateService(parseInt(id), req.body);
      res.json(service);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: 'Failed to update service' });
    }
  });

  app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(parseInt(id));
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.delete('/api/services/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteService(parseInt(id));
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  });

  // Import endpoints
  app.get('/api/import-history', requireAdminAuth, async (req, res) => {
    try {
      const history = await storage.getImportHistory();
      res.json(history);
    } catch (error) {
      console.error('Error fetching import history:', error);
      res.status(500).json({ error: 'Failed to fetch import history' });
    }
  });

  app.post('/api/import-data', requireAdminAuth, async (req, res) => {
    try {
      const { type, data, fileName } = req.body;
      
      console.log('Processing bulk import request:', { type, fileName, dataLength: data.length });
      
      let result = { imported: 0, updated: 0, failed: 0 };
      
      if (type === 'products') {
        result = await storage.bulkCreateProducts(data);
      } else if (type === 'services') {
        result = await storage.bulkCreateServices(data);
      } else {
        return res.status(400).json({ error: 'Invalid import type. Must be products or services.' });
      }
      
      // Create import history record
      await storage.createImportHistory({
        fileName,
        fileType: type,
        recordsImported: result.imported,
        recordsUpdated: result.updated,
        recordsSkipped: result.failed,
        status: result.failed > 0 ? 'partial' : 'completed',
        errorMessage: result.failed > 0 ? `${result.failed} records failed to import` : null
      });
      
      // Create post-import snapshot for protection
      try {
        const { importProtection } = await import('./importDataProtection');
        await importProtection.createPostImportSnapshot();
        console.log("📸 Post-import snapshot created successfully");
      } catch (snapshotError) {
        console.error("❌ Failed to create post-import snapshot:", snapshotError);
      }

      console.log(`Bulk import completed:`, result);
      res.json({ 
        message: `Successfully processed ${result.imported + result.updated} ${type}`,
        ...result 
      });
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ error: 'Failed to import data' });
    }
  });

  // Create immediate snapshot endpoint
  app.post('/api/admin/create-snapshot', requireAdminAuth, async (req, res) => {
    try {
      const { importProtection } = await import('./importDataProtection');
      await importProtection.createPostImportSnapshot();
      
      // Get current data counts
      const allProducts = await storage.getAllProducts();
      const allServices = await storage.getAllServices();
      
      res.json({
        success: true,
        message: 'Snapshot created successfully',
        snapshot: {
          timestamp: new Date().toISOString(),
          totalProducts: allProducts.length,
          totalServices: allServices.length,
          importedProducts: Math.max(0, allProducts.length - 3),
          importedServices: Math.max(0, allServices.length - 3)
        }
      });
      
    } catch (error) {
      console.error('Error creating snapshot:', error);
      res.status(500).json({ error: 'Failed to create snapshot' });
    }
  });

  // Get all products endpoint
  app.get('/api/admin/products', requireAdminAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Get all services endpoint
  app.get('/api/admin/services', requireAdminAuth, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  // Create new service endpoint
  app.post('/api/admin/services', requireAdminAuth, async (req, res) => {
    try {
      const { name, nameAr, price } = req.body;
      
      if (!name || !price || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Name and valid price are required' });
      }

      const serviceData = {
        name,
        nameAr: nameAr || name,
        price: parseFloat(price),
        category: 'General',
        categoryAr: 'عام',
        isActive: true
      };

      const newService = await storage.createService(serviceData);
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Failed to create service' });
    }
  });

  // Update product price endpoint
  app.put('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { price } = req.body;
      
      if (!price || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Valid price is required' });
      }

      const updatedProduct = await storage.updateProduct(productId, { price: parseFloat(price) });
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product price:', error);
      res.status(500).json({ error: 'Failed to update product price' });
    }
  });

  // Update service price endpoint
  app.put('/api/admin/services/:id', requireAdminAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const { price } = req.body;
      
      if (!price || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Valid price is required' });
      }

      const updatedService = await storage.updateService(serviceId, { price: parseFloat(price) });
      res.json(updatedService);
    } catch (error) {
      console.error('Error updating service price:', error);
      res.status(500).json({ error: 'Failed to update service price' });
    }
  });

  // Data Protection Status endpoint
  app.get('/api/admin/protection-status', requireAdminAuth, async (req, res) => {
    try {
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const status = await ultimateDataProtection.getProtectionStatus();
      
      res.json({
        success: true,
        protection: status,
        message: 'Protection status retrieved successfully'
      });
    } catch (error) {
      console.error("❌ Failed to get protection status:", error);
      res.status(500).json({ error: 'Failed to get protection status' });
    }
  });

  // Emergency data restoration endpoint
  app.post('/api/admin/emergency-restore', requireAdminAuth, async (req, res) => {
    try {
      console.log("🚨 EMERGENCY RESTORATION STARTED");
      
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const restored = await ultimateDataProtection.emergencyRestore();
      
      if (restored) {
        console.log("✅ EMERGENCY RESTORATION COMPLETED");
        res.json({ 
          success: true, 
          message: 'Emergency restoration completed successfully'
        });
      } else {
        res.status(500).json({ error: 'Emergency restoration failed' });
      }
      
    } catch (error) {
      console.error("❌ Emergency restoration failed:", error);
      res.status(500).json({ error: 'Emergency restoration failed' });
    }
  });

  // Manual backup creation endpoint
  app.post('/api/admin/create-backup', requireAdminAuth, async (req, res) => {
    try {
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const backupCreated = await ultimateDataProtection.createRealTimeBackup();
      
      if (backupCreated) {
        res.json({ 
          success: true, 
          message: 'Backup created successfully'
        });
      } else {
        res.status(500).json({ error: 'Backup creation failed' });
      }
      
    } catch (error) {
      console.error("❌ Backup creation failed:", error);
      res.status(500).json({ error: 'Backup creation failed' });
    }
  });

  // Data integrity check endpoint
  app.get('/api/admin/integrity-check', requireAdminAuth, async (req, res) => {
    try {
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const integrity = await ultimateDataProtection.monitorDataIntegrity();
      
      res.json({
        success: true,
        integrity: integrity,
        message: 'Data integrity check completed'
      });
      
    } catch (error) {
      console.error("❌ Data integrity check failed:", error);
      res.status(500).json({ error: 'Data integrity check failed' });
    }
  });

  // Download templates endpoint
  app.get('/api/admin/download-template/:type', requireAdminAuth, (req, res) => {
    const type = req.params.type;
    
    if (type === 'products') {
      const csv = 'name,price,category,description\n' +
                  'أطعمة جافة للقطط,45.00,أطعمة,أطعمة جافة عالية الجودة للقطط البالغة\n' +
                  'أطعمة جافة للكلاب,65.00,أطعمة,أطعمة جافة متوازنة للكلاب الصغيرة والمتوسطة\n' +
                  'لعبة كرة للقطط,15.00,ألعاب,لعبة كرة تفاعلية للقطط\n' +
                  'فيتامينات للطيور,25.00,مكملات,فيتامينات أساسية لصحة الطيور';
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="products_template.csv"');
      res.send('\uFEFF' + csv); // Add BOM for Arabic support
    } else if (type === 'services') {
      const csv = 'name,price,category,description\n' +
                  'فحص شامل للحيوان,150.00,فحوصات,فحص شامل لصحة الحيوان الأليف\n' +
                  'تطعيم أساسي,80.00,تطعيمات,تطعيم أساسي للحيوانات الأليفة\n' +
                  'قص أظافر,30.00,عناية,قص أظافر الحيوانات الأليفة\n' +
                  'تنظيف أسنان,120.00,عناية,تنظيف وفحص أسنان الحيوانات';
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="services_template.csv"');
      res.send('\uFEFF' + csv); // Add BOM for Arabic support
    } else {
      res.status(400).json({ message: 'Invalid template type' });
    }
  });

  // Get real-time tracking data for a booking
  app.get('/api/tracking/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      console.log('Booking data:', { id: booking.id, vetsVanId: booking.vetsVanId });

      // Get VetsVan location using vetsVanId (handle both camelCase and snake_case)
      const vetsVanId = booking.vetsVanId || (booking as any).vets_van_id;
      const driver = await storage.getDriver(vetsVanId);
      console.log('Driver search result:', driver ? { id: driver.id, name: driver.name } : 'Driver not found');
      
      if (!driver) {
        return res.status(404).json({ message: 'VetsVan not found' });
      }

      // Calculate real distance and estimated time
      const customerLat = booking.customerLocation?.latitude || 24.7136;
      const customerLng = booking.customerLocation?.longitude || 46.6753;
      const vetsVanLat = driver.latitude || 24.7136;
      const vetsVanLng = driver.longitude || 46.6753;

      // Calculate distance using Haversine formula
      const distance = calculateDistance(customerLat, customerLng, vetsVanLat, vetsVanLng);
      
      // Estimate arrival time (assuming 30 km/h average speed in city)
      const estimatedMinutes = Math.max(5, Math.ceil((distance / 30) * 60));

      const trackingData = {
        bookingId: booking.id,
        vetsVanCode: driver.vetsvanCode,
        estimatedArrivalMinutes: estimatedMinutes,
        distance: distance,
        customerLocation: {
          latitude: customerLat,
          longitude: customerLng,
          address: booking.customerLocation?.address || 'موقع العميل'
        },
        vetsVanLocation: {
          latitude: vetsVanLat,
          longitude: vetsVanLng,
          address: `${driver.name} - ${driver.vetsvanCode}`
        },
        driverName: driver.name,
        carModel: driver.carModel,
        carColor: driver.carColor,
        plateNumber: driver.plateNumber,
        status: booking.status,
        lastUpdated: new Date().toLocaleTimeString()
      };

      res.json(trackingData);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      res.status(500).json({ message: 'Failed to fetch tracking data' });
    }
  });

  // Invoice Payment endpoints
  app.post('/api/invoice-payments', requireAuth, async (req, res) => {
    try {
      console.log('Creating invoice payment:', req.body);
      const { bookingId, amount, paymentType, description } = req.body;
      
      if (!bookingId || !amount || !paymentType) {
        console.log('Missing required fields:', { bookingId, amount, paymentType });
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const paymentData = {
        bookingId: parseInt(bookingId),
        amount: parseFloat(amount),
        paymentType,
        description: description || null
      };

      console.log('Payment data to create:', paymentData);
      const payment = await storage.createInvoicePayment(paymentData);
      console.log('Payment created successfully:', payment);

      res.json(payment);
    } catch (error) {
      console.error('Error creating invoice payment:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  app.get('/api/invoice-payments/:bookingId', requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      console.log('Fetching invoice payments for booking:', bookingId);
      
      const payments = await storage.getInvoicePaymentsByBooking(bookingId);
      console.log('Found payments:', payments);
      
      res.json(payments);
    } catch (error) {
      console.error('Error fetching invoice payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  app.delete('/api/invoice-payments/:paymentId', requireAuth, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      await storage.deleteInvoicePayment(paymentId);
      
      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Error deleting invoice payment:', error);
      res.status(500).json({ message: 'Failed to delete payment' });
    }
  });

  // Export Sales Report to Excel
  app.get('/api/admin/export-sales-report', requireAdminAuth, async (req, res) => {
    try {
      // Get all invoices with payment details
      const invoices = await storage.getAllGeneratedInvoices();
      
      // Prepare data for Excel export
      const excelData = [];
      
      for (const invoice of invoices) {
        // Get invoice items for this booking
        const invoiceItems = await storage.getInvoiceItems(invoice.bookingId);
        
        // Basic invoice data
        const baseRow = {
          'Invoice Number': invoice.invoiceNumber,
          'Customer Name': invoice.customerName,
          'Customer Phone': invoice.customerPhone,
          'Customer Email': invoice.customerEmail || '',
          'Doctor Name': invoice.doctorName,
          'VetsVan Code': invoice.vetsVanCode,
          'Appointment Date': invoice.appointmentDate,
          'Appointment Time': invoice.appointmentTime,
          'Service Type': invoice.serviceType || '',
          'Total Sales (SAR)': parseFloat(invoice.finalTotal || '0').toFixed(2),
          'Total Paid (SAR)': invoice.totalPaid || '0.00',
          'VAT Amount (SAR)': parseFloat(invoice.vatAmount || '0').toFixed(2),
          'Discount Amount (SAR)': parseFloat(invoice.totalDiscountAmount || '0').toFixed(2),
          'Generated Date': invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleDateString() : '',
          'Notes': invoice.notes || ''
        };

        // Add pets information
        if (invoice.pets && invoice.pets.length > 0) {
          const petNames = invoice.pets.map(pet => pet.name).join(', ');
          const petTypes = invoice.pets.map(pet => pet.type).join(', ');
          baseRow['Pet Names'] = petNames;
          baseRow['Pet Types'] = petTypes;
        } else {
          baseRow['Pet Names'] = '';
          baseRow['Pet Types'] = '';
        }

        // Add invoice items details
        if (invoiceItems && invoiceItems.length > 0) {
          invoiceItems.forEach((item, itemIndex) => {
            const itemRow = { ...baseRow };
            itemRow['Item #'] = itemIndex + 1;
            itemRow['Description'] = item.description || '';
            itemRow['Quantity'] = item.quantity || '';
            itemRow['Unit Price (SAR)'] = parseFloat(item.unitPrice || '0').toFixed(2);
            itemRow['Item Total (SAR)'] = parseFloat(item.total || '0').toFixed(2);
            itemRow['Item Discount'] = item.discountType === 'percentage' ? '10%' : (item.discountType === 'none' ? 'No Discount' : item.discountType);
            
            // Add payment information only for the first item (itemIndex === 0)
            for (let i = 1; i <= 5; i++) {
              if (itemIndex === 0 && invoice.payments && invoice.payments[i-1]) {
                const payment = invoice.payments[i-1];
                itemRow[`Payment Type ${i}`] = payment.paymentType;
                itemRow[`Payment Amount ${i} (SAR)`] = parseFloat(payment.amount).toFixed(2);
                itemRow[`Payment Description ${i}`] = payment.description || '';
                itemRow[`Payment Date ${i}`] = new Date(payment.createdAt).toLocaleDateString();
                itemRow[`Payment Time ${i}`] = new Date(payment.createdAt).toLocaleTimeString();
              } else {
                itemRow[`Payment Type ${i}`] = '';
                itemRow[`Payment Amount ${i} (SAR)`] = '';
                itemRow[`Payment Description ${i}`] = '';
                itemRow[`Payment Date ${i}`] = '';
                itemRow[`Payment Time ${i}`] = '';
              }
            }
            
            excelData.push(itemRow);
          });
        } else {
          // No invoice items, add base invoice row with payment details
          baseRow['Item #'] = '';
          baseRow['Description'] = '';
          baseRow['Quantity'] = '';
          baseRow['Unit Price (SAR)'] = '';
          baseRow['Item Total (SAR)'] = '';
          baseRow['Item Discount'] = '';
          
          // Add individual payment columns (up to 5 payments max)
          for (let i = 1; i <= 5; i++) {
            if (invoice.payments && invoice.payments[i-1]) {
              const payment = invoice.payments[i-1];
              baseRow[`Payment Type ${i}`] = payment.paymentType;
              baseRow[`Payment Amount ${i} (SAR)`] = parseFloat(payment.amount).toFixed(2);
              baseRow[`Payment Description ${i}`] = payment.description || '';
              baseRow[`Payment Date ${i}`] = new Date(payment.createdAt).toLocaleDateString();
              baseRow[`Payment Time ${i}`] = new Date(payment.createdAt).toLocaleTimeString();
            } else {
              baseRow[`Payment Type ${i}`] = '';
              baseRow[`Payment Amount ${i} (SAR)`] = '';
              baseRow[`Payment Description ${i}`] = '';
              baseRow[`Payment Date ${i}`] = '';
              baseRow[`Payment Time ${i}`] = '';
            }
          }
          
          excelData.push(baseRow);
        }
      }

      // Send the data to be processed on frontend
      res.json({
        success: true,
        data: excelData,
        filename: `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      });

    } catch (error) {
      console.error('Error exporting sales report:', error);
      res.status(500).json({ message: 'Failed to export sales report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
