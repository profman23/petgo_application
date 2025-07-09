import { users, drivers, rides, patients, admins, shifts, bookings, reviews, petVitals, petAttachments, invoiceItems, invoiceStatus, products, services, importHistory, type User, type Driver, type Ride, type InsertUser, type RideRequest, type Patient, type InsertPatient, type Admin, type InsertDriver, type Shift, type InsertShift, type Booking, type InsertBooking, type Review, type InsertReview, type PetVital, type InsertPetVital, type PetAttachment, type InsertPetAttachment, type InvoiceItem, type InsertInvoiceItem, type InvoiceStatus, type InsertInvoiceStatus, type Product, type InsertProduct, type Service, type InsertService, type ImportHistory, type InsertImportHistory } from "@shared/schema";
import { db } from "./db";
import { eq, and, not, inArray, desc } from "drizzle-orm";

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
  updateDriverLocation(id: number, latitude: number, longitude: number): Promise<void>;
  updateDriverAvailability(id: number, isAvailable: boolean): Promise<void>;
  
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
  // Payment update methods removed per user request

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
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeTestData();
  }

  private async initializeTestData() {
    try {
      // Check if test users exist
      const existingUser = await this.getUserByPhone('0501234567');
      if (!existingUser) {
        await this.createUser({
          name: 'عميل تجريبي',
          phone: '0501234567',
          password: '123456',
          petName: 'فلافي',
          petType: 'قطة',
          address: 'الرياض',
          membershipType: 'premium'
        });
      }

      const existingDoctor = await this.getUserByPhone('vetsvan1');
      if (!existingDoctor) {
        await this.createUser({
          name: 'د. أحمد محمد',
          phone: 'vetsvan1',
          password: '123456',
          petName: '',
          petType: '',
          address: 'الرياض',
          membershipType: 'doctor'
        });
      }

      const existingDoctor2 = await this.getUserByPhone('vetsvan2');
      if (!existingDoctor2) {
        await this.createUser({
          name: 'د. سارة علي',
          phone: 'vetsvan2',
          password: '123456',
          petName: '',
          petType: '',
          address: 'الرياض',
          membershipType: 'doctor'
        });
      }

      // Initialize admin user
      await this.initializeAdmin();
      
      // Initialize drivers
      await this.initializeDrivers();
      
      // Initialize test shifts
      await this.initializeTestShifts();
      
      // Initialize sample products and services
      await this.initializeSampleData();
    } catch (error) {
      console.error('Error initializing test data:', error);
    }
  }

  private async initializeAdmin() {
    try {
      const existingAdmin = await this.getAdminByUsername('admin');
      if (!existingAdmin) {
        await db.insert(admins).values({
          username: 'admin',
          password: 'admin123',
          name: 'System Administrator',
          role: 'admin'
        }).onConflictDoNothing();
      }
    } catch (error) {
      console.error('Error initializing admin:', error);
    }
  }

  private async initializeDrivers() {
    try {
      const existingDrivers = await this.getAllDrivers();
      if (existingDrivers.length === 0) {
        const driversData = [
          {
            vetsvanCode: 'V001',
            vetsvanName: 'VETS VAN 1',
            name: 'د. محمد العلي',
            phone: '0551234567',
            username: 'vetsvan1',
            password: '123456',
            latitude: 24.7136,
            longitude: 46.6753,
            rating: 4.8,
            carModel: 'عيادة متنقلة',
            carColor: 'أبيض',
            plateNumber: 'VET-001',
            isAvailable: true
          },
          {
            vetsvanCode: 'V002',
            vetsvanName: 'VETS VAN 2',
            name: 'د. فاطمة أحمد',
            phone: '0561234567',
            username: 'vetsvan2',
            password: '123456',
            latitude: 24.7180,
            longitude: 46.6850,
            rating: 4.9,
            carModel: 'عيادة متنقلة',
            carColor: 'أزرق',
            plateNumber: 'VET-002',
            isAvailable: true
          }
        ];

        for (const driver of driversData) {
          await db.insert(drivers).values(driver).onConflictDoNothing();
        }
      }
    } catch (error) {
      console.error('Error initializing drivers:', error);
    }
  }

  private async initializeSampleData() {
    try {
      // Initialize sample products
      const existingProducts = await this.getProducts();
      if (existingProducts.length === 0) {
        const sampleProducts = [
          {
            name: 'Premium Cat Food',
            nameAr: 'طعام قطط فاخر',
            description: 'High-quality dry food for adult cats',
            descriptionAr: 'طعام جاف عالي الجودة للقطط البالغة',
            price: 45.00,
            category: 'Pet Food',
            categoryAr: 'طعام الحيوانات',
            isActive: true
          },
          {
            name: 'Dog Vitamins',
            nameAr: 'فيتامينات الكلاب',
            description: 'Essential vitamins for healthy dogs',
            descriptionAr: 'فيتامينات أساسية للكلاب الصحية',
            price: 35.00,
            category: 'Supplements',
            categoryAr: 'مكملات غذائية',
            isActive: true
          }
        ];
        
        for (const product of sampleProducts) {
          await this.createProduct(product);
        }
      }

      // Initialize sample services
      const existingServices = await this.getServices();
      if (existingServices.length === 0) {
        const sampleServices = [
          {
            name: 'Complete Health Checkup',
            nameAr: 'فحص صحي شامل',
            description: 'Comprehensive health examination for pets',
            descriptionAr: 'فحص صحي شامل للحيوانات الأليفة',
            price: 150.00,
            category: 'Health Services',
            categoryAr: 'خدمات صحية',
            duration: 60,
            isActive: true
          },
          {
            name: 'Vaccination Service',
            nameAr: 'خدمة التطعيم',
            description: 'Essential vaccinations for pets',
            descriptionAr: 'التطعيمات الأساسية للحيوانات الأليفة',
            price: 80.00,
            category: 'Prevention',
            categoryAr: 'الوقاية',
            duration: 30,
            isActive: true
          }
        ];
        
        for (const service of sampleServices) {
          await this.createService(service);
        }
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  private async initializeTestShifts() {
    try {
      const existingShifts = await this.getAllShifts();
      if (existingShifts.length === 0) {
        // Get all VetsVan to create shifts for them
        const allVetsVan = await this.getAllDrivers();
        
        for (const vetsvan of allVetsVan) {
          // Create shifts for next 7 days
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];
            
            // Create morning shift (9 AM - 1 PM)
            await db.insert(shifts).values({
              vetsVanId: vetsvan.id,
              date: dateStr,
              startTime: '09:00',
              endTime: '13:00',
              duration: 4,
              status: 'scheduled'
            }).onConflictDoNothing();
            
            // Create afternoon shift (2 PM - 6 PM)
            await db.insert(shifts).values({
              vetsVanId: vetsvan.id,
              date: dateStr,
              startTime: '14:00',
              endTime: '18:00',
              duration: 4,
              status: 'scheduled'
            }).onConflictDoNothing();
            
            // Create evening shift (7 PM - 8 PM)
            await db.insert(shifts).values({
              vetsVanId: vetsvan.id,
              date: dateStr,
              startTime: '19:00',
              endTime: '20:00',
              duration: 1,
              status: 'scheduled'
            }).onConflictDoNothing();
          }
        }
        
        console.log('Test shifts initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing test shifts:', error);
    }
  }

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
    // Try to find user by phone first
    let user = await this.getUserByPhone(identifier);
    if (user) return user;
    
    // If not found by phone, try by email
    user = await this.getUserByEmail(identifier);
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    // التأكد من وجود name إذا لم يكن موجود
    const userData = {
      ...insertUser,
      name: insertUser.name || `${insertUser.firstName} ${insertUser.lastName}`
    };
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

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

  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<void> {
    await db
      .update(drivers)
      .set({ latitude, longitude })
      .where(eq(drivers.id, id));
  }

  async updateDriverAvailability(id: number, isAvailable: boolean): Promise<void> {
    await db
      .update(drivers)
      .set({ isAvailable })
      .where(eq(drivers.id, id));
  }

  async createRide(rideData: RideRequest): Promise<Ride> {
    const [ride] = await db
      .insert(rides)
      .values(rideData)
      .returning();
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
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(rides.id, id));
  }

  async assignDriverToRide(rideId: number, driverId: number): Promise<void> {
    await db
      .update(rides)
      .set({ 
        driverId, 
        status: 'confirmed',
        updatedAt: new Date() 
      })
      .where(eq(rides.id, rideId));
  }

  async getUserActiveRide(userId: number): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(
        and(
          eq(rides.customerId, userId),
          not(inArray(rides.status, ['completed', 'cancelled', 'cancelled_by_doctor', 'rejected']))
        )
      )
      .orderBy(desc(rides.createdAt))
      .limit(1);
    
    return ride || undefined;
  }

  async getDriverActiveRide(driverId: number): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(
        and(
          eq(rides.driverId, driverId),
          not(inArray(rides.status, ['completed', 'cancelled', 'cancelled_by_doctor', 'rejected']))
        )
      )
      .orderBy(desc(rides.createdAt))
      .limit(1);
    
    return ride || undefined;
  }

  // Patient operations
  async getUserPatients(userId: number): Promise<Patient[]> {
    const userPatients = await db.select().from(patients).where(eq(patients.userId, userId));
    return userPatients;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values({
        name: insertPatient.name,
        type: insertPatient.type,
        userId: insertPatient.userId,
        ageYear: insertPatient.ageYear || null,
        ageMonth: insertPatient.ageMonth || null,
        ageDay: insertPatient.ageDay || null,
        photo: insertPatient.photo || null,
      })
      .returning();
    return patient;
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

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db
      .insert(drivers)
      .values(driverData)
      .returning();
    
    // إنشاء حساب طبيب تلقائياً عند إنشاء VetsVan جديدة
    // Username = VetsVan Code, Password = 123456 (افتراضي)
    const doctorUserData = {
      firstName: driverData.vetsvanName || "VetsVan",
      lastName: "Doctor",
      phone: driverData.vetsvanCode, // استخدام VetsVan Code كـ phone/username
      password: "123456", // كلمة مرور افتراضية
      membershipType: "doctor" as const,
      petName: "VetsVan",
      petType: "cat" as const
    };
    
    try {
      await this.createUser(doctorUserData);
      console.log(`Doctor account created for VetsVan: ${driverData.vetsvanCode}`);
    } catch (error) {
      console.log(`Failed to create doctor account for ${driverData.vetsvanCode}:`, error);
      // لا نوقف العملية حتى لو فشل إنشاء حساب الطبيب
    }
    
    return driver;
  }

  async deleteDriver(id: number): Promise<void> {
    // First get driver details to find associated doctor account in users table
    const driver = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    
    if (driver.length > 0) {
      const driverData = driver[0];
      // Delete associated doctor user account using vetsvanCode as phone (login identifier)
      await db.delete(users).where(eq(users.phone, driverData.vetsvanCode));
    }
    
    // Delete the driver record
    await db.delete(drivers).where(eq(drivers.id, id));
  }

  // Shifts operations
  async getAllShifts(): Promise<Shift[]> {
    return await db.select().from(shifts);
  }

  async createShift(shiftData: InsertShift): Promise<Shift> {
    const [shift] = await db
      .insert(shifts)
      .values(shiftData)
      .returning();
    return shift;
  }

  async deleteShift(id: number): Promise<void> {
    await db
      .delete(shifts)
      .where(eq(shifts.id, id));
  }

  // Bookings operations
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
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
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();
    return updatedBooking;
  }

  async getBookingWithUserDetails(bookingId: number): Promise<Booking & { user: User } | undefined> {
    const result = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      shiftId: bookings.shiftId,
      vetsVanId: bookings.vetsVanId,
      appointmentDate: bookings.appointmentDate,
      appointmentTime: bookings.appointmentTime,
      status: bookings.status,
      customerLocation: bookings.customerLocation,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      user: users
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
    
    return result[0] || undefined;
  }

  async getBookingWithDetails(bookingId: number): Promise<any> {
    // Get booking with customer details
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!booking) return undefined;

    console.log('🔍 getBookingWithDetails - booking data:', booking);
    console.log('🐾 selectedPets from booking:', booking.selectedPets);

    // Get customer details
    const [customer] = await db.select().from(users).where(eq(users.id, booking.userId));
    if (!customer) return undefined;

    // Get VetsVan details  
    const [vetsVan] = await db.select().from(drivers).where(eq(drivers.id, booking.vetsVanId));

    // Use selected pets from booking instead of all customer pets
    const selectedPetsData = booking.selectedPets || [];
    console.log('🐾 selectedPetsData used:', selectedPetsData);

    return {
      id: booking.id,
      customer: {
        firstName: customer.firstName || customer.name?.split(' ')[0] || '',
        lastName: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
        phone: customer.phone,
        email: customer.email,
      },
      pets: selectedPetsData.map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        type: pet.type,
        ageYear: pet.ageYear || 0,
        ageMonth: pet.ageMonth || 0,
        ageDay: pet.ageDay || 0,
      })),
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      serviceType: booking.serviceType || 'General Check Up',
      location: booking.customerLocation,
      status: booking.status,
      vetsVanId: booking.vetsVanId,
      vetsVanCode: vetsVan?.vetsvanCode || '',
      vetsVanName: vetsVan?.vetsvanName || '',
    };
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async getBookingReview(bookingId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId));
    return review;
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }

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
    const allBookings = await db.select().from(bookings);
    const detailedRequests = [];
    
    for (const booking of allBookings) {
      // Get user details
      const [user] = await db.select().from(users).where(eq(users.id, booking.userId));
      if (!user) continue;
      
      // Get shift details to get VetsVan info
      const [shift] = await db.select().from(shifts).where(eq(shifts.id, booking.shiftId));
      if (!shift) continue;
      
      // Get driver details
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, shift.vetsVanId));
      if (!driver) continue;
      
      // Parse pets data
      let pets = [];
      try {
        pets = typeof booking.pets === 'string' ? JSON.parse(booking.pets) : (booking.pets || []);
      } catch (e) {
        pets = [];
      }

      // Parse location data
      let location = null;
      try {
        location = typeof booking.customerLocation === 'string' ? JSON.parse(booking.customerLocation) : booking.customerLocation;
      } catch (e) {
        location = null;
      }
      
      detailedRequests.push({
        id: booking.id,
        customerName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Customer',
        customerPhone: user.phone || 'N/A',
        customerEmail: user.email || 'N/A',
        vetsvanCode: driver.vetsvanCode || 'N/A',
        vetsvanName: driver.vetsvanName || driver.name || 'N/A',
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status,
        location: location,
        pets: pets,
        serviceType: booking.serviceType || 'general_checkup',
        createdAt: booking.createdAt.toISOString(),
      });
    }
    
    return detailedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReportsStats(): Promise<{
    totalBookings: number;
    completedBookings: number;
    averageRating: number;
    totalReviews: number;
    totalVetsVans: number;
    availableVetsVans: number;
  }> {
    // Get all bookings
    const allBookings = await db.select().from(bookings);
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    
    // Get all reviews
    const allReviews = await db.select().from(reviews);
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;
    
    // Get all drivers (VetsVans)
    const allDrivers = await db.select().from(drivers);
    const availableDrivers = allDrivers.filter(d => d.isAvailable);
    
    return {
      totalBookings: allBookings.length,
      completedBookings: completedBookings.length,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: allReviews.length,
      totalVetsVans: allDrivers.length,
      availableVetsVans: availableDrivers.length,
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
    // Get all reviews with booking details
    const allReviews = await db.select().from(reviews);
    const detailedReviews = [];
    
    for (const review of allReviews) {
      // Get booking details
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, review.bookingId));
      if (!booking) continue;
      
      // Get user details
      const [user] = await db.select().from(users).where(eq(users.id, review.userId));
      if (!user) continue;
      
      // Get shift details to get VetsVan info
      const [shift] = await db.select().from(shifts).where(eq(shifts.id, booking.shiftId));
      if (!shift) continue;
      
      // Get driver details
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, shift.vetsVanId));
      if (!driver) continue;
      
      detailedReviews.push({
        id: review.id,
        rating: review.rating,
        comment: review.comment || '',
        createdAt: review.createdAt.toISOString(),
        userName: user.name || `${user.firstName} ${user.lastName}`,
        userPhone: user.phone || '',
        vetsvanName: driver.vetsvanName || driver.name,
        vetsvanCode: driver.vetsvanCode || '',
      });
    }
    
    return detailedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pet vitals operations
  async createPetVital(vital: InsertPetVital): Promise<PetVital> {
    console.log('DatabaseStorage createPetVital called with:', vital);
    const [newVital] = await db
      .insert(petVitals)
      .values(vital)
      .returning();
    return newVital;
  }

  async getPetVitalsByBooking(bookingId: number): Promise<PetVital[]> {
    return await db
      .select()
      .from(petVitals)
      .where(eq(petVitals.bookingId, bookingId));
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
    const [newAttachment] = await db
      .insert(petAttachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async getPetAttachmentsByBooking(bookingId: number): Promise<PetAttachment[]> {
    return await db
      .select()
      .from(petAttachments)
      .where(eq(petAttachments.bookingId, bookingId));
  }

  async getPetAttachmentsByPet(petId: number, bookingId: number): Promise<PetAttachment[]> {
    try {
      console.log(`DatabaseStorage: Getting attachments for petId=${petId}, bookingId=${bookingId}`);
      const result = await db
        .select()
        .from(petAttachments)
        .where(and(eq(petAttachments.petId, petId), eq(petAttachments.bookingId, bookingId)));
      console.log(`DatabaseStorage: Found ${result.length} attachments`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage: Error in getPetAttachmentsByPet:', error);
      return [];
    }
  }

  async deletePetAttachment(id: number, uploadedBy: string): Promise<boolean> {
    const result = await db
      .delete(petAttachments)
      .where(and(eq(petAttachments.id, id), eq(petAttachments.uploadedBy, uploadedBy)))
      .returning();
    return result.length > 0;
  }

  // Invoice Items operations (DatabaseStorage implementation)
  async saveInvoiceItems(bookingId: number, items: any[]): Promise<InvoiceItem[]> {
    // First, delete existing items for this booking
    await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.bookingId, bookingId));

    // Then insert new items
    const savedItems: InvoiceItem[] = [];
    for (const item of items) {
      const [savedItem] = await db
        .insert(invoiceItems)
        .values({
          bookingId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          total: item.total.toString()
        })
        .returning();
      savedItems.push(savedItem);
    }
    return savedItems;
  }

  async getInvoiceItems(bookingId: number): Promise<InvoiceItem[]> {
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.bookingId, bookingId));
    
    // Convert decimal fields to numbers for frontend compatibility
    return items.map(item => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString()
    }));
  }

  async deleteInvoiceItems(bookingId: number): Promise<void> {
    await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.bookingId, bookingId));
  }

  // Invoice Status operations (DatabaseStorage implementation)
  async saveInvoiceStatus(status: InsertInvoiceStatus): Promise<InvoiceStatus> {
    const [savedStatus] = await db
      .insert(invoiceStatus)
      .values({
        ...status,
        subtotal: status.subtotal.toString(),
        taxAmount: status.taxAmount.toString(),
        discountAmount: status.discountAmount.toString(),
        finalTotal: status.finalTotal.toString(),
        isGenerated: true,
        generatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: invoiceStatus.bookingId,
        set: {
          isGenerated: true,
          generatedAt: new Date(),
          generatedBy: status.generatedBy,
          notes: status.notes,
          subtotal: status.subtotal.toString(),
          taxAmount: status.taxAmount.toString(),
          discountAmount: status.discountAmount.toString(),
          finalTotal: status.finalTotal.toString(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return savedStatus;
  }

  async getInvoiceStatus(bookingId: number): Promise<InvoiceStatus | undefined> {
    const [status] = await db
      .select()
      .from(invoiceStatus)
      .where(eq(invoiceStatus.bookingId, bookingId));
    return status;
  }

  async updateInvoiceStatus(bookingId: number, data: Partial<InvoiceStatus>): Promise<InvoiceStatus | undefined> {
    const [updatedStatus] = await db
      .update(invoiceStatus)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoiceStatus.bookingId, bookingId))
      .returning();
    return updatedStatus;
  }

  // Products and Services for import system
  async getProducts(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(products.name);
      return result;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async getServices(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(services)
        .where(eq(services.isActive, true))
        .orderBy(services.name);
      return result;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async createProduct(product: any): Promise<any> {
    try {
      const [newProduct] = await db
        .insert(products)
        .values(product)
        .returning();
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async createService(service: any): Promise<any> {
    try {
      const [newService] = await db
        .insert(services)
        .values(service)
        .returning();
      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateProduct(id: number, product: any): Promise<any> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({ ...product, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async updateService(id: number, service: any): Promise<any> {
    try {
      const [updatedService] = await db
        .update(services)
        .set({ ...service, updatedAt: new Date() })
        .where(eq(services.id, id))
        .returning();
      return updatedService;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      await db
        .update(products)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(products.id, id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async deleteService(id: number): Promise<void> {
    try {
      await db
        .update(services)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(services.id, id));
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // Import history
  async getImportHistory(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(importHistory)
        .orderBy(desc(importHistory.importedAt));
      return result;
    } catch (error) {
      console.error('Error fetching import history:', error);
      return [];
    }
  }

  async createImportHistory(importData: any): Promise<any> {
    try {
      const [newImportHistory] = await db
        .insert(importHistory)
        .values(importData)
        .returning();
      return newImportHistory;
    } catch (error) {
      console.error('Error creating import history:', error);
      throw error;
    }
  }

  // Payment update method removed per user request
}

// Temporary fallback to MemStorage due to database connection issues
class MemStorage implements IStorage {
  private users: Map<number, User>;
  private drivers: Map<number, Driver>;
  private rides: Map<number, Ride>;
  private patients: Map<number, Patient>;
  private admins: Map<number, Admin>;
  private shifts: Map<number, Shift>;
  private bookings: Map<number, Booking>;
  private reviews: Map<number, Review>;
  private petVitals: Map<number, PetVital>;
  private petAttachments: Map<number, PetAttachment>;
  private products: Map<number, any>;
  private services: Map<number, any>;
  private importHistory: Map<number, any>;
  private currentUserId: number;
  private currentDriverId: number;
  private currentRideId: number;
  private currentPatientId: number;
  private currentAdminId: number;
  private currentShiftId: number;
  private currentBookingId: number;
  private currentReviewId: number;
  private currentPetVitalId: number;
  private currentPetAttachmentId: number;
  private currentProductId: number;
  private currentServiceId: number;
  private currentImportHistoryId: number;
  private invoiceItems: Map<number, InvoiceItem>;
  private invoiceStatuses: Map<number, InvoiceStatus>;
  private currentInvoiceItemId: number;
  private currentInvoiceStatusId: number;

  constructor() {
    this.users = new Map();
    this.drivers = new Map();
    this.rides = new Map();
    this.patients = new Map();
    this.admins = new Map();
    this.shifts = new Map();
    this.bookings = new Map();
    this.reviews = new Map();
    this.petVitals = new Map();
    this.petAttachments = new Map();
    this.products = new Map();
    this.services = new Map();
    this.importHistory = new Map();
    this.currentUserId = 1;
    this.currentDriverId = 1;
    this.currentRideId = 1;
    this.currentPatientId = 1;
    this.currentAdminId = 1;
    this.currentShiftId = 1;
    this.currentBookingId = 1;
    this.currentReviewId = 1;
    this.currentPetVitalId = 1;
    this.currentPetAttachmentId = 1;
    this.currentProductId = 1;
    this.currentServiceId = 1;
    this.currentImportHistoryId = 1;
    this.invoiceItems = new Map();
    this.invoiceStatuses = new Map();
    this.currentInvoiceItemId = 1;
    this.currentInvoiceStatusId = 1;

    this.initializeTestData();
  }

  private initializeTestData() {
    // Test users
    this.createUser({
      name: 'عميل تجريبي',
      phone: '0501234567',
      password: '123456',
      petName: 'فلافي',
      petType: 'قطة',
      address: 'الرياض',
      membershipType: 'premium'
    });

    // Test admins
    const admin: Admin = {
      id: this.currentAdminId++,
      username: 'admin',
      password: '123456',
      name: 'مدير النظام',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.admins.set(admin.id, admin);

    // Test drivers
    const driver1: Driver = {
      id: this.currentDriverId++,
      vetsvanCode: 'V001',
      vetsvanName: 'VETS VAN 1',
      name: 'د. محمد العلي',
      phone: '0551234567',
      username: 'v001',
      password: '123456',
      latitude: 24.7136,
      longitude: 46.6753,
      isAvailable: true,
      rating: 4.8,
      carModel: 'Mercedes Sprinter',
      carColor: 'أبيض',
      plateNumber: 'VET-001',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.drivers.set(driver1.id, driver1);

    const driver2: Driver = {
      id: this.currentDriverId++,
      vetsvanCode: 'V003',
      vetsvanName: 'VETS003',
      name: 'د. سارة أحمد',
      phone: '0551234568',
      username: 'v003',
      password: '123456',
      latitude: 24.7436,
      longitude: 46.6853,
      isAvailable: true,
      rating: 4.9,
      carModel: 'عيادة متنقلة',
      carColor: 'أزرق',
      plateNumber: 'VET-002',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.drivers.set(driver2.id, driver2);

    // Create shifts for both VetsVans
    for (const driver of [driver1, driver2]) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        
        const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        times.forEach(time => {
          const shift: Shift = {
            id: this.currentShiftId++,
            vetsVanId: driver.id,
            appointmentDate: dateStr,
            appointmentTime: time,
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          this.shifts.set(shift.id, shift);
        });
      }
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    let user = await this.getUserByPhone(identifier);
    if (user) return user;
    user = await this.getUserByEmail(identifier);
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    const user: User = { 
      id: this.currentUserId++,
      name: insertUser.name,
      phone: insertUser.phone,
      email: insertUser.email,
      password: insertUser.password,
      petName: insertUser.petName,
      petType: insertUser.petType,
      address: insertUser.address,
      membershipType: insertUser.membershipType || 'basic',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    return this.updateUser(id, { password: newPassword });
  }

  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter(driver => driver.isAvailable);
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getDriverByUsername(username: string): Promise<Driver | undefined> {
    return Array.from(this.drivers.values()).find(driver => driver.username === username);
  }

  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<void> {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.latitude = latitude;
      driver.longitude = longitude;
      driver.updatedAt = new Date();
      this.drivers.set(id, driver);
    }
  }

  async updateDriverAvailability(id: number, isAvailable: boolean): Promise<void> {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.isAvailable = isAvailable;
      driver.updatedAt = new Date();
      this.drivers.set(id, driver);
    }
  }

  async createRide(rideData: RideRequest): Promise<Ride> {
    const ride: Ride = {
      id: this.currentRideId++,
      userId: rideData.userId,
      pickupLat: rideData.pickupLat,
      pickupLng: rideData.pickupLng,
      dropoffLat: rideData.dropoffLat || rideData.pickupLat,
      dropoffLng: rideData.dropoffLng || rideData.pickupLng,
      pickupAddress: rideData.pickupAddress,
      dropoffAddress: rideData.dropoffAddress || rideData.pickupAddress,
      status: 'requested',
      estimatedTime: 10,
      estimatedCost: 25,
      driverId: rideData.driverId,
      selectedPetIds: rideData.selectedPetIds,
      serviceType: rideData.serviceType,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rides.set(ride.id, ride);
    return ride;
  }

  async getRide(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getAllRides(): Promise<Ride[]> {
    return Array.from(this.rides.values());
  }

  async updateRideStatus(id: number, status: string): Promise<void> {
    const ride = this.rides.get(id);
    if (ride) {
      ride.status = status;
      ride.updatedAt = new Date();
      this.rides.set(id, ride);
    }
  }

  async assignDriverToRide(rideId: number, driverId: number): Promise<void> {
    const ride = this.rides.get(rideId);
    if (ride) {
      ride.driverId = driverId;
      ride.updatedAt = new Date();
      this.rides.set(rideId, ride);
    }
  }

  async getUserActiveRide(userId: number): Promise<Ride | undefined> {
    return Array.from(this.rides.values()).find(
      ride => ride.userId === userId && !['completed', 'cancelled'].includes(ride.status)
    );
  }

  async getDriverActiveRide(driverId: number): Promise<Ride | undefined> {
    return Array.from(this.rides.values()).find(
      ride => ride.driverId === driverId && !['completed', 'cancelled'].includes(ride.status)
    );
  }

  async getUserPatients(userId: number): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.userId === userId);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const patient: Patient = {
      id: this.currentPatientId++,
      userId: insertPatient.userId,
      name: insertPatient.name,
      type: insertPatient.type,
      ageYear: insertPatient.ageYear,
      ageMonth: insertPatient.ageMonth,
      ageDay: insertPatient.ageDay,
      photo: insertPatient.photo,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.patients.set(patient.id, patient);
    return patient;
  }

  async updatePatient(patientId: number, userId: number, updateData: Partial<Patient>): Promise<Patient | undefined> {
    const patient = this.patients.get(patientId);
    if (!patient || patient.userId !== userId) return undefined;
    
    const updatedPatient = { ...patient, ...updateData, updatedAt: new Date() };
    this.patients.set(patientId, updatedPatient);
    return updatedPatient;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.username === username);
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const driver: Driver = {
      id: this.currentDriverId++,
      vetsvanCode: driverData.vetsvanCode,
      vetsvanName: driverData.vetsvanName,
      name: driverData.name,
      phone: driverData.phone,
      username: driverData.username,
      password: driverData.password,
      latitude: driverData.latitude || 24.7136,
      longitude: driverData.longitude || 46.6753,
      isAvailable: true,
      rating: 4.5,
      carModel: driverData.carModel,
      carColor: driverData.carColor,
      plateNumber: driverData.plateNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.drivers.set(driver.id, driver);
    return driver;
  }

  async deleteDriver(id: number): Promise<void> {
    this.drivers.delete(id);
  }

  async getAllShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values());
  }

  async createShift(shiftData: InsertShift): Promise<Shift> {
    const shift: Shift = {
      id: this.currentShiftId++,
      vetsVanId: shiftData.vetsVanId,
      appointmentDate: shiftData.appointmentDate,
      appointmentTime: shiftData.appointmentTime,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.shifts.set(shift.id, shift);
    return shift;
  }

  async deleteShift(id: number): Promise<void> {
    this.shifts.delete(id);
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      id: this.currentBookingId++,
      userId: bookingData.userId,
      vetsVanId: bookingData.vetsVanId,
      shiftId: bookingData.shiftId,
      appointmentDate: bookingData.appointmentDate,
      appointmentTime: bookingData.appointmentTime,
      status: bookingData.status || 'pending_review',
      customerLocation: bookingData.customerLocation,
      selectedPets: bookingData.selectedPets || [],
      serviceType: bookingData.serviceType || 'General Check Up',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async getShiftBookings(shiftId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.shiftId === shiftId);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async updateBookingStatus(bookingId: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(bookingId);
    if (booking) {
      booking.status = status;
      booking.updatedAt = new Date();
      this.bookings.set(bookingId, booking);
      return booking;
    }
    return undefined;
  }

  async getBookingWithUserDetails(bookingId: number): Promise<Booking & { user: User } | undefined> {
    const booking = this.bookings.get(bookingId);
    if (!booking) return undefined;
    
    const user = this.users.get(booking.userId);
    if (!user) return undefined;
    
    return { ...booking, user };
  }

  async getBookingWithDetails(bookingId: number): Promise<any> {
    const booking = this.bookings.get(bookingId);
    if (!booking) return undefined;

    const customer = this.users.get(booking.userId);
    if (!customer) return undefined;

    // Get VetsVan details
    const vetsVan = this.drivers.get(booking.vetsVanId);

    // Use selected pets from booking instead of all customer pets
    const selectedPetsData = booking.selectedPets || [];

    return {
      id: booking.id,
      customer: {
        firstName: customer.firstName || customer.name?.split(' ')[0] || '',
        lastName: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
        phone: customer.phone,
        email: customer.email,
      },
      pets: selectedPetsData.map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        type: pet.type,
        ageYear: pet.ageYear || 0,
        ageMonth: pet.ageMonth || 0,
        ageDay: pet.ageDay || 0,
      })),
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      serviceType: booking.serviceType || 'General Check Up',
      location: booking.customerLocation,
      status: booking.status,
      vetsVanId: booking.vetsVanId,
      vetsVanCode: vetsVan?.vetsvanCode || '',
      vetsVanName: vetsVan?.vetsvanName || '',
    };
  }

  // Payment methods removed per user request

  async createReview(reviewData: InsertReview): Promise<Review> {
    const review: Review = {
      id: ++this.currentReviewId,
      bookingId: reviewData.bookingId,
      userId: reviewData.userId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date(),
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async getBookingReview(bookingId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values()).find(review => review.bookingId === bookingId);
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.userId === userId);
  }

  async getReportsStats(): Promise<{
    totalBookings: number;
    completedBookings: number;
    averageRating: number;
    totalReviews: number;
    totalVetsVans: number;
    availableVetsVans: number;
  }> {
    // Get all bookings
    const allBookings = Array.from(this.bookings.values());
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    
    // Get all reviews
    const allReviews = Array.from(this.reviews.values());
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;
    
    // Get all drivers (VetsVans)
    const allDrivers = Array.from(this.drivers.values());
    const availableDrivers = allDrivers.filter(d => d.isAvailable);
    
    return {
      totalBookings: allBookings.length,
      completedBookings: completedBookings.length,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: allReviews.length,
      totalVetsVans: allDrivers.length,
      availableVetsVans: availableDrivers.length,
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
    const detailedReviews = [];
    
    for (const review of this.reviews.values()) {
      // Get booking details
      const booking = this.bookings.get(review.bookingId);
      if (!booking) continue;
      
      // Get user details
      const user = this.users.get(review.userId);
      if (!user) continue;
      
      // Get shift details to get VetsVan info
      const shift = this.shifts.get(booking.shiftId);
      if (!shift) continue;
      
      // Get driver details
      const driver = this.drivers.get(shift.vetsVanId);
      if (!driver) continue;
      
      detailedReviews.push({
        id: review.id,
        rating: review.rating,
        comment: review.comment || '',
        createdAt: review.createdAt.toISOString(),
        userName: user.name || `${user.firstName} ${user.lastName}`,
        userPhone: user.phone || '',
        vetsvanName: driver.vetsvanName || driver.name,
        vetsvanCode: driver.vetsvanCode || '',
      });
    }
    
    return detailedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

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
    console.log('getAllVetsVanRequestsWithDetails called in MemStorage');
    console.log('Total bookings:', this.bookings.size);
    const detailedRequests = [];
    
    for (const booking of this.bookings.values()) {
      console.log('Processing booking:', booking.id);
      // Get user details
      const user = this.users.get(booking.userId);
      if (!user) continue;
      
      // Get shift details to get VetsVan info
      const shift = this.shifts.get(booking.shiftId);
      if (!shift) continue;
      
      // Get driver details
      const driver = this.drivers.get(shift.vetsVanId);
      if (!driver) continue;
      
      // Parse pets data
      let pets = [];
      try {
        pets = typeof booking.pets === 'string' ? JSON.parse(booking.pets) : (booking.pets || []);
      } catch (e) {
        pets = [];
      }

      // Parse location data
      let location = null;
      try {
        location = typeof booking.customerLocation === 'string' ? JSON.parse(booking.customerLocation) : booking.customerLocation;
      } catch (e) {
        location = null;
      }
      
      detailedRequests.push({
        id: booking.id,
        customerName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Customer',
        customerPhone: user.phone || 'N/A',
        customerEmail: user.email || 'N/A',
        vetsvanCode: driver.vetsvanCode || 'N/A',
        vetsvanName: driver.vetsvanName || driver.name || 'N/A',
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status,
        location: location,
        pets: pets,
        serviceType: booking.serviceType || 'general_checkup',
        createdAt: booking.createdAt.toISOString(),
      });
    }
    
    return detailedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pet vitals operations (MemStorage implementation)
  async createPetVital(vital: InsertPetVital): Promise<PetVital> {
    const id = this.currentPetVitalId++;
    const petVital: PetVital = {
      id,
      bookingId: vital.bookingId,
      petId: vital.petId,
      weight: vital.weight,
      temperature: vital.temperature,
      heartRate: vital.heartRate,
      notes: vital.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.petVitals.set(id, petVital);
    return petVital;
  }

  async getPetVitalsByBooking(bookingId: number): Promise<PetVital[]> {
    const vitals = Array.from(this.petVitals.values()).filter(
      vital => vital.bookingId === bookingId
    );
    return vitals;
  }

  async updatePetVital(id: number, vital: Partial<InsertPetVital>): Promise<PetVital> {
    const existingVital = this.petVitals.get(id);
    if (!existingVital) {
      throw new Error('Pet vital not found');
    }
    
    const updatedVital: PetVital = {
      ...existingVital,
      ...vital,
      updatedAt: new Date()
    };
    
    this.petVitals.set(id, updatedVital);
    return updatedVital;
  }

  // Pet attachments operations (MemStorage implementation)
  async createPetAttachment(attachment: InsertPetAttachment): Promise<PetAttachment> {
    const id = this.currentPetAttachmentId++;
    const petAttachment: PetAttachment = {
      id,
      petId: attachment.petId,
      bookingId: attachment.bookingId,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      fileUrl: attachment.fileUrl,
      uploadedBy: attachment.uploadedBy,
      uploadedAt: new Date(),
      description: attachment.description || null,
    };
    this.petAttachments.set(id, petAttachment);
    return petAttachment;
  }

  async getPetAttachmentsByBooking(bookingId: number): Promise<PetAttachment[]> {
    return Array.from(this.petAttachments.values()).filter(
      attachment => attachment.bookingId === bookingId
    );
  }

  async getPetAttachmentsByPet(petId: number, bookingId: number): Promise<PetAttachment[]> {
    return Array.from(this.petAttachments.values()).filter(
      attachment => attachment.petId === petId && attachment.bookingId === bookingId
    );
  }

  async deletePetAttachment(id: number, uploadedBy: string): Promise<boolean> {
    const attachment = this.petAttachments.get(id);
    if (attachment && attachment.uploadedBy === uploadedBy) {
      this.petAttachments.delete(id);
      return true;
    }
    return false;
  }

  // Products and Services for import system
  async getProducts(): Promise<any[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getServices(): Promise<any[]> {
    return Array.from(this.services.values()).filter(s => s.isActive);
  }

  async createProduct(product: any): Promise<any> {
    const newProduct = { ...product, id: this.currentProductId++ };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async createService(service: any): Promise<any> {
    const newService = { ...service, id: this.currentServiceId++ };
    this.services.set(newService.id, newService);
    return newService;
  }

  async updateProduct(id: number, product: any): Promise<any> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    const updatedProduct = { ...existingProduct, ...product, updatedAt: new Date() };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async updateService(id: number, service: any): Promise<any> {
    const existingService = this.services.get(id);
    if (!existingService) {
      throw new Error('Service not found');
    }
    const updatedService = { ...existingService, ...service, updatedAt: new Date() };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteProduct(id: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.isActive = false;
      this.products.set(id, product);
    }
  }

  async deleteService(id: number): Promise<void> {
    const service = this.services.get(id);
    if (service) {
      service.isActive = false;
      this.services.set(id, service);
    }
  }

  // Import history
  async getImportHistory(): Promise<any[]> {
    return Array.from(this.importHistory.values()).sort((a, b) => 
      new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );
  }

  async createImportHistory(importData: any): Promise<any> {
    const newHistory = { ...importData, id: this.currentImportHistoryId++ };
    this.importHistory.set(newHistory.id, newHistory);
    return newHistory;
  }

  // Invoice Items operations (MemStorage implementation)
  async saveInvoiceItems(bookingId: number, items: any[]): Promise<InvoiceItem[]> {
    // Remove existing invoice items for this booking
    const existingItems = Array.from(this.invoiceItems.values()).filter(
      item => item.bookingId === bookingId
    );
    existingItems.forEach(item => this.invoiceItems.delete(item.id));
    
    // Add new invoice items
    const savedItems = items.map(item => ({
      ...item,
      id: this.currentInvoiceItemId++,
      bookingId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    savedItems.forEach(item => this.invoiceItems.set(item.id, item));
    return savedItems;
  }

  async getInvoiceItems(bookingId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(
      item => item.bookingId === bookingId
    );
  }

  async deleteInvoiceItems(bookingId: number): Promise<void> {
    const items = Array.from(this.invoiceItems.values()).filter(
      item => item.bookingId === bookingId
    );
    items.forEach(item => this.invoiceItems.delete(item.id));
  }

  // Invoice Status operations (MemStorage implementation)
  async saveInvoiceStatus(status: any): Promise<any> {
    const newStatus = { ...status, id: this.currentInvoiceStatusId++ };
    this.invoiceStatuses.set(newStatus.bookingId, newStatus);
    return newStatus;
  }

  async getInvoiceStatus(bookingId: number): Promise<any> {
    return this.invoiceStatuses.get(bookingId);
  }

  async updateInvoiceStatus(bookingId: number, data: any): Promise<any> {
    const existingStatus = this.invoiceStatuses.get(bookingId);
    if (!existingStatus) {
      return undefined;
    }

    const updatedStatus = { ...existingStatus, ...data, updatedAt: new Date() };
    this.invoiceStatuses.set(bookingId, updatedStatus);
    return updatedStatus;
  }

  // Products operations (MemStorage implementation)
  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct = { ...product, id: this.currentProductId++ };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) throw new Error('Product not found');
    
    const updated = { ...existing, ...product, updatedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    const existing = this.products.get(id);
    if (existing) {
      this.products.set(id, { ...existing, isActive: false });
    }
  }

  // Services operations (MemStorage implementation)
  async createService(service: InsertService): Promise<Service> {
    const newService = { ...service, id: this.currentServiceId++ };
    this.services.set(newService.id, newService);
    return newService;
  }

  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.isActive);
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const existing = this.services.get(id);
    if (!existing) throw new Error('Service not found');
    
    const updated = { ...existing, ...service, updatedAt: new Date() };
    this.services.set(id, updated);
    return updated;
  }

  async deleteService(id: number): Promise<void> {
    const existing = this.services.get(id);
    if (existing) {
      this.services.set(id, { ...existing, isActive: false });
    }
  }

  // Import History operations (MemStorage implementation)
  async createImportHistory(importData: InsertImportHistory): Promise<ImportHistory> {
    const newImportHistory = { ...importData, id: this.currentImportHistoryId++ };
    this.importHistory.set(newImportHistory.id, newImportHistory);
    return newImportHistory;
  }

  async getImportHistory(): Promise<ImportHistory[]> {
    return Array.from(this.importHistory.values())
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  }

  // Pet vitals operations
  async createPetVital(vital: InsertPetVital): Promise<PetVital> {
    console.log('DatabaseStorage createPetVital called with:', vital);
    const [newVital] = await db
      .insert(petVitals)
      .values(vital)
      .returning();
    return newVital;
  }

  async getPetVitalsByBooking(bookingId: number): Promise<PetVital[]> {
    return await db
      .select()
      .from(petVitals)
      .where(eq(petVitals.bookingId, bookingId));
  }

  async updatePetVital(id: number, vital: Partial<InsertPetVital>): Promise<PetVital> {
    const [updatedVital] = await db
      .update(petVitals)
      .set(vital)
      .where(eq(petVitals.id, id))
      .returning();
    return updatedVital;
  }

  // Pet attachments operations (DatabaseStorage implementation)
  async createPetAttachment(attachment: InsertPetAttachment): Promise<PetAttachment> {
    const [newAttachment] = await db
      .insert(petAttachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async getPetAttachmentsByBooking(bookingId: number): Promise<PetAttachment[]> {
    return await db
      .select()
      .from(petAttachments)
      .where(eq(petAttachments.bookingId, bookingId));
  }

  async getPetAttachmentsByPet(petId: number, bookingId: number): Promise<PetAttachment[]> {
    try {
      console.log(`DatabaseStorage: Getting attachments for petId=${petId}, bookingId=${bookingId}`);
      const result = await db
        .select()
        .from(petAttachments)
        .where(and(eq(petAttachments.petId, petId), eq(petAttachments.bookingId, bookingId)));
      console.log(`DatabaseStorage: Found ${result.length} attachments`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage: Error in getPetAttachmentsByPet:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  async deletePetAttachment(id: number, uploadedBy: string): Promise<boolean> {
    const result = await db
      .delete(petAttachments)
      .where(and(eq(petAttachments.id, id), eq(petAttachments.uploadedBy, uploadedBy)))
      .returning();
    return result.length > 0;
  }

  // Invoice Items operations (DatabaseStorage implementation)
  async saveInvoiceItems(bookingId: number, items: any[]): Promise<InvoiceItem[]> {
    // First delete existing invoice items for this booking
    await db.delete(invoiceItems).where(eq(invoiceItems.bookingId, bookingId));
    
    // Insert new invoice items
    const insertData = items.map(item => ({
      bookingId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
    }));
    
    if (insertData.length === 0) return [];
    
    const savedItems = await db.insert(invoiceItems).values(insertData).returning();
    return savedItems;
  }

  async getInvoiceItems(bookingId: number): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.bookingId, bookingId));
  }

  async deleteInvoiceItems(bookingId: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.bookingId, bookingId));
  }

  // Invoice Status operations (DatabaseStorage implementation)
  async saveInvoiceStatus(status: InsertInvoiceStatus): Promise<InvoiceStatus> {
    const [savedStatus] = await db
      .insert(invoiceStatus)
      .values({
        ...status,
        subtotal: status.subtotal.toString(),
        taxAmount: status.taxAmount.toString(),
        discountAmount: status.discountAmount.toString(),
        finalTotal: status.finalTotal.toString(),
        isGenerated: true,
        generatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: invoiceStatus.bookingId,
        set: {
          isGenerated: true,
          generatedAt: new Date(),
          generatedBy: status.generatedBy,
          notes: status.notes,
          subtotal: status.subtotal.toString(),
          taxAmount: status.taxAmount.toString(),
          discountAmount: status.discountAmount.toString(),
          finalTotal: status.finalTotal.toString(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return savedStatus;
  }

  async getInvoiceStatus(bookingId: number): Promise<InvoiceStatus | undefined> {
    const [status] = await db
      .select()
      .from(invoiceStatus)
      .where(eq(invoiceStatus.bookingId, bookingId));
    return status;
  }

  async updateInvoiceStatus(bookingId: number, data: Partial<InvoiceStatus>): Promise<InvoiceStatus | undefined> {
    const [updatedStatus] = await db
      .update(invoiceStatus)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoiceStatus.bookingId, bookingId))
      .returning();
    return updatedStatus;
  }

  // Products operations (DatabaseStorage implementation)
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async getProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true));
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
    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
  }

  // Services operations (DatabaseStorage implementation)
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }

  async getServices(): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.isActive, true));
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
    await db
      .update(services)
      .set({ isActive: false })
      .where(eq(services.id, id));
  }

  // Import History operations (DatabaseStorage implementation)
  async createImportHistory(importData: InsertImportHistory): Promise<ImportHistory> {
    const [newImportHistory] = await db
      .insert(importHistory)
      .values(importData)
      .returning();
    return newImportHistory;
  }

  async getImportHistory(): Promise<ImportHistory[]> {
    return await db
      .select()
      .from(importHistory)
      .orderBy(desc(importHistory.importedAt));
  }

  // Initialize sample products and services
  async createSampleData() {
    try {
      // Check if products already exist
      const existingProducts = await this.getProducts();
      if (existingProducts.length === 0) {
        // Sample products
        const sampleProducts = [
          { name: 'أطعمة جافة للقطط', price: '45.00', category: 'أطعمة', description: 'أطعمة جافة عالية الجودة للقطط البالغة' },
          { name: 'أطعمة جافة للكلاب', price: '65.00', category: 'أطعمة', description: 'أطعمة جافة متوازنة للكلاب الصغيرة والمتوسطة' },
          { name: 'لعبة كرة للقطط', price: '15.00', category: 'ألعاب', description: 'لعبة كرة تفاعلية للقطط' },
          { name: 'طوق للكلاب', price: '25.00', category: 'إكسسوارات', description: 'طوق مريح وقابل للتعديل للكلاب' },
          { name: 'صندوق رمل للقطط', price: '35.00', category: 'نظافة', description: 'صندوق رمل عالي الجودة للقطط' },
        ];

        for (const product of sampleProducts) {
          await this.createProduct({
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            isActive: true,
          });
        }
      }

      // Check if services already exist
      const existingServices = await this.getServices();
      if (existingServices.length === 0) {
        // Sample services
        const sampleServices = [
          { name: 'فحص شامل للحيوان', price: '150.00', category: 'فحوصات', description: 'فحص شامل لصحة الحيوان الأليف' },
          { name: 'تطعيم أساسي', price: '80.00', category: 'تطعيمات', description: 'تطعيم أساسي للحيوانات الأليفة' },
          { name: 'قص أظافر', price: '30.00', category: 'عناية', description: 'قص أظافر الحيوانات الأليفة' },
          { name: 'تنظيف أسنان', price: '120.00', category: 'عناية', description: 'تنظيف أسنان الحيوانات الأليفة' },
          { name: 'استحمام وتنظيف', price: '60.00', category: 'عناية', description: 'استحمام وتنظيف شامل للحيوان الأليف' },
        ];

        for (const service of sampleServices) {
          await this.createService({
            name: service.name,
            price: service.price,
            category: service.category,
            description: service.description,
            isActive: true,
          });
        }
      }
    } catch (error) {
      console.error('Error initializing sample products and services:', error);
    }
  }
}

export const storage = new DatabaseStorage();