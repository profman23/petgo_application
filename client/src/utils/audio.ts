// Audio notification utility for doctor notifications
import notificationSoundUrl from "@assets/رسائل-الايفون_1751699547648.mp3";

export class AudioNotification {
  private static instance: AudioNotification;
  private audio: HTMLAudioElement;
  private isEnabled: boolean = true;

  private constructor() {
    this.audio = new Audio(notificationSoundUrl);
    this.audio.preload = 'auto';
    this.audio.volume = 0.8;
    
    // Handle audio loading errors
    this.audio.addEventListener('error', (e) => {
      console.warn('Audio notification failed to load:', e);
    });
  }

  public static getInstance(): AudioNotification {
    if (!AudioNotification.instance) {
      AudioNotification.instance = new AudioNotification();
    }
    return AudioNotification.instance;
  }

  public async playNotification(): Promise<void> {
    if (!this.isEnabled) {
      console.log('🔇 Audio notification disabled');
      return;
    }

    try {
      // Reset audio to beginning if already playing
      this.audio.currentTime = 0;
      
      // Try alternative methods if main audio fails
      console.log('🔊 Attempting to play notification sound...');
      await this.audio.play();
      console.log('✅ Audio notification played successfully');
    } catch (error) {
      console.warn('❌ Failed to play notification sound:', error);
      
      // Try fallback audio
      try {
        console.log('🔄 Trying fallback audio method...');
        const fallbackAudio = new Audio('/رسائل-الايفون_1751699547648.mp3');
        fallbackAudio.volume = 0.8;
        await fallbackAudio.play();
        console.log('✅ Fallback audio played successfully');
      } catch (fallbackError) {
        console.warn('❌ Fallback audio also failed:', fallbackError);
        
        // Try basic beep sound as last resort
        try {
          const beepAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFA==');
          beepAudio.volume = 0.5;
          await beepAudio.play();
          console.log('🔔 Basic beep notification played');
        } catch (beepError) {
          console.warn('❌ All audio methods failed:', beepError);
        }
      }
      
      // Try to enable audio with user interaction
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.log('🚫 Audio blocked by browser. User interaction required.');
        this.showAudioPermissionNotice();
      }
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

  private showAudioPermissionNotice(): void {
    // Create a temporary button to request audio permission
    const button = document.createElement('button');
    button.style.display = 'none';
    button.onclick = () => {
      this.audio.play().catch(() => {});
      document.body.removeChild(button);
    };
    document.body.appendChild(button);
    button.click();
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