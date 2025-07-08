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
