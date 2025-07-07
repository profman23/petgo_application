import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, rideRequestSchema, registerSchema } from "@shared/schema";
import { ZodError } from "zod";
import { emailService } from "./emailService";
// Payment service removed per user request

// Simple session middleware
const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const session = sessions.get(sessionId);
  
  if (!session) {
    console.log('Invalid token:', sessionId);
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  req.user = session.user;
  next();
}

// Error message translations
function getErrorMessage(key: string, language: string = 'ar') {
  const messages = {
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
  
  return messages[language]?.[key] || messages.ar[key];
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
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByIdentifier(identifier);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'رقم الهاتف أو الإيميل أو كلمة المرور غير صحيحة' });
      }
      
      const sessionId = generateSessionId();
      sessions.set(sessionId, { user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType } });
      
      res.json({ 
        token: sessionId, 
        user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType }
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
      
      // Remove captcha from data before storing
      const { captcha, ...userData } = validatedData;
      
      // Combine firstName and lastName into name
      const fullUserData = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
        membershipType: 'standard'
      };
      
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      const existingUserByPhone = await storage.getUserByPhone(fullUserData.phone);
      if (existingUserByPhone) {
        return res.status(400).json({ message: getErrorMessage('phoneExists', userLanguage) });
      }
      
      // Check if email is already registered
      if (fullUserData.email) {
        const existingUserByEmail = await storage.getUserByEmail(fullUserData.email);
        if (existingUserByEmail) {
          return res.status(400).json({ message: getErrorMessage('emailExists', userLanguage) });
        }
      }
      
      const user = await storage.createUser(fullUserData);
      const sessionId = generateSessionId();
      sessions.set(sessionId, { user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType } });
      
      // Send welcome email if email is provided
      if (user.email) {
        try {
          await emailService.sendWelcomeEmail(user.email, user.firstName || user.name, 'حيوانك الأليف');
          console.log(`✅ Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError);
          // Don't fail registration if email fails
        }
      }
      
      res.json({ 
        token: sessionId, 
        user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      // Handle database unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        const userLanguage = req.body.preferredLanguage || 'ar';
        
        if (error.constraint === 'users_phone_unique') {
          return res.status(400).json({ message: getErrorMessage('phoneExists', userLanguage) });
        }
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: getErrorMessage('emailExists', userLanguage) });
        }
      }
      
      console.error('Registration error:', error);
      const userLanguage = req.body.preferredLanguage || 'ar';
      res.status(500).json({ message: getErrorMessage('serverError', userLanguage) });
    }
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(sessionId);
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
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
      sessions.set(sessionId, { 
        user: { 
          id: driver.id, 
          phone: driver.phone, 
          name: driver.name, 
          membershipType: 'doctor',
          vetsVanId: driver.id, // Using driver.id as VetsVan ID
          vetsVanName: driver.vetsvanName
        } 
      });
      
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
    } catch (error) {
      console.error('Doctor login error:', error);
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  // Driver routes
  app.get('/api/drivers/available', requireAuth, async (req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
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
          driver.latitude,
          driver.longitude
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
    } catch (error) {
      res.status(500).json({ message: 'خطأ في جلب السائقين القريبين' });
    }
  });

  // Ride routes
  app.post('/api/rides/request', requireAuth, async (req, res) => {
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
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'خطأ في طلب الرحلة' });
    }
  });

  // Get all rides for current user (for Activity page)
  app.get('/api/rides', requireAuth, async (req, res) => {
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
    } catch (error) {
      console.error('Error fetching user rides:', error);
      res.status(500).json({ message: 'خطأ في جلب الطلبات' });
    }
  });

  app.get('/api/rides/active', requireAuth, async (req, res) => {
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
  app.put('/api/rides/:id/status', requireAuth, async (req: any, res) => {
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
    } catch (error) {
      console.error('Error updating ride status:', error);
      res.status(500).json({ message: 'Failed to update ride status' });
    }
  });

  // Simulate ride status updates
  app.post('/api/rides/:id/simulate', requireAuth, async (req, res) => {
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
                driver.latitude,
                driver.longitude
              );
              const nearestDistance = calculateDistance(
                ride.pickupLatitude,
                ride.pickupLongitude,
                nearest.latitude,
                nearest.longitude
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
    } catch (error) {
      res.status(500).json({ message: 'خطأ في محاكاة الرحلة' });
    }
  });

  // Get user profile
  app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  });

  // Update user profile
  app.put('/api/user/profile', requireAuth, async (req, res) => {
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
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  });

  // Reset password
  app.put('/api/user/reset-password', requireAuth, async (req, res) => {
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
      const { name, type, ageYear, ageMonth, ageDay, photo } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ message: 'Patient name and type are required' });
      }
      
      const patient = await storage.createPatient({
        userId,
        name,
        type,
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
      const { name, type, ageYear, ageMonth, ageDay, photo } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ message: 'Patient name and type are required' });
      }
      
      const updatedPatient = await storage.updatePatient(patientId, userId, {
        name,
        type,
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

  // Get all VetsVan with their available shifts for booking
  app.get('/api/vetsvan/availability', requireAuth, async (req: any, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      const shifts = await storage.getAllShifts();
      const bookings = await storage.getAllBookings();
      
      // Get customer location from query parameters
      const customerLat = req.query.lat ? parseFloat(req.query.lat) : null;
      const customerLon = req.query.lon ? parseFloat(req.query.lon) : null;
      
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

      res.json(sortedVetsVans);
    } catch (error) {
      console.error('Error fetching VetsVan availability:', error);
      res.status(500).json({ message: 'Failed to fetch VetsVan availability' });
    }
  });

  // Book an appointment
  app.post('/api/bookings', requireAuth, async (req: any, res) => {
    try {
      const { shiftId, vetsVanId, appointmentDate, appointmentTime, customerLocation } = req.body;
      const userId = req.user.id;
      
      console.log('📍 Creating booking with request body:', req.body);
      console.log('📍 Customer location received:', customerLocation);
      console.log('📍 User ID:', userId);

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
        customerLocation: customerLocation || null
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
  app.get('/api/user/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
    } catch (error) {
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

  // Get user's bookings
  app.get('/api/user/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
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

  // Doctor VetsVan location endpoint
  app.get('/api/doctor/vetsvan-location', requireAuth, async (req, res) => {
    try {
      const user = req.user;
      
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Get the doctor's VetsVan information with location
      const driver = await storage.getDriverByUsername(user.phone);
      if (!driver) {
        return res.status(404).json({ message: 'VetsVan not found' });
      }
      
      res.json({
        vetsVanId: driver.id,
        vetsvanCode: driver.vetsvanCode,
        vetsvanName: driver.vetsvanName,
        latitude: driver.latitude,
        longitude: driver.longitude,
        carModel: driver.carModel,
        carColor: driver.carColor,
        plateNumber: driver.plateNumber
      });
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
      const taqnyatApiUrl = 'https://api.taqnyat.sa/sms/send';
      const bearerToken = process.env.TAQNYAT_API_KEY;
      
      if (!bearerToken) {
        console.error('TAQNYAT_API_KEY is not configured');
        return res.status(500).json({ message: 'SMS service not configured' });
      }

      // Prepare SMS data for Taqnyat
      const smsData = {
        recipients: [phoneNumber],
        body: message,
        sender: "VETSVAN" // Your sender name registered with Taqnyat
      };

      // Send SMS via Taqnyat API
      const response = await fetch(taqnyatApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smsData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Taqnyat API Error:', errorData);
        return res.status(500).json({ 
          message: 'Failed to send SMS',
          error: errorData 
        });
      }

      const result = await response.json();
      console.log('SMS sent successfully:', result);

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

  const httpServer = createServer(app);
  return httpServer;
}
