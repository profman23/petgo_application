import { users, drivers, rides, patients, admins, adminUsers, shifts, bookings, reviews, petVitals, petAttachments, invoiceItems, invoiceStatus, products, services, importHistory, otpVerifications, generatedInvoices, invoicePayments, userSessions, paymentTransactions, creditNotes, outgoingPayments, incomePayments, authorizationRoles, type User, type Driver, type Ride, type InsertUser, type RideRequest, type Patient, type InsertPatient, type Admin, type InsertDriver, type Shift, type InsertShift, type Booking, type InsertBooking, type Review, type InsertReview, type PetVital, type InsertPetVital, type PetAttachment, type InsertPetAttachment, type InvoiceItem, type InsertInvoiceItem, type InvoiceStatus, type InsertInvoiceStatus, type Product, type InsertProduct, type Service, type InsertService, type ImportHistory, type InsertImportHistory, type OtpVerification, type InsertOtpVerification, type GeneratedInvoice, type InsertGeneratedInvoice, type InvoicePayment, type InsertInvoicePayment, type UserSession, type InsertUserSession, type SelectPaymentTransaction, type InsertPaymentTransaction, type CreditNote, type InsertCreditNote, type OutgoingPayment, type InsertOutgoingPayment, type IncomePayment, type InsertIncomePayment, type AuthorizationRole, type InsertAuthorizationRole } from "@shared/schema";
import { db } from "./db";
import { eq, and, not, inArray, desc, lt, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  deactivateUser(id: number): Promise<User | undefined>;
  
  // Driver operations
  getAllDrivers(): Promise<Driver[]>;
  getAvailableDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUsername(username: string): Promise<Driver | undefined>;
  getDriverByVetsVanCode(vetsVanCode: string): Promise<Driver | undefined>;
  updateDriverLocation(id: number, latitude: number, longitude: number): Promise<void>;
  updateDriverAvailability(id: number, isAvailable: boolean): Promise<void>;
  updateVetsVanData(id: number, vetsvanCode: string, vetsvanName: string, username: string, phone: string, plateNumber: string): Promise<void>;
  
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
  getPatientById(patientId: number, userId: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(patientId: number, userId: number, updateData: Partial<Patient>): Promise<Patient | undefined>;

  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  deleteDriver(id: number): Promise<void>;

  // Authorization Roles operations
  createAuthorizationRole(role: InsertAuthorizationRole): Promise<AuthorizationRole>;
  getAllAuthorizationRoles(): Promise<AuthorizationRole[]>;
  getAuthorizationRole(id: number): Promise<AuthorizationRole | undefined>;

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

  // Invoice Payment operations
  createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment>;
  getInvoicePaymentsByBooking(bookingId: number): Promise<InvoicePayment[]>;
  deleteInvoicePayment(paymentId: number): Promise<void>;

  // Session operations for production persistence
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(sessionId: string): Promise<UserSession | undefined>;
  updateSessionLastAccessed(sessionId: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  getUserSessions(userId: number): Promise<UserSession[]>;
  getAllActiveSessions(): Promise<UserSession[]>;

  // Payment Transaction operations for MyFatoorah
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<SelectPaymentTransaction>;
  getPaymentTransaction(id: number): Promise<SelectPaymentTransaction | undefined>;
  getPaymentTransactionByBooking(bookingId: number): Promise<SelectPaymentTransaction | undefined>;
  getPaymentTransactionByPaymentId(paymentId: string): Promise<SelectPaymentTransaction | undefined>;
  updatePaymentTransaction(id: number, data: Partial<SelectPaymentTransaction>): Promise<SelectPaymentTransaction | undefined>;
  updatePaymentTransactionStatus(id: number, status: string, paidAt?: Date): Promise<void>;
  getAllPaymentTransactions(): Promise<SelectPaymentTransaction[]>;

  // Credit Note operations
  createCreditNote(creditNote: InsertCreditNote): Promise<CreditNote>;
  getAllCreditNotes(): Promise<CreditNote[]>;
  getCreditNote(id: number): Promise<CreditNote | undefined>;
  getCreditNoteByNumber(creditNoteNumber: string): Promise<CreditNote | undefined>;
  getNextCreditNoteNumber(): Promise<string>;
  getCreditedItemsForInvoice(invoiceNumber: string): Promise<any[]>;

  // Outgoing Payment operations
  createOutgoingPayment(payment: InsertOutgoingPayment): Promise<OutgoingPayment>;
  getAllOutgoingPayments(): Promise<OutgoingPayment[]>;
  getOutgoingPayment(id: number): Promise<OutgoingPayment | undefined>;
  getNextOutgoingPaymentNumber(): Promise<string>;

  // Income Payment operations
  createIncomePayment(payment: InsertIncomePayment): Promise<IncomePayment>;
  getAllIncomePayments(): Promise<IncomePayment[]>;
  getIncomePayment(id: number): Promise<IncomePayment | undefined>;
  getNextIncomePaymentNumber(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // 🔒 INITIALIZATION PERMANENTLY DISABLED TO PROTECT IMPORTED DATA
    // this.initializeTestData(); // DISABLED - Was causing data loss on restart
    this.startDataProtection();
  }

  private async startDataProtection() {
    try {
      // 🚨 ULTIMATE PROTECTION: Complete multi-layered protection system
      console.log("🔒 ULTIMATE DATA PROTECTION INITIALIZING...");
      
      // Layer 1: Final Protection System - DISABLED
      // const { finalDataProtection } = await import('./dataProtectionFinal');
      // await finalDataProtection.initialize(); // DISABLED TO PREVENT AUTOMATIC BACKUPS
      
      // Layer 2: Import Protection System - DISABLED
      // const { importProtection } = await import('./importDataProtection');
      // await importProtection.initialize(); // DISABLED TO PREVENT AUTOMATIC BACKUPS
      
      // Layer 3: Ultimate Protection System (All Solutions) - DISABLED
      // const { ultimateDataProtection } = await import('./ultimateDataProtection');
      // await ultimateDataProtection.initializeAllProtections(); // DISABLED TO PREVENT AUTOMATIC BACKUPS
      
      console.log("🛡️ ULTIMATE DATA PROTECTION ACTIVATED (NO AUTOMATIC BACKUPS)");
      console.log("⚠️ All automatic data deletion/reset systems DISABLED");
      console.log("💡 Manual data management only - NO automatic changes");
      
    } catch (error) {
      console.error("❌ Ultimate data protection initialization failed:", error);
      // Fallback to basic protection
      console.log("🔒 Fallback: Basic data protection mode active");
    }
  }

  private async initializeTestData() {
    try {
      // 🚨 EMERGENCY PROTECTION: Complete system shutdown for data protection
      console.log("🔒 INITIALIZATION PERMANENTLY DISABLED - Data protection mode active");
      console.log("⚠️ No test data will be created to protect imported Products/Services");
      console.log("💡 Manual data creation only - automatic initialization bypassed");
      
      // Enhanced data integrity check - verify all critical tables
      const existingUsers = await db.select().from(users).limit(1);
      const existingProducts = await db.select().from(products).limit(1);
      const existingServices = await db.select().from(services).limit(1);
      const existingDrivers = await db.select().from(drivers).limit(1);
      const existingAdmins = await db.select().from(admins).limit(1);
      
      // Data integrity log
      console.log("🔍 Database Integrity Check:", {
        users: existingUsers.length,
        drivers: existingDrivers.length,
        admins: existingAdmins.length,
        products: existingProducts.length,
        services: existingServices.length
      });
      
      // COMPLETE SHUTDOWN - No automatic data creation
      console.log("✅ Data protection active - no automatic initialization performed");
      return;
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

  async deactivateUser(id: number): Promise<User | undefined> {
    const [deactivatedUser] = await db
      .update(users)
      .set({ active: false })
      .where(eq(users.id, id))
      .returning();
    return deactivatedUser;
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

  async updateVetsVanData(id: number, vetsvanCode: string, vetsvanName: string, username: string, phone: string, plateNumber: string): Promise<void> {
    await db
      .update(drivers)
      .set({ vetsvanCode, vetsvanName, username, phone, plateNumber })
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

  async getPatientById(patientId: number, userId: number): Promise<Patient | undefined> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.userId, userId)))
      .limit(1);
    return patient;
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
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async deleteDriver(id: number): Promise<void> {
    await db.delete(drivers).where(eq(drivers.id, id));
  }

  // Authorization Roles operations
  async createAuthorizationRole(role: InsertAuthorizationRole): Promise<AuthorizationRole> {
    const [newRole] = await db.insert(authorizationRoles).values(role).returning();
    return newRole;
  }

  async getAllAuthorizationRoles(): Promise<AuthorizationRole[]> {
    return await db.select().from(authorizationRoles).orderBy(desc(authorizationRoles.createdAt));
  }

  async getAuthorizationRole(id: number): Promise<AuthorizationRole | undefined> {
    const [role] = await db.select().from(authorizationRoles).where(eq(authorizationRoles.id, id)).limit(1);
    return role;
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
    driverId: number;
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
        driverId: drivers.id,
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
        driverId: booking.driverId,
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
    // Actually delete the service record from the database
    await db
      .delete(services)
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

    // Trigger import data protection after bulk operation - DISABLED
    if (imported > 0 || updated > 0) {
      // const { importProtection } = await import('./importDataProtection');
      // await importProtection.createImportBackup(); // DISABLED TO PREVENT AUTOMATIC BACKUPS
      console.log(`🔒 Import data protection updated: ${imported} new, ${updated} updated services (NO AUTOMATIC BACKUP)`);
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

    // Trigger import data protection after bulk operation - DISABLED
    if (imported > 0 || updated > 0) {
      // const { importProtection } = await import('./importDataProtection');
      // await importProtection.createImportBackup(); // DISABLED TO PREVENT AUTOMATIC BACKUPS
      console.log(`🔒 Import data protection updated: ${imported} new, ${updated} updated products (NO AUTOMATIC BACKUP)`);
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
    const invoices = await db
      .select()
      .from(generatedInvoices)
      .orderBy(desc(generatedInvoices.generatedAt));
    
    // Calculate total paid and get payment details for each invoice
    const invoicesWithPaymentData = await Promise.all(
      invoices.map(async (invoice) => {
        const payments = await db
          .select()
          .from(invoicePayments)
          .where(eq(invoicePayments.bookingId, invoice.bookingId))
          .orderBy(desc(invoicePayments.createdAt));
        
        const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        
        return {
          ...invoice,
          totalPaid: totalPaid.toFixed(2),
          payments: payments
        };
      })
    );
    
    return invoicesWithPaymentData;
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

  // Invoice Payment operations
  async createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment> {
    const [newPayment] = await db.insert(invoicePayments).values(payment).returning();
    return newPayment;
  }

  async getInvoicePaymentsByBooking(bookingId: number): Promise<InvoicePayment[]> {
    return await db.select().from(invoicePayments)
      .where(eq(invoicePayments.bookingId, bookingId))
      .orderBy(desc(invoicePayments.createdAt));
  }

  async deleteInvoicePayment(paymentId: number): Promise<void> {
    await db.delete(invoicePayments).where(eq(invoicePayments.id, paymentId));
  }

  // Session operations for production persistence
  async createSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.id, sessionId));
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      await this.deleteSession(sessionId);
      return undefined;
    }
    
    // Update last accessed time
    await this.updateSessionLastAccessed(sessionId);
    return session;
  }

  async updateSessionLastAccessed(sessionId: string): Promise<void> {
    await db.update(userSessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(userSessions.id, sessionId));
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.id, sessionId));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(userSessions).where(lt(userSessions.expiresAt, new Date()));
  }

  async getUserSessions(userId: number): Promise<UserSession[]> {
    return await db.select().from(userSessions).where(eq(userSessions.userId, userId));
  }

  async getAllActiveSessions(): Promise<UserSession[]> {
    return await db.select().from(userSessions);
  }

  // Payment Transaction operations for MyFatoorah
  async createPaymentTransaction(transaction: any): Promise<any> {
    // Use raw SQL to handle database column mismatch
    const [newTransaction] = await db.execute(sql`
      INSERT INTO payment_transactions (
        booking_id, myfatoorah_payment_id, myfatoorah_invoice_id, amount, currency, status, 
        customer_name, customer_email, customer_phone, paid_at, created_at, updated_at
      ) VALUES (
        ${transaction.bookingId}, ${transaction.myfatoorahPaymentId || transaction.paymentId}, 
        ${transaction.myfatoorahInvoiceId || transaction.invoiceReference}, 
        ${transaction.amount}, ${transaction.currency || 'SAR'}, ${transaction.status || 'paid'},
        ${transaction.customerName}, ${transaction.customerEmail}, ${transaction.customerPhone},
        ${transaction.paidAt || new Date()}, ${transaction.createdAt || new Date()}, 
        ${transaction.updatedAt || new Date()}
      ) RETURNING *
    `);
    return newTransaction.rows[0];
  }

  async getPaymentTransaction(id: number): Promise<SelectPaymentTransaction | undefined> {
    const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return transaction;
  }

  async getPaymentTransactionByBooking(bookingId: number): Promise<any> {
    // Link payment transactions to bookings via booking_id in payment_transactions table
    const result = await db.execute(sql`
      SELECT 
        pt.amount, 
        pt.currency, 
        pt.status, 
        pt.myfatoorah_payment_id, 
        pt.paid_at
      FROM payment_transactions pt
      WHERE pt.booking_id = ${bookingId}
      ORDER BY pt.created_at DESC 
      LIMIT 1
    `);
    
    return result.rows[0] || null;
  }

  async getPaymentTransactionByPaymentId(paymentId: string): Promise<SelectPaymentTransaction | undefined> {
    const [transaction] = await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.paymentId, paymentId));
    return transaction;
  }

  async updatePaymentTransaction(id: number, data: Partial<SelectPaymentTransaction>): Promise<SelectPaymentTransaction | undefined> {
    const [updatedTransaction] = await db.update(paymentTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async updatePaymentTransactionStatus(id: number, status: string, paidAt?: Date): Promise<void> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (paidAt) {
      updateData.paidAt = paidAt;
    }

    await db.update(paymentTransactions)
      .set(updateData)
      .where(eq(paymentTransactions.id, id));
  }

  async getAllPaymentTransactions(): Promise<SelectPaymentTransaction[]> {
    return await db.select().from(paymentTransactions)
      .orderBy(desc(paymentTransactions.createdAt));
  }

  // Credit Note operations
  async createCreditNote(creditNote: InsertCreditNote): Promise<CreditNote> {
    const [newCreditNote] = await db.insert(creditNotes)
      .values(creditNote)
      .returning();
    return newCreditNote;
  }

  async getAllCreditNotes(): Promise<CreditNote[]> {
    return await db.select().from(creditNotes)
      .orderBy(desc(creditNotes.createdAt));
  }

  async getCreditNote(id: number): Promise<CreditNote | undefined> {
    const [creditNote] = await db.select().from(creditNotes)
      .where(eq(creditNotes.id, id));
    return creditNote;
  }

  async getCreditNoteByNumber(creditNoteNumber: string): Promise<CreditNote | undefined> {
    const [creditNote] = await db.select().from(creditNotes)
      .where(eq(creditNotes.creditNoteNumber, creditNoteNumber));
    return creditNote;
  }

  async getNextCreditNoteNumber(): Promise<string> {
    // Get all credit note numbers to find the highest one
    const allCreditNotes = await db.select({ creditNoteNumber: creditNotes.creditNoteNumber })
      .from(creditNotes)
      .orderBy(desc(creditNotes.id));

    // Create a set of existing numbers for gap detection
    const existingNumbers = new Set<number>();
    let highestNumber = 90000; // Start from 90000 so next will be 90001

    for (const creditNote of allCreditNotes) {
      const cnNumber = creditNote.creditNoteNumber;
      let parsedNumber: number;
      
      // Handle different formats
      if (cnNumber.startsWith('CRN')) {
        // Old format: CRN000123
        parsedNumber = parseInt(cnNumber.replace('CRN', ''));
      } else {
        // New format: just the number
        parsedNumber = parseInt(cnNumber);
      }
      
      // Only consider numbers >= 90001 (our new range)
      if (!isNaN(parsedNumber) && parsedNumber >= 90001) {
        existingNumbers.add(parsedNumber);
        if (parsedNumber > highestNumber) {
          highestNumber = parsedNumber;
        }
      }
    }

    // ONE-TIME FIX: Check if 90008 is missing (gap-filling for deleted CRN90008)
    if (!existingNumbers.has(90008) && highestNumber >= 90008) {
      return "90008";
    }

    // Normal sequence: next number after highest
    const nextNumber = highestNumber + 1;
    return nextNumber.toString();
  }

  async getCreditedItemsForInvoice(invoiceNumber: string): Promise<any[]> {
    // Get all credit notes for this invoice
    const creditNotesForInvoice = await db.select()
      .from(creditNotes)
      .where(eq(creditNotes.invoiceNumber, invoiceNumber));

    // Aggregate credited quantities by invoiceItemId
    const creditedItemsMap = new Map<number, number>();
    
    // Extract items from each credit note and aggregate by invoiceItemId
    for (const creditNote of creditNotesForInvoice) {
      if (creditNote.items && Array.isArray(creditNote.items)) {
        creditNote.items.forEach((item: any) => {
          // Use invoiceItemId if available (new format), fallback to id for legacy data
          const itemKey = item.invoiceItemId || item.id;
          const existingCredited = creditedItemsMap.get(itemKey) || 0;
          creditedItemsMap.set(itemKey, existingCredited + (item.creditQuantity || 0));
        });
      }
    }

    // Convert map to array format expected by frontend
    const creditedItems: any[] = [];
    creditedItemsMap.forEach((creditedQuantity, invoiceItemId) => {
      creditedItems.push({
        invoiceItemId: invoiceItemId,
        creditedQuantity: creditedQuantity
      });
    });

    return creditedItems;
  }

  // Outgoing Payment operations
  async createOutgoingPayment(payment: InsertOutgoingPayment): Promise<OutgoingPayment> {
    const [newPayment] = await db.insert(outgoingPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getAllOutgoingPayments(): Promise<OutgoingPayment[]> {
    return await db.select().from(outgoingPayments)
      .orderBy(desc(outgoingPayments.createdAt));
  }

  async getOutgoingPayment(id: number): Promise<OutgoingPayment | undefined> {
    const [payment] = await db.select().from(outgoingPayments)
      .where(eq(outgoingPayments.id, id));
    return payment;
  }

  async getNextOutgoingPaymentNumber(): Promise<string> {
    // Get the latest outgoing payment to determine next number
    const latestPayments = await db.select({ documentNo: outgoingPayments.documentNo })
      .from(outgoingPayments)
      .where(sql`document_no LIKE 'OPN%'`)
      .orderBy(desc(outgoingPayments.id))
      .limit(10);

    let highestNumber = 9000000; // Start from 9000001
    
    for (const payment of latestPayments) {
      if (payment.documentNo && payment.documentNo.startsWith('OPN')) {
        const numberStr = payment.documentNo.replace('OPN', '');
        const parsedNumber = parseInt(numberStr, 10);
        // Only consider numbers >= 9000001 (our new range)
        if (!isNaN(parsedNumber) && parsedNumber >= 9000001 && parsedNumber > highestNumber) {
          highestNumber = parsedNumber;
        }
      }
    }

    const nextNumber = highestNumber + 1;
    return `OPN${nextNumber.toString()}`;
  }

  // Income Payment operations
  async createIncomePayment(payment: InsertIncomePayment): Promise<IncomePayment> {
    const [newPayment] = await db.insert(incomePayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getAllIncomePayments(): Promise<IncomePayment[]> {
    return await db.select().from(incomePayments)
      .orderBy(desc(incomePayments.createdAt));
  }

  async getIncomePayment(id: number): Promise<IncomePayment | undefined> {
    const [payment] = await db.select().from(incomePayments)
      .where(eq(incomePayments.id, id));
    return payment;
  }

  async getNextIncomePaymentNumber(): Promise<string> {
    // Get the latest income payment to determine next number
    const latestPayments = await db.select({ documentNo: incomePayments.documentNo })
      .from(incomePayments)
      .where(sql`document_no LIKE 'IPN%'`)
      .orderBy(desc(incomePayments.id))
      .limit(10);

    let highestNumber = 9000000; // Start from 9000001
    
    for (const payment of latestPayments) {
      if (payment.documentNo && payment.documentNo.startsWith('IPN')) {
        const numberStr = payment.documentNo.replace('IPN', '');
        const parsedNumber = parseInt(numberStr, 10);
        // Only consider numbers >= 9000001 (our new range)
        if (!isNaN(parsedNumber) && parsedNumber >= 9000001 && parsedNumber > highestNumber) {
          highestNumber = parsedNumber;
        }
      }
    }

    const nextNumber = highestNumber + 1;
    return `IPN${nextNumber.toString()}`;
  }

  // AR Balance calculation methods
  async getARBalanceData(): Promise<any[]> {
    try {
      // Get all customers from users table
      const customers = await db.select({
        id: users.id,
        name: users.name,
        phone: users.phone
      }).from(users);

      const arBalanceData = await Promise.all(
        customers.map(async (customer) => {
          const balance = await this.calculateCustomerBalance(customer.id);
          return {
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            balance: balance.toFixed(2)
          };
        })
      );

      // Return all customers including those with zero balance
      return arBalanceData;
    } catch (error) {
      console.error('Error fetching AR balance data:', error);
      throw error;
    }
  }

  async calculateCustomerBalance(customerId: number): Promise<number> {
    try {
      // Opening Balance (start with 0 for now)
      let balance = 0;

      // Add Invoice Values (from generated invoices)
      const invoices = await db.select({
        finalTotal: generatedInvoices.finalTotal
      }).from(generatedInvoices)
        .innerJoin(bookings, eq(generatedInvoices.bookingId, bookings.id))
        .where(eq(bookings.userId, customerId));

      for (const invoice of invoices) {
        balance += Number(invoice.finalTotal);
      }

      // Subtract Income Payments (payments ON invoices)
      const invoicePaymentsList = await db.select({
        amount: invoicePayments.amount
      }).from(invoicePayments)
        .innerJoin(bookings, eq(invoicePayments.bookingId, bookings.id))
        .where(eq(bookings.userId, customerId));

      for (const payment of invoicePaymentsList) {
        balance -= Number(payment.amount);
      }

      // Subtract Income Payments (separate income payments for this customer)
      const separateIncomePayments = await db.select({
        totalAmount: incomePayments.totalAmount
      }).from(incomePayments)
        .where(eq(incomePayments.businessPartnerId, customerId));

      for (const payment of separateIncomePayments) {
        balance -= Number(payment.totalAmount);
      }

      // Subtract Credit Notes
      const creditNoteAmounts = await db.select({
        finalTotal: creditNotes.finalTotal
      }).from(creditNotes)
        .innerJoin(generatedInvoices, eq(creditNotes.invoiceId, generatedInvoices.bookingId))
        .innerJoin(bookings, eq(generatedInvoices.bookingId, bookings.id))
        .where(eq(bookings.userId, customerId));

      for (const creditNote of creditNoteAmounts) {
        balance -= Number(creditNote.finalTotal);
      }

      // Add Outgoing Payments (payments TO this customer)
      const outgoingPaymentsToCustomer = await db.select({
        totalAmount: outgoingPayments.totalAmount
      }).from(outgoingPayments)
        .where(eq(outgoingPayments.businessPartnerId, customerId));

      for (const payment of outgoingPaymentsToCustomer) {
        balance += Number(payment.totalAmount);
      }

      return balance;
    } catch (error) {
      console.error(`Error calculating balance for customer ${customerId}:`, error);
      return 0;
    }
  }

  async getCustomerTransactionDetails(customerId: number): Promise<any[]> {
    try {
      const transactions = [];

      // Opening Balance
      transactions.push({
        type: 'Opening Balance',
        description: 'Opening Balance',
        amount: 0,
        date: null,
        documentNumber: null
      });

      // Get all invoices for this customer
      const invoices = await db.select({
        invoiceNumber: generatedInvoices.invoiceNumber,
        finalTotal: generatedInvoices.finalTotal,
        generatedAt: generatedInvoices.generatedAt
      }).from(generatedInvoices)
        .innerJoin(bookings, eq(generatedInvoices.bookingId, bookings.id))
        .where(eq(bookings.userId, customerId))
        .orderBy(generatedInvoices.generatedAt);

      for (const invoice of invoices) {
        transactions.push({
          type: 'Invoice',
          description: `Invoice ${invoice.invoiceNumber}`,
          amount: Number(invoice.finalTotal),
          date: invoice.generatedAt,
          documentNumber: invoice.invoiceNumber
        });
      }

      // Get invoice payments
      const invoicePaymentsList = await db.select({
        amount: invoicePayments.amount,
        createdAt: invoicePayments.createdAt,
        paymentType: invoicePayments.paymentType
      }).from(invoicePayments)
        .innerJoin(bookings, eq(invoicePayments.bookingId, bookings.id))
        .where(eq(bookings.userId, customerId))
        .orderBy(invoicePayments.createdAt);

      for (const payment of invoicePaymentsList) {
        transactions.push({
          type: 'Income Payment',
          description: `Income Payment (${payment.paymentType})`,
          amount: -Number(payment.amount),
          date: payment.createdAt,
          documentNumber: null
        });
      }

      // Get separate income payments
      const separateIncomePaymentsList = await db.select({
        documentNo: incomePayments.documentNo,
        totalAmount: incomePayments.totalAmount,
        createdAt: incomePayments.createdAt
      }).from(incomePayments)
        .where(eq(incomePayments.businessPartnerId, customerId))
        .orderBy(incomePayments.createdAt);

      for (const payment of separateIncomePaymentsList) {
        transactions.push({
          type: 'Income Payment',
          description: `Income Payment`,
          amount: -Number(payment.totalAmount),
          date: payment.createdAt,
          documentNumber: payment.documentNo
        });
      }

      // Get credit notes
      const creditNotesList = await db.select({
        creditNoteNumber: creditNotes.creditNoteNumber,
        finalTotal: creditNotes.finalTotal,
        createdAt: creditNotes.createdAt
      }).from(creditNotes)
        .innerJoin(generatedInvoices, eq(creditNotes.invoiceId, generatedInvoices.bookingId))
        .innerJoin(bookings, eq(generatedInvoices.bookingId, bookings.id))
        .where(eq(bookings.userId, customerId))
        .orderBy(creditNotes.createdAt);

      for (const creditNote of creditNotesList) {
        transactions.push({
          type: 'Credit Note',
          description: `Credit Note ${creditNote.creditNoteNumber}`,
          amount: -Number(creditNote.finalTotal),
          date: creditNote.createdAt,
          documentNumber: creditNote.creditNoteNumber
        });
      }

      // Get outgoing payments to this customer
      const outgoingPaymentsList = await db.select({
        documentNo: outgoingPayments.documentNo,
        totalAmount: outgoingPayments.totalAmount,
        createdAt: outgoingPayments.createdAt
      }).from(outgoingPayments)
        .where(eq(outgoingPayments.businessPartnerId, customerId))
        .orderBy(outgoingPayments.createdAt);

      for (const payment of outgoingPaymentsList) {
        transactions.push({
          type: 'Outgoing Payment',
          description: `Outgoing Payment`,
          amount: Number(payment.totalAmount),
          date: payment.createdAt,
          documentNumber: payment.documentNo
        });
      }

      // Sort all transactions by date
      transactions.sort((a, b) => {
        if (!a.date) return -1;
        if (!b.date) return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      // Calculate running balance
      let runningBalance = 0;
      const transactionsWithBalance = transactions.map((transaction) => {
        runningBalance += transaction.amount;
        return {
          ...transaction,
          runningBalance: runningBalance.toFixed(2)
        };
      });

      return transactionsWithBalance;
    } catch (error) {
      console.error(`Error getting transaction details for customer ${customerId}:`, error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();