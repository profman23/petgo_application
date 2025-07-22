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
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  vetsvanCode: text("vetsvan_code").notNull(),
  vetsvanName: text("vetsvan_name").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
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

export const loginSchema = z.object({
  identifier: z.string().min(1, "رقم الهاتف أو الإيميل مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب (حد أدنى حرفين)"),
  lastName: z.string().min(2, "الاسم الثاني مطلوب (حد أدنى حرفين)"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string()
    .regex(/^05\d{8}$/, "رقم الهاتف يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  captcha: z.string().min(1, "يرجى إدخال رمز التحقق"),
});

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
