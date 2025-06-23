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
  updateRideStatus(id: number, status: string): Promise<void>;
  assignDriverToRide(rideId: number, driverId: number): Promise<void>;
  getUserActiveRide(userId: number): Promise<Ride | undefined>;
  getDriverActiveRide(driverId: number): Promise<Ride | undefined>;
}

export class MemStorage implements IStorage {
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
  }

  private initializeDrivers() {
    const mockDrivers = [
      {
        id: 1,
        name: 'أحمد السعيد',
        phone: '0501234567',
        rating: 4.9,
        carModel: 'تويوتا كامري',
        carColor: 'أبيض',
        plateNumber: 'أ ب ج 123',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 2,
        name: 'محمد عبدالله',
        phone: '0501234568',
        rating: 4.7,
        carModel: 'هيونداي إلنترا',
        carColor: 'رمادي',
        plateNumber: 'د ه و 456',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 3,
        name: 'عبدالرحمن خالد',
        phone: '0501234569',
        rating: 4.8,
        carModel: 'نيسان التيما',
        carColor: 'أسود',
        plateNumber: 'ز ح ط 789',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 4,
        name: 'سالم أحمد',
        phone: '0501234570',
        rating: 4.6,
        carModel: 'كيا أوبتيما',
        carColor: 'أزرق',
        plateNumber: 'ي ك ل 012',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 5,
        name: 'خالد محمود',
        phone: '0501234571',
        rating: 4.9,
        carModel: 'هوندا أكورد',
        carColor: 'فضي',
        plateNumber: 'م ن س 345',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      },
      {
        id: 6,
        name: 'عبدالله سعد',
        phone: '0501234572',
        rating: 4.5,
        carModel: 'تويوتا كورولا',
        carColor: 'أبيض',
        plateNumber: 'ع ف ص 678',
        latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
        isAvailable: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'
      }
    ];

    mockDrivers.forEach(driver => {
      this.drivers.set(driver.id, driver as Driver);
      this.currentDriverId = Math.max(this.currentDriverId, driver.id + 1);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rides.set(id, ride);
    return ride;
  }

  async getRide(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
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
