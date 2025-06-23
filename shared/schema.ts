import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  petName: text("pet_name").notNull(),
  petType: text("pet_type").notNull(), // كلب، قطة، طير
  membershipType: text("membership_type").notNull().default("bronze"),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  rating: real("rating").notNull().default(4.5),
  carModel: text("car_model").notNull(),
  carColor: text("car_color").notNull(),
  plateNumber: text("plate_number").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  profileImageUrl: text("profile_image_url"),
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

export const insertUserSchema = createInsertSchema(users).pick({
  phone: true,
  password: true,
  name: true,
});

export const loginSchema = z.object({
  phone: z.string().min(1, "رقم الهاتف أو اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب (حد أدنى حرفين)"),
  lastName: z.string().min(2, "الاسم الثاني مطلوب (حد أدنى حرفين)"),
  petName: z.string().min(2, "اسم الأليف مطلوب (حد أدنى حرفين)"),
  petType: z.enum(["كلب", "قطة", "طير"], {
    errorMap: () => ({ message: "يرجى اختيار نوع الأليف" })
  }),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerSchema>;
export type User = typeof users.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof rideRequestSchema>;
export type RideRequest = typeof rides.$inferInsert;
