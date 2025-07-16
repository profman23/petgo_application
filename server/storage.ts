import { users, drivers, rides, patients, admins, shifts, bookings, reviews, petVitals, petAttachments, invoiceItems, invoiceStatus, products, services, importHistory, otpVerifications, generatedInvoices, type User, type Driver, type Ride, type InsertUser, type RideRequest, type Patient, type InsertPatient, type Admin, type InsertDriver, type Shift, type InsertShift, type Booking, type InsertBooking, type Review, type InsertReview, type PetVital, type InsertPetVital, type PetAttachment, type InsertPetAttachment, type InvoiceItem, type InsertInvoiceItem, type InvoiceStatus, type InsertInvoiceStatus, type Product, type InsertProduct, type Service, type InsertService, type ImportHistory, type InsertImportHistory, type OtpVerification, type InsertOtpVerification, type GeneratedInvoice, type InsertGeneratedInvoice } from "@shared/schema";
import { db } from "./db";
import { eq, and, not, inArray, desc, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  
  // Driver operations
  getAllDrivers(): Promise<Driver[]>;
  getAvailableDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUsername(username: string): Promise<Driver | undefined>;
  getDriverByVetsVanCode(vetsVanCode: string): Promise<Driver | undefined>;
  updateDriverLocation(id: number, latitude: number, longitude: number): Promise<void>;
  updateDriverAvailability(id: number, isAvailable: boolean): Promise<void>;
  updateVetsVanData(id: number, vetsvanCode: string, vetsvanName: string): Promise<void>;
  
  // Ride operations
  createRide(ride: RideRequest): Promise<Ride>;
  getRide(id: number): Promise<Ride | undefined>;
  getAllRides(): Promise<Ride[]>;
  updateRideStatus(id: number, status: string): Promise<void>;
  assignDriverToRide(rideId: number, driverId: number): Promise<void>;
  getUserActiveRide(userId: number): Promise<Ride | undefined>;
  getDriverActiveRide(driverId: number): Promise<Ride | undefined>;

  // Patient operations
  getUserPatients(userId: number): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(patientId: number, userId: number, updateData: Partial<Patient>): Promise<Patient | undefined>;

  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  deleteDriver(id: number): Promise<void>;

  // Shifts operations
  getAllShifts(): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  deleteShift(id: number): Promise<void>;

  // Bookings operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getShiftBookings(shiftId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  updateBookingStatus(bookingId: number, status: string): Promise<Booking | undefined>;
  getBookingWithUserDetails(bookingId: number): Promise<Booking & { user: User } | undefined>;
  getBookingWithDetails(bookingId: number): Promise<any>;

  // Reviews operations
  createReview(review: InsertReview): Promise<Review>;
  getBookingReview(bookingId: number): Promise<Review | undefined>;
  getUserReviews(userId: number): Promise<Review[]>;

  // Reports operations
  getReportsStats(): Promise<{
    totalBookings: number;
    completedBookings: number;
    averageRating: number;
    totalReviews: number;
    totalVetsVans: number;
    availableVetsVans: number;
  }>;
  getDetailedReviews(): Promise<Array<{
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    userName: string;
    userPhone: string;
    vetsvanName: string;
    vetsvanCode: string;
  }>>;
  
  // VetsVan requests operations
  getAllVetsVanRequestsWithDetails(): Promise<Array<{
    id: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    vetsvanCode: string;
    vetsvanName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    location: any;
    pets: Array<{ name: string; type: string; }>;
    serviceType: string;
    createdAt: string;
  }>>;

  // Pet vitals operations
  createPetVital(vital: InsertPetVital): Promise<PetVital>;
  getPetVitalsByBooking(bookingId: number): Promise<PetVital[]>;
  updatePetVital(id: number, vital: Partial<InsertPetVital>): Promise<PetVital>;

  // Pet attachments operations
  createPetAttachment(attachment: InsertPetAttachment): Promise<PetAttachment>;
  getPetAttachmentsByBooking(bookingId: number): Promise<PetAttachment[]>;
  getPetAttachmentsByPet(petId: number, bookingId: number): Promise<PetAttachment[]>;
  deletePetAttachment(id: number, uploadedBy: string): Promise<boolean>;

  // Invoice Items operations
  saveInvoiceItems(bookingId: number, items: any[]): Promise<InvoiceItem[]>;
  getInvoiceItems(bookingId: number): Promise<InvoiceItem[]>;
  deleteInvoiceItems(bookingId: number): Promise<void>;

  // Invoice Status operations
  saveInvoiceStatus(status: InsertInvoiceStatus): Promise<InvoiceStatus>;
  getInvoiceStatus(bookingId: number): Promise<InvoiceStatus | undefined>;
  updateInvoiceStatus(bookingId: number, data: Partial<InvoiceStatus>): Promise<InvoiceStatus | undefined>;

  // Generated Invoices operations
  createGeneratedInvoice(invoice: InsertGeneratedInvoice): Promise<GeneratedInvoice>;
  getAllGeneratedInvoices(): Promise<GeneratedInvoice[]>;
  getGeneratedInvoice(id: number): Promise<GeneratedInvoice | undefined>;
  getGeneratedInvoiceByNumber(invoiceNumber: string): Promise<GeneratedInvoice | undefined>;
  getGeneratedInvoiceByBooking(bookingId: number): Promise<GeneratedInvoice | undefined>;
  getNextInvoiceNumber(): Promise<string>;
  updateInvoiceEmailStatus(id: number, isEmailSent: boolean): Promise<void>;
  
  // Products and Services for import system
  getProducts(): Promise<any[]>;
  getServices(): Promise<any[]>;
  createProduct(product: any): Promise<any>;
  createService(service: any): Promise<any>;
  updateProduct(id: number, product: any): Promise<any>;
  updateService(id: number, service: any): Promise<any>;
  deleteProduct(id: number): Promise<void>;
  deleteService(id: number): Promise<void>;
  
  // Import history
  getImportHistory(): Promise<any[]>;
  createImportHistory(importData: any): Promise<any>;
  
  // Bulk import operations
  bulkCreateServices(services: any[]): Promise<{ imported: number; updated: number; failed: number }>;
  bulkCreateProducts(products: any[]): Promise<{ imported: number; updated: number; failed: number }>;

  // OTP Verification operations
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(email: string, code: string): Promise<OtpVerification | undefined>;
  deleteOtpVerification(email: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;

  // Tracking notification operations
  createTrackingNotification(notification: any): Promise<any>;
  getBookingById(bookingId: number): Promise<Booking | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // PERMANENTLY DISABLED - No initialization of test data
    // All data creation now happens only through Import system
    this.startDataProtection();
  }

  private async startDataProtection() {
    try {
      // Import and start data integrity guard
      const { dataGuard } = await import('./dataIntegrityGuard');
      await dataGuard.startMonitoring();
      console.log("🛡️ Data Integrity Guard activated");
      
      // Initialize Import Data Lock System
      const { importDataLock } = await import('./importDataLock');
      await importDataLock.initializeLock();
      console.log("🔒 Import Data Lock System activated");
    } catch (error) {
      console.error("⚠️ Data protection system initialization failed:", error);
    }
  }

  // PERMANENTLY DISABLED FUNCTION - NO LONGER USED
  private async DISABLED_initializeTestData() {
    // THIS FUNCTION IS PERMANENTLY DISABLED TO PREVENT DATA LOSS
    // All data is now created only through the Import system
    return; // Exit immediately without doing anything
    
    try {
      // Enhanced data integrity check - verify all critical tables
      const existingUsers = await db.select().from(users).limit(1);
      const existingProducts = await db.select().from(products).limit(1);
      const existingServices = await db.select().from(services).limit(1);
      const existingDrivers = await db.select().from(drivers).limit(1);
      const existingAdmins = await db.select().from(admins).limit(1);
      
      // Smart initialization - only create missing data
      let shouldInitializeUsers = existingUsers.length === 0;
      let shouldInitializeDrivers = existingDrivers.length === 0;
      let shouldInitializeAdmins = existingAdmins.length === 0;
      // Only create default products/services if completely empty (protect imported data)
      let shouldInitializeProducts = existingProducts.length === 0;
      let shouldInitializeServices = existingServices.length === 0;
      
      // Enhanced protection: If imported data exists (more than default 3), preserve it
      if (existingProducts.length > 3) {
        console.log(`🔒 IMPORTED PRODUCTS PROTECTED: ${existingProducts.length} products found, skipping default creation`);
        shouldInitializeProducts = false;
      }
      if (existingServices.length > 3) {
        console.log(`🔒 IMPORTED SERVICES PROTECTED: ${existingServices.length} services found, skipping default creation`);
        shouldInitializeServices = false;
      }
      
      // Data integrity log
      console.log("🔍 Database Integrity Check:", {
        users: existingUsers.length,
        drivers: existingDrivers.length,
        admins: existingAdmins.length,
        products: existingProducts.length,
        services: existingServices.length
      });
      
      if (!shouldInitializeUsers && !shouldInitializeDrivers && !shouldInitializeAdmins && 
          !shouldInitializeProducts && !shouldInitializeServices) {
        console.log("✅ All critical data exists - no initialization needed");
        return;
      }

      if (shouldInitializeUsers) {
        // Create test user
        await db.insert(users).values({
        id: 1,
        phone: "0501234567",
        email: "test@test.com",
        password: "123456",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
        petName: "Test Pet",
        petType: "Cat",
        address: "Test Address",
        membershipType: "premium"
      });

      }
      
      if (shouldInitializeAdmins) {
        // Create admin
        await db.insert(admins).values({
        id: 1,
        username: "admin",
        password: "123456",
        name: "Admin User",
        role: "admin"
      });

      }
      
      if (shouldInitializeDrivers) {
        // Create drivers
        await db.insert(drivers).values([
        {
          id: 1,
          phone: "0512345678",
          password: "123456",
          name: "د. أحمد محمد",
          vetsvanCode: "v001",
          vetsvanName: "VetsVan001",
          username: "v001",
          rating: 4.8,
          carModel: "Mercedes Sprinter",
          carColor: "Purple",
          plateNumber: "ABC-123",
          latitude: 24.7136,
          longitude: 46.6753,
          isAvailable: true,
          profileImageUrl: null
        },
        {
          id: 2,
          phone: "0523456789",
          password: "123456",
          name: "د. فاطمة السالم",
          vetsvanCode: "v002",
          vetsvanName: "VetsVan002",
          username: "v002",
          rating: 4.6,
          carModel: "Mercedes Sprinter",
          carColor: "Purple",
          plateNumber: "DEF-456",
          latitude: 24.7200,
          longitude: 46.6800,
          isAvailable: true,
          profileImageUrl: null
        },
        {
          id: 3,
          phone: "0534567890",
          password: "123456",
          name: "د. سارة علي",
          vetsvanCode: "v003",
          vetsvanName: "VETS003",
          username: "v003",
          rating: 4.9,
          carModel: "Mercedes Sprinter",
          carColor: "Purple",
          plateNumber: "GHI-789",
          latitude: 24.7136,
          longitude: 46.6753,
          isAvailable: true,
          profileImageUrl: null
        }
      ]);

      // Create shifts
      await db.insert(shifts).values([
        {
          id: 1,
          vetsVanId: 1,
          date: "2025-01-10",
          startTime: "08:00",
          endTime: "17:00",
          duration: 9,
          status: "active"
        },
        {
          id: 2,
          vetsVanId: 2,
          date: "2025-01-10",
          startTime: "09:00",
          endTime: "18:00",
          duration: 9,
          status: "active"
        },
        {
          id: 3,
          vetsVanId: 3,
          date: "2025-01-10",
          startTime: "07:00",
          endTime: "16:00",
          duration: 9,
          status: "active"
        }
      ]);
      }

      // DISABLED - This was causing data loss on every restart
      // Essential products protected by Import Data Protection System
      if (false && shouldInitializeProducts) {
        await db.insert(products).values([
          {
            name: 'Pet Food Premium',
            nameAr: 'طعام حيوانات مميز',
            description: 'High quality pet food for dogs and cats',
            descriptionAr: 'طعام عالي الجودة للكلاب والقطط',
            price: 85.50,
            category: 'Food',
            categoryAr: 'طعام',
            sku: 'PF001',
            unit: 'Bag',
            unitAr: 'كيس',
            isActive: true
          },
          {
            name: 'Vitamin Supplements',
            nameAr: 'فيتامينات',
            description: 'Essential vitamins for pet health',
            descriptionAr: 'فيتامينات أساسية لصحة الحيوانات',
            price: 125.00,
            category: 'Health',
            categoryAr: 'صحة',
            sku: 'VIT001',
            unit: 'Bottle',
            unitAr: 'زجاجة',
            isActive: true
          },
          {
            name: 'Pet Toys Set',
            nameAr: 'مجموعة ألعاب',
            description: 'Interactive toys for pets',
            descriptionAr: 'ألعاب تفاعلية للحيوانات الأليفة',
            price: 45.75,
            category: 'Toys',
            categoryAr: 'ألعاب',
            sku: 'TOY001',
            unit: 'Set',
            unitAr: 'مجموعة',
            isActive: true
          }
        ]);
      }

      // DISABLED - This was causing data loss on every restart  
      // Essential services protected by Import Data Protection System
      if (false && shouldInitializeServices) {
        await db.insert(services).values([
          {
            name: 'General Checkup',
            nameAr: 'فحص عام',
            description: 'Complete health examination',
            descriptionAr: 'فحص صحي شامل',
            price: 150.00,
            category: 'Medical',
            categoryAr: 'طبي',
            duration: 30,
            isActive: true
          },
          {
            name: 'Vaccination',
            nameAr: 'تطعيم',
            description: 'Essential vaccinations',
            descriptionAr: 'تطعيمات أساسية',
            price: 200.00,
            category: 'Medical',
            categoryAr: 'طبي',
            duration: 15,
            isActive: true
          },
          {
            name: 'Grooming',
            nameAr: 'تنظيف',
            description: 'Professional grooming service',
            descriptionAr: 'خدمة تنظيف احترافية',
            price: 100.00,
            category: 'Grooming',
            categoryAr: 'تنظيف',
            duration: 45,
            isActive: true
          }
        ]);
      }

      console.log("🎯 Database initialization completed:", {
        users: shouldInitializeUsers ? "✅ created" : "⚡ existed",
        drivers: shouldInitializeDrivers ? "✅ created" : "⚡ existed",
        admins: shouldInitializeAdmins ? "✅ created" : "⚡ existed",
        products: shouldInitializeProducts ? "✅ created" : "⚡ existed", 
        services: shouldInitializeServices ? "✅ created" : "⚡ existed"
      });
    } catch (error) {
      console.error("Error initializing test data:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      identifier.includes('@') 
        ? eq(users.email, identifier)
        : eq(users.phone, identifier)
    );
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Driver operations
  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.isAvailable, true));
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUsername(username: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.username, username));
    return driver;
  }

  async getDriverByVetsVanCode(vetsVanCode: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.vetsvanCode, vetsVanCode));
    return driver;
  }

  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<void> {
    await db
      .update(drivers)
      .set({ latitude, longitude })
      .where(eq(drivers.id, id));
  }

  async updateVetsVanData(id: number, vetsvanCode: string, vetsvanName: string): Promise<void> {
    await db
      .update(drivers)
      .set({ vetsvanCode, vetsvanName })
      .where(eq(drivers.id, id));
  }

  async updateDriverAvailability(id: number, isAvailable: boolean): Promise<void> {
    await db
      .update(drivers)
      .set({ isAvailable })
      .where(eq(drivers.id, id));
  }

  // Ride operations
  async createRide(rideData: RideRequest): Promise<Ride> {
    const [ride] = await db.insert(rides).values(rideData).returning();
    return ride;
  }

  async getRide(id: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride;
  }

  async getAllRides(): Promise<Ride[]> {
    return await db.select().from(rides);
  }

  async updateRideStatus(id: number, status: string): Promise<void> {
    await db
      .update(rides)
      .set({ status })
      .where(eq(rides.id, id));
  }

  async assignDriverToRide(rideId: number, driverId: number): Promise<void> {
    await db
      .update(rides)
      .set({ driverId })
      .where(eq(rides.id, rideId));
  }

  async getUserActiveRide(userId: number): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(and(
        eq(rides.customerId, userId),
        not(inArray(rides.status, ["completed", "cancelled"]))
      ));
    return ride;
  }

  async getDriverActiveRide(driverId: number): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(and(
        eq(rides.driverId, driverId),
        not(inArray(rides.status, ["completed", "cancelled"]))
      ));
    return ride;
  }

  // Patient operations
  async getUserPatients(userId: number): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.userId, userId));
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatient(patientId: number, userId: number, updateData: Partial<Patient>): Promise<Patient | undefined> {
    const [updatedPatient] = await db
      .update(patients)
      .set(updateData)
      .where(and(eq(patients.id, patientId), eq(patients.userId, userId)))
      .returning();
    return updatedPatient;
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async deleteDriver(id: number): Promise<void> {
    await db.delete(drivers).where(eq(drivers.id, id));
  }

  // Shifts operations
  async getAllShifts(): Promise<Shift[]> {
    return await db.select().from(shifts);
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  // Bookings operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    // Ensure customerLocation has proper typing
    const bookingData = {
      ...booking,
      customerLocation: booking.customerLocation ? {
        ...booking.customerLocation,
        address: booking.customerLocation.address as string | undefined
      } : booking.customerLocation
    };
    
    const [newBooking] = await db.insert(bookings).values([bookingData]).returning();
    return newBooking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getShiftBookings(shiftId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.shiftId, shiftId));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async updateBookingStatus(bookingId: number, status: string): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, bookingId))
      .returning();
    return updatedBooking;
  }

  async getBookingWithUserDetails(bookingId: number): Promise<Booking & { user: User } | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, bookingId));

    if (!result) return undefined;

    return {
      ...result.bookings,
      user: result.users
    };
  }

  async getBookingWithDetails(bookingId: number): Promise<any> {
    const [result] = await db
      .select()
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, bookingId));

    if (!result) return undefined;

    const booking = result.bookings;
    const user = result.users;

    // Get user's pets for selected pets
    const userPets = await this.getUserPatients(user.id);
    const selectedPetObjects = booking.selectedPets?.map((selectedPet: any) => {
      const pet = userPets.find(p => p.id === selectedPet.id);
      return pet ? {
        id: pet.id,
        name: pet.name,
        type: pet.type,
        ageYear: pet.ageYear,
        ageMonth: pet.ageMonth,
        ageDay: pet.ageDay
      } : selectedPet;
    }) || [];

    return {
      ...booking,
      customerName: user.name || 'غير معروف',
      customerPhone: user.phone || 'غير محدد',
      customerEmail: user.email || 'غير محدد',
      pets: selectedPetObjects,
      selectedPets: selectedPetObjects
    };
  }

  // Reviews operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getBookingReview(bookingId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId));
    return review;
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }

  // Reports operations
  async getReportsStats(): Promise<{
    totalBookings: number;
    completedBookings: number;
    averageRating: number;
    totalReviews: number;
    totalVetsVans: number;
    availableVetsVans: number;
  }> {
    const allBookings = await db.select().from(bookings);
    const completedBookings = allBookings.filter(b => b.status === "completed");
    const allReviews = await db.select().from(reviews);
    const allDrivers = await db.select().from(drivers);
    const availableDrivers = allDrivers.filter(d => d.isAvailable);

    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    return {
      totalBookings: allBookings.length,
      completedBookings: completedBookings.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: allReviews.length,
      totalVetsVans: allDrivers.length,
      availableVetsVans: availableDrivers.length
    };
  }

  async getDetailedReviews(): Promise<Array<{
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    userName: string;
    userPhone: string;
    vetsvanName: string;
    vetsvanCode: string;
  }>> {
    const reviewData = await db
      .select({
        reviewId: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        reviewCreatedAt: reviews.createdAt,
        userName: users.name,
        userPhone: users.phone,
        vetsvanName: drivers.vetsvanName,
        vetsvanCode: drivers.vetsvanCode
      })
      .from(reviews)
      .innerJoin(bookings, eq(reviews.bookingId, bookings.id))
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(drivers, eq(bookings.vetsVanId, drivers.id));

    return reviewData.map(review => ({
      id: review.reviewId,
      rating: review.rating,
      comment: review.comment || "",
      createdAt: review.reviewCreatedAt?.toISOString() || new Date().toISOString(),
      userName: review.userName || "Unknown",
      userPhone: review.userPhone || "Unknown",
      vetsvanName: review.vetsvanName || "Unknown",
      vetsvanCode: review.vetsvanCode || "Unknown"
    }));
  }

  // VetsVan requests operations
  async getAllVetsVanRequestsWithDetails(): Promise<Array<{
    id: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    vetsvanCode: string;
    vetsvanName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    location: any;
    pets: Array<{ name: string; type: string; }>;
    serviceType: string;
    createdAt: string;
  }>> {
    const bookingData = await db
      .select({
        bookingId: bookings.id,
        appointmentDate: bookings.appointmentDate,
        appointmentTime: bookings.appointmentTime,
        status: bookings.status,
        customerLocation: bookings.customerLocation,
        selectedPets: bookings.selectedPets,
        serviceType: bookings.serviceType,
        bookingCreatedAt: bookings.createdAt,
        customerName: users.name,
        customerPhone: users.phone,
        customerEmail: users.email,
        vetsvanCode: drivers.vetsvanCode,
        vetsvanName: drivers.vetsvanName
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(drivers, eq(bookings.vetsVanId, drivers.id));

    return bookingData.map(booking => {
      // Extract pet names and types from selectedPets
      const pets = booking.selectedPets?.map((pet: any) => ({
        name: pet.name || "Unknown",
        type: pet.type || "Unknown"
      })) || [];

      return {
        id: booking.bookingId,
        customerName: booking.customerName || "Unknown",
        customerPhone: booking.customerPhone || "Unknown",
        customerEmail: booking.customerEmail || "Unknown",
        vetsvanCode: booking.vetsvanCode || "Unknown",
        vetsvanName: booking.vetsvanName || "Unknown",
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status,
        location: booking.customerLocation,
        pets: pets,
        serviceType: booking.serviceType || "Unknown",
        createdAt: booking.bookingCreatedAt?.toISOString() || new Date().toISOString()
      };
    });
  }

  // Pet vitals operations
  async createPetVital(vital: InsertPetVital): Promise<PetVital> {
    const [newVital] = await db.insert(petVitals).values(vital).returning();
    return newVital;
  }

  async getPetVitalsByBooking(bookingId: number): Promise<PetVital[]> {
    return await db.select().from(petVitals).where(eq(petVitals.bookingId, bookingId));
  }

  async updatePetVital(id: number, vital: Partial<InsertPetVital>): Promise<PetVital> {
    const [updatedVital] = await db
      .update(petVitals)
      .set(vital)
      .where(eq(petVitals.id, id))
      .returning();
    return updatedVital;
  }

  // Pet attachments operations
  async createPetAttachment(attachment: InsertPetAttachment): Promise<PetAttachment> {
    const [newAttachment] = await db.insert(petAttachments).values(attachment).returning();
    return newAttachment;
  }

  async getPetAttachmentsByBooking(bookingId: number): Promise<PetAttachment[]> {
    return await db.select().from(petAttachments).where(eq(petAttachments.bookingId, bookingId));
  }

  async getPetAttachmentsByPet(petId: number, bookingId: number): Promise<PetAttachment[]> {
    return await db.select().from(petAttachments).where(
      and(
        eq(petAttachments.petId, petId),
        eq(petAttachments.bookingId, bookingId)
      )
    );
  }

  async deletePetAttachment(id: number, uploadedBy: string): Promise<boolean> {
    const result = await db.delete(petAttachments).where(
      and(
        eq(petAttachments.id, id),
        eq(petAttachments.uploadedBy, uploadedBy)
      )
    );
    return true;
  }

  // Invoice Items operations
  async saveInvoiceItems(bookingId: number, items: any[]): Promise<InvoiceItem[]> {
    // Delete existing items
    await db.delete(invoiceItems).where(eq(invoiceItems.bookingId, bookingId));
    
    // Insert new items
    const savedItems = [];
    for (const item of items) {
      const [savedItem] = await db.insert(invoiceItems).values({
        bookingId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        discount: item.discount ? item.discount.toString() : "0",
        discountType: item.discountType || 'none',
        vatRate: item.vatRate ? item.vatRate.toString() : "15.00",
        vatAmount: item.vatAmount ? item.vatAmount.toString() : "0",
        totalBeforeVat: item.totalBeforeVat ? item.totalBeforeVat.toString() : "0",
        totalAfterVat: item.totalAfterVat ? item.totalAfterVat.toString() : "0",
        total: item.total.toString()
      }).returning();
      savedItems.push(savedItem);
    }
    
    return savedItems;
  }

  async getInvoiceItems(bookingId: number): Promise<InvoiceItem[]> {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.bookingId, bookingId));
    
    // Convert database fields to frontend format
    return items.map(item => ({
      id: item.id,
      bookingId: item.bookingId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      discountType: item.discountType,
      vatRate: item.vatRate,
      vatAmount: item.vatAmount,
      totalBeforeVat: item.totalBeforeVat,
      totalAfterVat: item.totalAfterVat,
      total: item.total,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  }

  async deleteInvoiceItems(bookingId: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.bookingId, bookingId));
  }

  // Invoice Status operations
  async saveInvoiceStatus(status: InsertInvoiceStatus): Promise<InvoiceStatus> {
    const [newStatus] = await db.insert(invoiceStatus).values(status).returning();
    return newStatus;
  }

  async getInvoiceStatus(bookingId: number): Promise<InvoiceStatus | undefined> {
    const [status] = await db.select().from(invoiceStatus).where(eq(invoiceStatus.bookingId, bookingId));
    return status;
  }

  async updateInvoiceStatus(bookingId: number, data: Partial<InvoiceStatus>): Promise<InvoiceStatus | undefined> {
    const [updatedStatus] = await db
      .update(invoiceStatus)
      .set(data)
      .where(eq(invoiceStatus.bookingId, bookingId))
      .returning();
    return updatedStatus;
  }

  // Products operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    // Check import data lock before deletion
    try {
      const { importDataLock } = await import('./importDataLock');
      const canDelete = await importDataLock.preventDataDeletion();
      
      if (!canDelete) {
        throw new Error("Cannot delete imported data - Data is permanently locked");
      }
    } catch (error) {
      console.log("🔒 Import data protected from deletion");
      throw new Error("Cannot delete imported products - Data is protected");
    }
    
    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
  }

  // Services operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    // Check import data lock before deletion
    try {
      const { importDataLock } = await import('./importDataLock');
      const canDelete = await importDataLock.preventDataDeletion();
      
      if (!canDelete) {
        throw new Error("Cannot delete imported data - Data is permanently locked");
      }
    } catch (error) {
      console.log("🔒 Import data protected from deletion");
      throw new Error("Cannot delete imported services - Data is protected");
    }
    
    await db
      .update(services)
      .set({ isActive: false })
      .where(eq(services.id, id));
  }

  // Import History operations
  async createImportHistory(importData: InsertImportHistory): Promise<ImportHistory> {
    const [newImportHistory] = await db
      .insert(importHistory)
      .values({
        ...importData,
        importedAt: new Date()
      })
      .returning();
    return newImportHistory;
  }

  async getImportHistory(): Promise<ImportHistory[]> {
    return await db
      .select()
      .from(importHistory)
      .orderBy(desc(importHistory.importedAt));
  }

  // Bulk import operations
  async bulkCreateServices(serviceList: any[]): Promise<{ imported: number; updated: number; failed: number }> {
    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const service of serviceList) {
      try {
        // Check if service exists by name
        const [existingService] = await db.select().from(services).where(eq(services.name, service.name));
        
        if (existingService) {
          // Update existing service
          await db.update(services).set(service).where(eq(services.name, service.name));
          updated++;
        } else {
          // Create new service
          await db.insert(services).values(service);
          imported++;
        }
      } catch (error) {
        console.error('Error importing service:', error);
        failed++;
      }
    }

    // Trigger import data lock after bulk operation
    if (imported > 0 || updated > 0) {
      try {
        const { importDataLock } = await import('./importDataLock');
        await importDataLock.lockImportedData();
        console.log(`🔒 Import data permanently locked: ${imported} new, ${updated} updated services`);
      } catch (error) {
        console.error('⚠️ Import data lock failed:', error);
      }
    }

    return { imported, updated, failed };
  }

  async bulkCreateProducts(productList: any[]): Promise<{ imported: number; updated: number; failed: number }> {
    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const product of productList) {
      try {
        // Check if product exists by name
        const [existingProduct] = await db.select().from(products).where(eq(products.name, product.name));
        
        if (existingProduct) {
          // Update existing product
          await db.update(products).set(product).where(eq(products.name, product.name));
          updated++;
        } else {
          // Create new product
          await db.insert(products).values(product);
          imported++;
        }
      } catch (error) {
        console.error('Error importing product:', error);
        failed++;
      }
    }

    // Trigger import data lock after bulk operation
    if (imported > 0 || updated > 0) {
      try {
        const { importDataLock } = await import('./importDataLock');
        await importDataLock.lockImportedData();
        console.log(`🔒 Import data permanently locked: ${imported} new, ${updated} updated products`);
      } catch (error) {
        console.error('⚠️ Import data lock failed:', error);
      }
    }

    return { imported, updated, failed };
  }

  // OTP Verification operations
  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    const [newOtp] = await db
      .insert(otpVerifications)
      .values(otp)
      .returning();
    return newOtp;
  }

  async getOtpVerification(email: string, code: string): Promise<OtpVerification | undefined> {
    const [otp] = await db
      .select()
      .from(otpVerifications)
      .where(and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.code, code)
      ));
    return otp;
  }

  async deleteOtpVerification(email: string): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(eq(otpVerifications.email, email));
  }

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    await db
      .delete(otpVerifications)
      .where(lt(otpVerifications.expiresAt, now));
  }

  // Tracking notification operations
  async createTrackingNotification(notification: any): Promise<any> {
    // For now, we'll store tracking notifications in memory
    // In a real app, you might want to create a tracking_notifications table
    console.log('📧 Tracking notification created:', notification);
    return notification;
  }

  async getBookingById(bookingId: number): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    return booking;
  }

  // Generated Invoices operations
  async createGeneratedInvoice(invoice: InsertGeneratedInvoice): Promise<GeneratedInvoice> {
    const [newInvoice] = await db
      .insert(generatedInvoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getAllGeneratedInvoices(): Promise<GeneratedInvoice[]> {
    return await db
      .select()
      .from(generatedInvoices)
      .orderBy(desc(generatedInvoices.generatedAt));
  }

  async getGeneratedInvoice(id: number): Promise<GeneratedInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(generatedInvoices)
      .where(eq(generatedInvoices.id, id));
    return invoice;
  }

  async getGeneratedInvoiceByNumber(invoiceNumber: string): Promise<GeneratedInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(generatedInvoices)
      .where(eq(generatedInvoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getGeneratedInvoiceByBooking(bookingId: number): Promise<GeneratedInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(generatedInvoices)
      .where(eq(generatedInvoices.bookingId, bookingId));
    return invoice;
  }

  async getNextInvoiceNumber(): Promise<string> {
    // Get the latest invoice number
    const [latestInvoice] = await db
      .select()
      .from(generatedInvoices)
      .orderBy(desc(generatedInvoices.id))
      .limit(1);

    if (!latestInvoice) {
      return "Vets9000001"; // First invoice
    }

    // Extract number from "Vets9000001" format
    const currentNumber = parseInt(latestInvoice.invoiceNumber.replace('Vets', ''));
    const nextNumber = currentNumber + 1;
    
    // Format with leading zeros to maintain "Vets9000001" format
    return `Vets${nextNumber.toString().padStart(7, '0')}`;
  }

  async updateInvoiceEmailStatus(id: number, isEmailSent: boolean): Promise<void> {
    await db
      .update(generatedInvoices)
      .set({ 
        isEmailSent, 
        emailSentAt: isEmailSent ? new Date() : null 
      })
      .where(eq(generatedInvoices.id, id));
  }
}

export const storage = new DatabaseStorage();