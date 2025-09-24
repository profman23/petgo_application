import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb, numeric, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  petName: text("pet_name"),
  petType: text("pet_type"), // كلب، قطة، طير
  address: text("address"),
  birthdate: text("birthdate"),
  membershipType: text("membership_type").notNull().default("bronze"),
  active: boolean("active").notNull().default(true), // For soft delete - all existing users remain active
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  vetsvanCode: text("vetsvan_code").notNull(),
  vetsvanName: text("vetsvan_name").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  rating: real("rating").notNull().default(4.5),
  carModel: text("car_model").notNull().default("Mercedes Sprinter"),
  carColor: text("car_color").notNull().default("أبيض"),
  plateNumber: text("plate_number").notNull().default("ABC-123"),
  latitude: real("latitude").default(24.7136),
  longitude: real("longitude").default(46.6753),
  isAvailable: boolean("is_available").notNull().default(true),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  driverId: integer("driver_id"),
  pickupLocation: text("pickup_location").notNull(),
  destination: text("destination").notNull(),
  pickupLatitude: real("pickup_latitude").notNull(),
  pickupLongitude: real("pickup_longitude").notNull(),
  destinationLatitude: real("destination_latitude"),
  destinationLongitude: real("destination_longitude"),
  estimatedDistance: real("estimated_distance"),
  estimatedTime: integer("estimated_time"), // in minutes
  estimatedCost: real("estimated_cost"),
  status: text("status").notNull().default("requested"), // requested, processing, confirmed, enroute, arrived, completed, cancelled
  vehicleType: text("vehicle_type").notNull().default("standard"), // standard, premium
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP verification table for email confirmation
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  userData: jsonb("user_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // Cat, Dog, Bird
  patientWeight: real("patient_weight"),
  ageYear: integer("age_year"),
  ageMonth: integer("age_month"),
  ageDay: integer("age_day"),
  photo: text("photo"),
  condition: text("condition"),
  birthdate: text("birthdate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  phone: true,
  password: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  address: true,
  birthdate: true,
  membershipType: true,
});

// Dynamic login schema based on language
export const createLoginSchema = (language: string = 'en') => {
  const messages: Record<string, any> = {
    ar: {
      identifierRequired: "رقم الهاتف أو الإيميل مطلوب",
      passwordRequired: "كلمة المرور مطلوبة"
    },
    en: {
      identifierRequired: "Phone number or email is required",
      passwordRequired: "Password is required"
    }
  };
  
  const msg = messages[language] || messages.en;
  
  return z.object({
    identifier: z.string().min(1, msg.identifierRequired),
    password: z.string().min(1, msg.passwordRequired),
  });
};

// Default login schema for backward compatibility
export const loginSchema = createLoginSchema('en');

// Dynamic register schema based on language  
export const createRegisterSchema = (language: string = 'en') => {
  const messages: Record<string, any> = {
    ar: {
      firstNameRequired: "الاسم الأول مطلوب (حد أدنى حرفين)",
      lastNameRequired: "الاسم الثاني مطلوب (حد أدنى حرفين)", 
      emailInvalid: "البريد الإلكتروني غير صحيح",
      phoneInvalid: "رقم الهاتف يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام",
      passwordTooShort: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      captchaRequired: "يرجى إدخال رمز التحقق"
    },
    en: {
      firstNameRequired: "First name is required (minimum 2 characters)",
      lastNameRequired: "Last name is required (minimum 2 characters)",
      emailInvalid: "Invalid email address", 
      phoneInvalid: "Phone number must start with 05 and contain 10 digits",
      passwordTooShort: "Password must be at least 6 characters long",
      captchaRequired: "Please enter verification code"
    }
  };
  
  const msg = messages[language] || messages.en;
  
  return z.object({
    firstName: z.string().min(2, msg.firstNameRequired),
    lastName: z.string().min(2, msg.lastNameRequired),
    email: z.string().email(msg.emailInvalid),
    phone: z.string().regex(/^05\d{8}$/, msg.phoneInvalid),
    password: z.string().min(6, msg.passwordTooShort),
    captcha: z.string().min(1, msg.captchaRequired),
  });
};

// Default register schema for backward compatibility
export const registerSchema = createRegisterSchema('en');

// OTP verification schema
export const otpVerificationSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  otpCode: z.string().length(6, "رمز التحقق يجب أن يحتوي على 6 أرقام"),
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).pick({
  email: true,
  code: true,
  expiresAt: true,
  userData: true,
});

export const rideRequestSchema = createInsertSchema(rides).pick({
  pickupLocation: true,
  destination: true,
  pickupLatitude: true,
  pickupLongitude: true,
  destinationLatitude: true,
  destinationLongitude: true,
  vehicleType: true,
});

export const insertPatientSchema = createInsertSchema(patients).pick({
  name: true,
  type: true,
  patientWeight: true,
  ageYear: true,
  ageMonth: true,
  ageDay: true,
  photo: true,
  userId: true,
});

export const insertDriverSchema = createInsertSchema(drivers).pick({
  vetsvanCode: true,
  vetsvanName: true,
  name: true,
  phone: true,
  username: true,
  password: true,
  rating: true,
  carModel: true,
  carColor: true,
  plateNumber: true,
  latitude: true,
  longitude: true,
  isAvailable: true,
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerSchema>;
export type User = typeof users.$inferSelect;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type OtpVerificationRequest = z.infer<typeof otpVerificationSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof rideRequestSchema>;
export type RideRequest = typeof rides.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

// Shifts table
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  vetsVanId: integer("vets_van_id").notNull().references(() => drivers.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  duration: integer("duration").notNull(), // duration in hours
  status: text("status").default("scheduled").notNull(), // 'scheduled', 'active', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shifts).pick({
  vetsVanId: true,
  date: true,
  startTime: true,
  endTime: true,
  duration: true,
  status: true,
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

// Bookings table for appointments
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  shiftId: integer("shift_id").notNull().references(() => shifts.id),
  vetsVanId: integer("vets_van_id").notNull().references(() => drivers.id),
  appointmentDate: text("appointment_date").notNull(), // YYYY-MM-DD format
  appointmentTime: text("appointment_time").notNull(), // HH:MM format
  status: text("status").default("pending_review").notNull(), // 'pending_review', 'confirmed', 'in_progress', 'completed', 'cancelled'
  customerLocation: jsonb("customer_location").$type<{
    latitude: number;
    longitude: number;
    address?: string;
  }>(),
  selectedPets: jsonb("selected_pets").$type<Array<{
    id: number;
    name: string;
    type: string;
    ageYear?: number;
    ageMonth?: number;
    ageDay?: number;
  }>>(),
  serviceType: text("service_type").default("General Check Up"),
  // Payment fields removed per user request
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  shiftId: true,
  vetsVanId: true,
  appointmentDate: true,
  appointmentTime: true,
  status: true,
  customerLocation: true,
  selectedPets: true,
  serviceType: true,
  // Payment fields removed
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Reviews table for service ratings
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  bookingId: true,
  userId: true,
  rating: true,
  comment: true,
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Pet vitals table for storing vital signs recorded by doctors
export const petVitals = pgTable("pet_vitals", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  petId: integer("pet_id").references(() => patients.id).notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }), // in KG
  temperature: decimal("temperature", { precision: 4, scale: 1 }), // in Celsius  
  heartRate: integer("heart_rate"), // beats per minute
  notes: text("notes"), // additional notes from doctor
  // Summary section fields
  consultationDate: text("consultation_date"),
  // Subjective section fields
  reasonForVisit: text("reason_for_visit"),
  initialComplaintNotes: text("initial_complaint_notes"),
  // Objective section additional fields
  bodyCondition: text("body_condition"),
  bodyConditionScore: text("body_condition_score"),
  respiratoryFrequency: integer("respiratory_frequency"), // breaths per minute
  muscleConditionScore: text("muscle_condition_score"),
  painScore: text("pain_score"), // 0-4 scale
  hydrationStatus: text("hydration_status"),
  attitude: text("attitude"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  recordedBy: varchar("recorded_by").notNull(), // doctor's username/id
});

export const insertPetVitalSchema = createInsertSchema(petVitals).pick({
  bookingId: true,
  petId: true,
  weight: true,
  temperature: true,
  heartRate: true,
  notes: true,
  consultationDate: true,
  reasonForVisit: true,
  initialComplaintNotes: true,
  bodyCondition: true,
  bodyConditionScore: true,
  respiratoryFrequency: true,
  muscleConditionScore: true,
  painScore: true,
  hydrationStatus: true,
  attitude: true,
  recordedBy: true,
});

export type PetVital = typeof petVitals.$inferSelect;

// Pet Attachments table
export const petAttachments = pgTable("pet_attachments", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => patients.id),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(), // doctor ID
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  description: text("description"),
});

export const insertPetAttachmentSchema = createInsertSchema(petAttachments).pick({
  petId: true,
  bookingId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  fileUrl: true,
  uploadedBy: true,
  description: true,
});

export type PetAttachment = typeof petAttachments.$inferSelect;
export type InsertPetAttachment = typeof petAttachments.$inferInsert;
export type InsertPetVital = z.infer<typeof insertPetVitalSchema>;

// Invoice Items table for storing saved invoice items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  discountType: text("discount_type").default("none").notNull(), // 'none', 'percentage' or 'amount'
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("15.00").notNull(), // 15% VAT
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  totalBeforeVat: decimal("total_before_vat", { precision: 10, scale: 2 }).notNull(),
  totalAfterVat: decimal("total_after_vat", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(), // Keep for backward compatibility
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).pick({
  bookingId: true,
  description: true,
  quantity: true,
  unitPrice: true,
  discount: true,
  discountType: true,
  vatRate: true,
  vatAmount: true,
  totalBeforeVat: true,
  totalAfterVat: true,
  total: true,
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

// Invoice Status table to track if invoice is generated
export const invoiceStatus = pgTable("invoice_status", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull().unique(),
  isGenerated: boolean("is_generated").notNull().default(false),
  generatedAt: timestamp("generated_at"),
  generatedBy: varchar("generated_by").notNull(), // doctor ID
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  finalTotal: decimal("final_total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceStatusSchema = createInsertSchema(invoiceStatus).pick({
  bookingId: true,
  isGenerated: true,
  generatedBy: true,
  notes: true,
  subtotal: true,
  taxAmount: true,
  discountAmount: true,
  finalTotal: true,
});

export type InvoiceStatus = typeof invoiceStatus.$inferSelect;
export type InsertInvoiceStatus = z.infer<typeof insertInvoiceStatusSchema>;

// Invoice Payments table
export const invoicePayments = pgTable("invoice_payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: varchar("payment_type", { length: 50 }).notNull(), // cash, card, transfer
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoicePaymentSchema = createInsertSchema(invoicePayments).omit({
  id: true,
  createdAt: true,
});

export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type InsertInvoicePayment = z.infer<typeof insertInvoicePaymentSchema>;

// Payment Transactions table for MyFatoorah integration
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  paymentId: text("payment_id"), // MyFatoorah Payment ID
  invoiceReference: text("invoice_reference"), // MyFatoorah Invoice Reference
  paymentReference: text("payment_reference"), // MyFatoorah Payment Reference
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("SAR"), // Saudi Riyal for KSA
  status: text("status").notNull().default("pending"), // pending, paid, failed, cancelled, refunded
  paymentMethod: text("payment_method"), // MADA, VISA, ApplePay, STCPay, etc.
  gatewayResponse: jsonb("gateway_response"), // Full response from MyFatoorah
  paymentUrl: text("payment_url"), // Payment link from MyFatoorah
  customerReference: text("customer_reference"), // Customer reference for tracking
  errorMessage: text("error_message"), // Error details if payment fails
  paidAt: timestamp("paid_at"), // When payment was completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type SelectPaymentTransaction = typeof paymentTransactions.$inferSelect;

// Sessions table for production persistence
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userType: text("user_type").notNull().default("customer"), // customer, doctor, admin
  userData: jsonb("user_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

export const insertSessionSchema = createInsertSchema(userSessions).pick({
  id: true,
  userId: true,
  userType: true,
  userData: true,
  expiresAt: true,
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertSessionSchema>;

// Products and Services tables for import system
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  categoryAr: varchar("category_ar", { length: 100 }),
  sku: varchar("sku", { length: 50 }),
  unit: varchar("unit", { length: 50 }),
  unitAr: varchar("unit_ar", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  categoryAr: varchar("category_ar", { length: 100 }),
  duration: integer("duration"), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const importHistory = pgTable("import_history", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(), // products or services
  recordsImported: integer("records_imported").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  status: varchar("status", { length: 50 }).default("completed"), // completed, failed, partial
  errorMessage: text("error_message"),
  importedBy: varchar("imported_by", { length: 255 }),
  importedAt: timestamp("imported_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  price: true,
  category: true,
  categoryAr: true,
  sku: true,
  unit: true,
  unitAr: true,
  isActive: true,
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  price: true,
  category: true,
  categoryAr: true,
  duration: true,
  isActive: true,
});

export const insertImportHistorySchema = createInsertSchema(importHistory).pick({
  fileName: true,
  fileType: true,
  recordsImported: true,
  recordsUpdated: true,
  recordsSkipped: true,
  status: true,
  errorMessage: true,
  importedBy: true,
});

// Generated Invoices table for permanent storage
export const generatedInvoices = pgTable("generated_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(), // Vets9000001, Vets9000002, etc.
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  
  // Customer details (snapshot at time of invoice generation)
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  
  // Doctor/VetsVan details
  doctorName: varchar("doctor_name", { length: 255 }).notNull(),
  vetsVanCode: varchar("vets_van_code", { length: 50 }).notNull(),
  
  // Appointment details
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  serviceType: varchar("service_type", { length: 255 }),
  
  // Pet details (snapshot)
  pets: jsonb("pets").$type<Array<{
    id: number;
    name: string;
    type: string;
    ageYear?: number;
    ageMonth?: number;
    ageDay?: number;
  }>>(),
  
  // Invoice items (snapshot)
  items: jsonb("items").$type<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: string;
    vatRate: number;
    vatAmount: number;
    totalBeforeVat: number;
    totalAfterVat: number;
    total: number;
  }>>(),
  
  // Financial totals
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  totalDiscountAmount: decimal("total_discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(), // 15% VAT
  finalTotal: decimal("final_total", { precision: 10, scale: 2 }).notNull(),
  
  // Additional info
  notes: text("notes"),
  
  // Audit trail
  generatedBy: integer("generated_by").notNull().references(() => drivers.id), // Which doctor generated
  generatedAt: timestamp("generated_at").defaultNow(),
  isEmailSent: boolean("is_email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGeneratedInvoiceSchema = createInsertSchema(generatedInvoices).pick({
  invoiceNumber: true,
  bookingId: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  doctorName: true,
  vetsVanCode: true,
  appointmentDate: true,
  appointmentTime: true,
  serviceType: true,
  pets: true,
  items: true,
  subtotal: true,
  totalDiscountAmount: true,
  vatAmount: true,
  finalTotal: true,
  notes: true,
  generatedBy: true,
  isEmailSent: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type ImportHistory = typeof importHistory.$inferSelect;
export type InsertImportHistory = z.infer<typeof insertImportHistorySchema>;
export type GeneratedInvoice = typeof generatedInvoices.$inferSelect & {
  totalPaid?: string;
  payments?: InvoicePayment[];
};
export type InsertGeneratedInvoice = z.infer<typeof insertGeneratedInvoiceSchema>;

// Authorizations table for permission management
export const authorizations = pgTable("authorizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  
  // Users permissions
  usersHidden: boolean("users_hidden").notNull().default(false),
  usersRead: boolean("users_read").notNull().default(false),
  usersFullControl: boolean("users_full_control").notNull().default(false),
  
  // Authorization permissions
  authHidden: boolean("auth_hidden").notNull().default(false),
  authRead: boolean("auth_read").notNull().default(false),
  authFullControl: boolean("auth_full_control").notNull().default(false),
  
  // Vets Van Management permissions
  vetsVanHidden: boolean("vets_van_hidden").notNull().default(false),
  vetsVanRead: boolean("vets_van_read").notNull().default(false),
  vetsVanFullControl: boolean("vets_van_full_control").notNull().default(false),
  
  // Vets Van Shifts permissions
  vetsVanShiftsHidden: boolean("vets_van_shifts_hidden").notNull().default(true),
  vetsVanShiftsRead: boolean("vets_van_shifts_read").notNull().default(false),
  vetsVanShiftsFullControl: boolean("vets_van_shifts_full_control").notNull().default(false),
  
  // Import permissions
  importHidden: boolean("import_hidden").notNull().default(false),
  importFullControl: boolean("import_full_control").notNull().default(false),
  
  // Services permissions
  servicesHidden: boolean("services_hidden").notNull().default(false),
  servicesRead: boolean("services_read").notNull().default(false),
  servicesFullControl: boolean("services_full_control").notNull().default(false),
  
  // Products permissions
  productsHidden: boolean("products_hidden").notNull().default(false),
  productsRead: boolean("products_read").notNull().default(false),
  productsFullControl: boolean("products_full_control").notNull().default(false),
  
  // Credit Note permissions
  creditNoteNoPermission: boolean("credit_note_no_permission").notNull().default(false),
  creditNoteRead: boolean("credit_note_read").notNull().default(false),
  creditNoteFullControl: boolean("credit_note_full_control").notNull().default(false),
  creditNoteExport: boolean("credit_note_export").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table for user management
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  authorizationId: integer("authorization_id").notNull().references(() => authorizations.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAuthorizationSchema = createInsertSchema(authorizations).pick({
  name: true,
  usersHidden: true,
  usersRead: true,
  usersFullControl: true,
  authHidden: true,
  authRead: true,
  authFullControl: true,
  vetsVanHidden: true,
  vetsVanRead: true,
  vetsVanFullControl: true,
  vetsVanShiftsHidden: true,
  vetsVanShiftsRead: true,
  vetsVanShiftsFullControl: true,
  importHidden: true,
  importFullControl: true,
  servicesHidden: true,
  servicesRead: true,
  servicesFullControl: true,
  productsHidden: true,
  productsRead: true,
  productsFullControl: true,
  creditNoteNoPermission: true,
  creditNoteRead: true,
  creditNoteFullControl: true,
  creditNoteExport: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  firstName: true,
  lastName: true,
  email: true,
  username: true,
  password: true,
  authorizationId: true,
  isActive: true,
});

export type Authorization = typeof authorizations.$inferSelect;
export type InsertAuthorization = z.infer<typeof insertAuthorizationSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

// Red zones table - circular areas where ride requests are restricted
export const redZones = pgTable("red_zones", {
  id: serial("id").primaryKey(),
  vetsvanId: integer("vetsvan_id").notNull().references(() => drivers.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  radius: integer("radius").notNull().default(1000), // radius in meters
  name: text("name"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Red zones schemas
export const insertRedZoneSchema = createInsertSchema(redZones).pick({
  vetsvanId: true,
  latitude: true,
  longitude: true,
  radius: true,
  name: true,
  description: true,
});

// Type exports for red zones
export type RedZone = typeof redZones.$inferSelect;
export type InsertRedZone = z.infer<typeof insertRedZoneSchema>;

// Credit Notes table
export const creditNotes = pgTable("credit_notes", {
  id: serial("id").primaryKey(),
  creditNoteNumber: varchar("credit_note_number", { length: 50 }).notNull().unique(),
  invoiceId: integer("invoice_id").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  appointmentDate: text("appointment_date").notNull(),
  postingDate: text("posting_date").notNull(),
  items: jsonb("items").$type<Array<{
    id: number;
    invoiceItemId?: number; // Link to original invoice_items.id for proper filtering
    description: string;
    originalQuantity: number;
    creditQuantity: number;
    unitPrice: number;
    totalBeforeVat: number;
    vatAmount: number;
    totalAfterVat: number;
  }>>().notNull(),
  totalBeforeVat: decimal("total_before_vat", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  finalTotal: decimal("final_total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('Closed'),
  createdBy: varchar("created_by", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreditNoteSchema = createInsertSchema(creditNotes).pick({
  creditNoteNumber: true,
  invoiceId: true,
  invoiceNumber: true,
  customerName: true,
  appointmentDate: true,
  postingDate: true,
  items: true,
  totalBeforeVat: true,
  vatAmount: true,
  finalTotal: true,
  status: true,
  createdBy: true,
});

export type CreditNote = typeof creditNotes.$inferSelect;
export type InsertCreditNote = z.infer<typeof insertCreditNoteSchema>;

// Outgoing Payments table (for expenses, supplier payments, etc.)
export const outgoingPayments = pgTable("outgoing_payments", {
  id: serial("id").primaryKey(),
  docnum: varchar("docnum", { length: 50 }).notNull(), // OPN9000001 format
  businessPartnerType: varchar("business_partner_type", { length: 20 }).notNull(), // "customer" or "supplier"
  businessPartnerId: integer("business_partner_id"), // Reference to customer/supplier ID
  businessPartnerName: varchar("business_partner_name", { length: 255 }),
  businessPartnerPhone: varchar("business_partner_phone", { length: 20 }),
  postingDate: text("posting_date").notNull(), // YYYY-MM-DD format
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // "outgoing" 
  documentNo: varchar("document_no", { length: 50 }).notNull(), // OPN9000001 format
  paymentMethods: jsonb("payment_methods").$type<{
    cash: { checked: boolean; amount: number };
    card: { checked: boolean; amount: number };
    bank: { checked: boolean; amount: number };
  }>().notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Income Payments table (for revenue, customer payments, etc.)
export const incomePayments = pgTable("income_payments", {
  id: serial("id").primaryKey(),
  docnum: varchar("docnum", { length: 50 }).notNull(), // IPN9000001 format
  businessPartnerType: varchar("business_partner_type", { length: 20 }).notNull(), // "customer" or "supplier"
  businessPartnerId: integer("business_partner_id"), // Reference to customer/supplier ID
  businessPartnerName: varchar("business_partner_name", { length: 255 }),
  businessPartnerPhone: varchar("business_partner_phone", { length: 20 }),
  postingDate: text("posting_date").notNull(), // YYYY-MM-DD format
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // "income"
  documentNo: varchar("document_no", { length: 50 }).notNull(), // IPN9000001 format
  paymentMethods: jsonb("payment_methods").$type<{
    cash: { checked: boolean; amount: number };
    card: { checked: boolean; amount: number };
    bank: { checked: boolean; amount: number };
  }>().notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOutgoingPaymentSchema = createInsertSchema(outgoingPayments).pick({
  docnum: true,
  businessPartnerType: true,
  businessPartnerId: true,
  businessPartnerName: true,
  businessPartnerPhone: true,
  postingDate: true,
  transactionType: true,
  documentNo: true,
  paymentMethods: true,
  totalAmount: true,
});

export const insertIncomePaymentSchema = createInsertSchema(incomePayments).pick({
  docnum: true,
  businessPartnerType: true,
  businessPartnerId: true,
  businessPartnerName: true,
  businessPartnerPhone: true,
  postingDate: true,
  transactionType: true,
  documentNo: true,
  paymentMethods: true,
  totalAmount: true,
});

export type OutgoingPayment = typeof outgoingPayments.$inferSelect;
export type IncomePayment = typeof incomePayments.$inferSelect;
export type InsertOutgoingPayment = z.infer<typeof insertOutgoingPaymentSchema>;
export type InsertIncomePayment = z.infer<typeof insertIncomePaymentSchema>;
