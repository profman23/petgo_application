import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, rideRequestSchema } from "@shared/schema";
import { ZodError } from "zod";

// Simple session middleware
const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  req.user = session.user;
  next();
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
      const { phone, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByPhone(phone);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
      }
      
      const sessionId = generateSessionId();
      sessions.set(sessionId, { user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType } });
      
      res.json({ 
        token: sessionId, 
        user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(400).json({ message: 'رقم الهاتف مستخدم بالفعل' });
      }
      
      const user = await storage.createUser(userData);
      const sessionId = generateSessionId();
      sessions.set(sessionId, { user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType } });
      
      res.json({ 
        token: sessionId, 
        user: { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(sessionId);
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
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
      
      // Check if user has active ride
      const activeRide = await storage.getUserActiveRide(req.user.id);
      if (activeRide) {
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

  app.get('/api/rides/active', requireAuth, async (req, res) => {
    try {
      const ride = await storage.getUserActiveRide(req.user.id);
      if (!ride) {
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

  app.put('/api/rides/:id/cancel', requireAuth, async (req, res) => {
    try {
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride || ride.customerId !== req.user.id) {
        return res.status(404).json({ message: 'الرحلة غير موجودة' });
      }
      
      if (['completed', 'cancelled'].includes(ride.status)) {
        return res.status(400).json({ message: 'لا يمكن إلغاء هذه الرحلة' });
      }
      
      await storage.updateRideStatus(rideId, 'cancelled');
      
      // Make driver available again
      if (ride.driverId) {
        await storage.updateDriverAvailability(ride.driverId, true);
      }
      
      res.json({ message: 'تم إلغاء الرحلة بنجاح' });
    } catch (error) {
      res.status(500).json({ message: 'خطأ في إلغاء الرحلة' });
    }
  });

  // Doctor endpoints for ride management
  app.get('/api/doctor/pending-rides', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const allRides = await storage.getAllRides();
      const pendingRides = allRides.filter(ride => ride.status === 'requested' || ride.status === 'processing');
      
      // Get customer details for each ride
      const ridesWithCustomers = await Promise.all(
        pendingRides.map(async (ride) => {
          const customer = await storage.getUser(ride.customerId);
          return {
            ...ride,
            customer: customer ? { name: customer.name, phone: customer.phone } : null
          };
        })
      );
      
      res.json(ridesWithCustomers);
    } catch (error) {
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
      
      if (ride.status !== 'requested' && ride.status !== 'processing') {
        return res.status(400).json({ message: 'لا يمكن قبول هذا الطلب' });
      }
      
      // Find and assign nearest available doctor
      const doctors = await storage.getAvailableDrivers();
      if (doctors.length > 0) {
        const nearestDoctor = doctors[0]; // Simplified: take first available
        await storage.assignDriverToRide(rideId, nearestDoctor.id);
        await storage.updateDriverAvailability(nearestDoctor.id, false);
        await storage.updateRideStatus(rideId, 'confirmed');
        
        // Simulate progression
        setTimeout(async () => {
          await storage.updateRideStatus(rideId, 'enroute');
          setTimeout(async () => {
            await storage.updateRideStatus(rideId, 'arrived');
          }, 10000);
        }, 5000);
      }
      
      res.json({ message: 'تم قبول الطلب بنجاح' });
    } catch (error) {
      res.status(500).json({ message: 'خطأ في قبول الطلب' });
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
      
      if (ride.status !== 'requested' && ride.status !== 'processing') {
        return res.status(400).json({ message: 'لا يمكن رفض هذا الطلب' });
      }
      
      await storage.updateRideStatus(rideId, 'cancelled');
      res.json({ message: 'تم رفض الطلب' });
    } catch (error) {
      res.status(500).json({ message: 'خطأ في رفض الطلب' });
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

  const httpServer = createServer(app);
  return httpServer;
}
