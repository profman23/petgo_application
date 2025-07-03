import { users, drivers, rides, patients, admins, shifts, type User, type Driver, type Ride, type InsertUser, type RideRequest, type Patient, type InsertPatient, type Admin, type InsertDriver, type Shift, type InsertShift } from "@shared/schema";
import { db } from "./db";
import { eq, and, not, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  
  // Driver operations
  getAllDrivers(): Promise<Driver[]>;
  getAvailableDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
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

      // Initialize drivers
      await this.initializeDrivers();
    } catch (error) {
      console.error('Error initializing test data:', error);
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

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
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
    // First get driver details to find associated doctor account
    const driver = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    
    if (driver.length > 0) {
      const driverData = driver[0];
      // Delete associated doctor user account using vetsvanCode as username
      await db.delete(users).where(eq(users.username, driverData.vetsvanCode));
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
}

export const storage = new DatabaseStorage();