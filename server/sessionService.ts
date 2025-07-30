import { storage } from "./storage";
import type { UserSession, InsertUserSession } from "@shared/schema";

class SessionService {
  // Generate a secure session ID
  generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  // Create a new session
  async createSession(userId: number, userType: string, userData: any, durationHours: number = 24): Promise<string> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const sessionData: InsertUserSession = {
      id: sessionId,
      userId,
      userType,
      userData,
      expiresAt,
    };

    await storage.createSession(sessionData);
    console.log(`✅ Created new ${userType} session for user ${userId}: ${sessionId}`);
    return sessionId;
  }

  // Get session and validate
  async getSession(sessionId: string): Promise<UserSession | null> {
    if (!sessionId) {
      console.log('⚠️ No session ID provided');
      return null;
    }

    const session = await storage.getSession(sessionId);
    if (!session) {
      console.log(`❌ Session not found: ${sessionId}`);
      return null;
    }

    console.log(`✅ Valid session found for user ${session.userId} (${session.userType})`);
    return session;
  }

  // Delete session (logout)
  async deleteSession(sessionId: string): Promise<void> {
    if (sessionId) {
      await storage.deleteSession(sessionId);
      console.log(`🗑️ Session deleted: ${sessionId}`);
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await storage.deleteExpiredSessions();
      console.log('🧹 Expired sessions cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup expired sessions:', error);
    }
  }

  // Get all sessions for a user
  async getUserSessions(userId: number): Promise<UserSession[]> {
    return await storage.getUserSessions(userId);
  }

  // Get active session count for monitoring
  async getActiveSessionCount(): Promise<number> {
    try {
      const allSessions = await storage.getAllActiveSessions();
      return allSessions.length;
    } catch (error) {
      console.error('❌ Failed to get active session count:', error);
      return 0;
    }
  }
}

export const sessionService = new SessionService();

// Auto-cleanup expired sessions every 30 minutes
setInterval(() => {
  sessionService.cleanupExpiredSessions();
}, 30 * 60 * 1000);