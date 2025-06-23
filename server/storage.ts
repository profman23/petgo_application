import { users, drivers, rides, type User, type Driver, type Ride, type InsertUser, type RideRequest } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize test data on first run
    this.initializeTestData();
  }

  private async initializeTestData() {
    try {
      // Check if test user exists
      const existingUser = await this.getUserByPhone('0501234567');
      if (!existingUser) {
        await this.createUser({
          phone: '0501234567',
          password: '123456',
          name: 'مستخدم تجريبي',
          firstName: 'مستخدم',
          lastName: 'تجريبي',
          petName: 'فيلو',
          petType: 'كلب',
          membershipType: 'standard'
        });
      }

      // Check if test doctor exists
      const existingDoctor = await this.getUserByPhone('vetsvan1');
      if (!existingDoctor) {
        await this.createUser({
          phone: 'vetsvan1',
          password: '123456',
          name: 'د. أحمد البيطري',
          firstName: 'د. أحمد',
          lastName: 'البيطري',
          petName: '',
          petType: 'كلب',
          membershipType: 'doctor'
        });
      }

      // Initialize test drivers in database
      await this.initializeDrivers();
    } catch (error) {
      console.log('Test data initialization skipped:', error.message);
    }
  }

  private async initializeDrivers() {
    try {
      const existingDrivers = await db.select().from(drivers);
      if (existingDrivers.length === 0) {
        const testDrivers = [
          {
            name: 'د. محمد العلي',
            phone: '0501234568',
            rating: 4.8,
            carModel: 'تويوتا كامري 2023',
            carColor: 'أبيض',
            plateNumber: 'أ ب ج 1234',
            latitude: 24.7136,
            longitude: 46.6753,
            isAvailable: true,
            profileImageUrl: null,
          },
          {
            name: 'د. فاطمة الأحمد',
            phone: '0501234569',
            rating: 4.9,
            carModel: 'هوندا أكورد 2022',
            carColor: 'أزرق',
            plateNumber: 'د هـ و 5678',
            latitude: 24.7236,
            longitude: 46.6853,
            isAvailable: true,
            profileImageUrl: null,
          },
          {
            name: 'د. خالد المحمد',
            phone: '0501234570',
            rating: 4.7,
            carModel: 'نيسان التيما 2021',
            carColor: 'أسود',
            plateNumber: 'ز ح ط 9012',
            latitude: 24.7036,
            longitude: 46.6653,
            isAvailable: true,
            profileImageUrl: null,
          }
        ];

        for (const driver of testDrivers) {
          await db.insert(drivers).values(driver);
        }
      }
    } catch (error) {
      console.log('Driver initialization skipped:', error.message);
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

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
    const [ride] = await db
      .insert(rides)
      .values({
        ...rideData,
        status: 'requested',
        vehicleType: rideData.vehicleType || 'standard',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
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
      .set({ status, updatedAt: new Date() })
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
      .where(eq(rides.customerId, userId));
    
    if (ride && !['completed', 'cancelled'].includes(ride.status)) {
      return ride;
    }
    return undefined;
  }

  async getDriverActiveRide(driverId: number): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(eq(rides.driverId, driverId));
    
    if (ride && !['completed', 'cancelled'].includes(ride.status)) {
      return ride;
    }
    return undefined;
  }
}

export const storage = new DatabaseStorage();