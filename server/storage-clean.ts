import { users, drivers, rides, patients, admins, shifts, bookings, reviews, petVitals, petAttachments, invoiceItems, invoiceStatus, products, services, importHistory, otpVerifications, type User, type Driver, type Ride, type InsertUser, type RideRequest, type Patient, type InsertPatient, type Admin, type InsertDriver, type Shift, type InsertShift, type Booking, type InsertBooking, type Review, type InsertReview, type PetVital, type InsertPetVital, type PetAttachment, type InsertPetAttachment, type InvoiceItem, type InsertInvoiceItem, type InvoiceStatus, type InsertInvoiceStatus, type Product, type InsertProduct, type Service, type InsertService, type ImportHistory, type InsertImportHistory, type OtpVerification, type InsertOtpVerification } from "@shared/schema";
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
  
  // Bulk import operations
  bulkCreateServices(services: any[]): Promise<{ imported: number; updated: number; failed: number }>;
  bulkCreateProducts(products: any[]): Promise<{ imported: number; updated: number; failed: number }>;

  // OTP Verification operations
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(email: string, code: string): Promise<OtpVerification | undefined>;
  deleteOtpVerification(email: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeTestData();
  }

  private async initializeTestData() {
    try {
      // Check if data already exists
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return; // Data already initialized
      }

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

      // Create admin
      await db.insert(admins).values({
        id: 1,
        username: "admin",
        password: "123456",
        name: "Admin User",
        role: "admin"
      });

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

      console.log("Test data initialized successfully");
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
    const [newBooking] = await db.insert(bookings).values(booking).returning();
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
      user,
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
    const allReviews = await db.select().from(reviews);
    const allBookings = await db.select().from(bookings);
    const allUsers = await db.select().from(users);
    const allDrivers = await db.select().from(drivers);

    return allReviews.map(review => {
      const booking = allBookings.find(b => b.id === review.bookingId);
      const user = allUsers.find(u => u.id === review.userId);
      const driver = allDrivers.find(d => d.id === booking?.vetsVanId);

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment || "",
        createdAt: review.createdAt?.toISOString() || new Date().toISOString(),
        userName: user?.name || "Unknown",
        userPhone: user?.phone || "Unknown",
        vetsvanName: driver?.vetsvanName || "Unknown",
        vetsvanCode: driver?.vetsvanCode || "Unknown"
      };
    });
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
    const allBookings = await db.select().from(bookings);
    const allUsers = await db.select().from(users);
    const allDrivers = await db.select().from(drivers);

    return allBookings.map(booking => {
      const user = allUsers.find(u => u.id === booking.userId);
      const driver = allDrivers.find(d => d.id === booking.vetsVanId);

      // Extract pet names and types from selectedPets
      const pets = booking.selectedPets?.map((pet: any) => ({
        name: pet.name || "Unknown",
        type: pet.type || "Unknown"
      })) || [];

      return {
        id: booking.id,
        customerName: user?.name || "Unknown",
        customerPhone: user?.phone || "Unknown",
        customerEmail: user?.email || "Unknown",
        vetsvanCode: driver?.vetsvanCode || "Unknown",
        vetsvanName: driver?.vetsvanName || "Unknown",
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status,
        location: booking.customerLocation,
        pets: pets,
        serviceType: booking.serviceType || "Unknown",
        createdAt: booking.createdAt?.toISOString() || new Date().toISOString()
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
        total: item.total.toString()
      }).returning();
      savedItems.push(savedItem);
    }
    
    return savedItems;
  }

  async getInvoiceItems(bookingId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.bookingId, bookingId));
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
  async bulkCreateServices(services: any[]): Promise<{ imported: number; updated: number; failed: number }> {
    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const service of services) {
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

    return { imported, updated, failed };
  }

  async bulkCreateProducts(products: any[]): Promise<{ imported: number; updated: number; failed: number }> {
    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const product of products) {
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
}

export const storage = new DatabaseStorage();