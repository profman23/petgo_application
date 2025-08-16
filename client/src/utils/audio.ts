// Audio notification utility for doctor notifications
import notificationSoundUrl from "@assets/رسائل-الايفون_1751699547648.mp3";

export class AudioNotification {
  private static instance: AudioNotification;
  private audio: HTMLAudioElement;
  private isEnabled: boolean = true;
  private isUnlocked: boolean = false;
  private unlockPromise: Promise<void> | null = null;

  private constructor() {
    this.audio = new Audio(notificationSoundUrl);
    this.audio.preload = 'auto';
    this.audio.volume = 0.8;
    
    // Handle audio loading errors
    this.audio.addEventListener('error', (e) => {
      console.warn('Audio notification failed to load:', e);
    });

    // Check if audio was previously unlocked
    this.isUnlocked = localStorage.getItem('audioUnlocked') === 'true';
  }

  public static getInstance(): AudioNotification {
    if (!AudioNotification.instance) {
      AudioNotification.instance = new AudioNotification();
    }
    return AudioNotification.instance;
  }

  public async playNotification(): Promise<void> {
    if (!this.isEnabled) return;

    // If audio isn't unlocked yet, try to unlock it first
    if (!this.isUnlocked) {
      const unlocked = await this.requestAudioUnlock();
      if (!unlocked) {
        throw new Error('Audio permission required');
      }
    }

    try {
      // Reset audio to beginning if already playing
      this.audio.currentTime = 0;
      
      // Play the notification sound
      await this.audio.play();
      console.log('🔊 Audio notification played successfully');
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
      
      // If it's a permission error, mark as not unlocked and throw
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.isUnlocked = false;
        localStorage.removeItem('audioUnlocked');
        throw new Error('Audio blocked by browser. User interaction required.');
      }
      
      throw error;
    }
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  public async requestAudioUnlock(): Promise<boolean> {
    if (this.isUnlocked) return true;
    
    // Return existing promise if already in progress
    if (this.unlockPromise) {
      await this.unlockPromise;
      return this.isUnlocked;
    }

    this.unlockPromise = new Promise((resolve) => {
      // Setup one-time global click listener
      const unlockAudio = async () => {
        try {
          // Try to play a silent version first
          const originalVolume = this.audio.volume;
          this.audio.volume = 0;
          await this.audio.play();
          await this.audio.pause();
          this.audio.currentTime = 0;
          this.audio.volume = originalVolume;
          
          this.isUnlocked = true;
          localStorage.setItem('audioUnlocked', 'true');
          console.log('🔓 Audio unlocked successfully');
          
          // Remove the listener
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
          
          resolve();
        } catch (error) {
          console.warn('Failed to unlock audio:', error);
          resolve();
        }
      };

      // Add listeners for user interaction
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('touchstart', unlockAudio, { once: true });
      
      // Auto-resolve after 10 seconds if no interaction
      setTimeout(() => {
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        resolve();
      }, 10000);
    });

    await this.unlockPromise;
    this.unlockPromise = null;
    return this.isUnlocked;
  }

  public getUnlockStatus(): boolean {
    return this.isUnlocked;
  }

  public async testNotification(): Promise<boolean> {
    try {
      await this.playNotification();
      return true;
    } catch (error) {
      console.error('Audio test failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const audioNotification = AudioNotification.getInstance();

// Helper function to play booking notification
export const playBookingNotification = async (): Promise<void> => {
  await audioNotification.playNotification();
};

// Helper function to test audio capability
export const testAudioNotification = async (): Promise<boolean> => {
  return await audioNotification.testNotification();
};