import { users, drivers, rides, type User, type Driver, type Ride, type InsertUser, type RideRequest } from "@shared/schema";

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

import { users, drivers, rides, type User, type Driver, type Ride, type InsertUser, type RideRequest } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  private users: Map<number, User>;
  private drivers: Map<number, Driver>;
  private rides: Map<number, Ride>;
  private currentUserId: number;
  private currentDriverId: number;
  private currentRideId: number;

  constructor() {
    this.users = new Map();
    this.drivers = new Map();
    this.rides = new Map();
    this.currentUserId = 1;
    this.currentDriverId = 1;
    this.currentRideId = 1;
    
    // Initialize with 6 mock drivers
    this.initializeDrivers();
    // Initialize with test users
    this.initializeTestUsers();
  }

  private initializeDrivers() {
    const mockDrivers = [
      {
        id: 1,
        name: 'د. أحمد السعيد',
        phone: '0501234567',
        rating: 4.9,
        carModel: 'عيادة بيطرية متنقلة',
        carColor: 'أبيض',
        plateNumber: 'أ ب ج 123',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 2,
        name: 'د. فاطمة عبدالله',
        phone: '0501234568',
        rating: 4.7,
        carModel: 'عيادة بيطرية متنقلة',
        carColor: 'أزرق',
        plateNumber: 'د ه و 456',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1594824475317-774b21ec9626?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 3,
        name: 'د. عبدالرحمن خالد',
        phone: '0501234569',
        rating: 4.8,
        carModel: 'عيادة بيطرية متنقلة',
        carColor: 'أخضر',
        plateNumber: 'ز ح ط 789',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 4,
        name: 'د. سارة أحمد',
        phone: '0501234570',
        rating: 4.6,
        carModel: 'عيادة بيطرية متنقلة',
        carColor: 'رمادي',
        plateNumber: 'ي ك ل 012',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 5,
        name: 'د. خالد محمود',
        phone: '0501234571',
        rating: 4.9,
        carModel: 'عيادة بيطرية متنقلة',
        carColor: 'أبيض',
        plateNumber: 'م ن س 345',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 6,
        name: 'د. منى سعد',
        phone: '0501234572',
        rating: 4.5,
        carModel: 'عيادة بيطرية متنقلة',
        carColor: 'أبيض',
        plateNumber: 'ع ف ص 678',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      }
    ];

    mockDrivers.forEach(driver => {
      this.drivers.set(driver.id, driver as Driver);
      this.currentDriverId = Math.max(this.currentDriverId, driver.id + 1);
    });
  }

  private initializeTestUsers() {
    const testUsers = [
      {
        id: 1,
        phone: '0501234567',
        password: '123456',
        name: 'أحمد محمد',
        membershipType: 'bronze'
      },
      {
        id: 2,
        phone: '0507654321',
        password: '123456',
        name: 'فاطمة علي',
        membershipType: 'silver'
      },
      {
        id: 3,
        phone: 'vetsvan1',
        password: '123456',
        name: 'طبيب بيطري',
        membershipType: 'doctor'
      }
    ];

    testUsers.forEach(user => {
      this.users.set(user.id, user as User);
      this.currentUserId = Math.max(this.currentUserId, user.id + 1);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: any): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      phone: insertUser.phone,
      password: insertUser.password,
      name: insertUser.name,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      petName: insertUser.petName || null,
      petType: insertUser.petType || null,
      membershipType: "bronze"
    };
    this.users.set(id, user);
    return user;
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

  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<void> {
    const driver = this.drivers.get(id);
    if (driver) {
      this.drivers.set(id, { ...driver, latitude, longitude });
    }
  }

  async updateDriverAvailability(id: number, isAvailable: boolean): Promise<void> {
    const driver = this.drivers.get(id);
    if (driver) {
      this.drivers.set(id, { ...driver, isAvailable });
    }
  }

  async createRide(rideData: RideRequest): Promise<Ride> {
    const id = this.currentRideId++;
    const ride: Ride = {
      ...rideData,
      id,
      status: rideData.status || 'requested',
      driverId: rideData.driverId || null,
      destinationLatitude: rideData.destinationLatitude || null,
      destinationLongitude: rideData.destinationLongitude || null,
      estimatedDistance: rideData.estimatedDistance || null,
      estimatedTime: rideData.estimatedTime || null,
      estimatedCost: rideData.estimatedCost || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rides.set(id, ride);
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
      this.rides.set(id, { ...ride, status, updatedAt: new Date() });
    }
  }

  async assignDriverToRide(rideId: number, driverId: number): Promise<void> {
    const ride = this.rides.get(rideId);
    if (ride) {
      this.rides.set(rideId, { ...ride, driverId, updatedAt: new Date() });
    }
  }

  async getUserActiveRide(userId: number): Promise<Ride | undefined> {
    return Array.from(this.rides.values()).find(
      ride => ride.customerId === userId && !['completed', 'cancelled'].includes(ride.status)
    );
  }

  async getDriverActiveRide(driverId: number): Promise<Ride | undefined> {
    return Array.from(this.rides.values()).find(
      ride => ride.driverId === driverId && !['completed', 'cancelled'].includes(ride.status)
    );
  }
}

export const storage = new MemStorage();
