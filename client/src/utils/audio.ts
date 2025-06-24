// دالة لتشغيل أصوات الإشعارات
export const playNotificationSound = (type: 'newRequest' | 'accepted' | 'rejected' = 'newRequest') => {
  try {
    // إنشاء سياق صوتي
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // تحديد نوع الصوت حسب النوع
    let frequencies: number[] = [];
    let durations: number[] = [];
    
    switch (type) {
      case 'newRequest':
        // نغمة تصاعدية لطيفة للطلب الجديد
        frequencies = [523, 659, 784]; // دو - مي - صول
        durations = [0.3, 0.3, 0.6];
        break;
      case 'accepted':
        // نغمة إيجابية للقبول
        frequencies = [523, 659]; // دو - مي
        durations = [0.2, 0.4];
        break;
      case 'rejected':
        // نغمة منخفضة للرفض
        frequencies = [392, 330]; // صول - مي منخفضة
        durations = [0.3, 0.3];
        break;
    }
    
    // تشغيل النغمات بالتسلسل
    frequencies.forEach((frequency, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // ربط العقد
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // إعداد التردد والنوع
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine'; // نوع الموجة
        
        // إعداد مستوى الصوت مع تلاشي
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + durations[index]);
        
        // تشغيل الصوت
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + durations[index]);
        
      }, index * 200); // تأخير بين النغمات
    });
    
  } catch (error) {
    console.log('Audio not supported, using fallback:', error);
    // استخدام صوت بديل إذا لم تعمل Web Audio API
    try {
      // إنشاء نغمة بسيطة باستخدام تردد مولد
      const beep = (freq: number, duration: number) => {
        const audio = new Audio();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = 1;
        canvas.height = 1;
        
        // إنشاء بيانات صوتية بسيطة
        const sampleRate = 8000;
        const samples = duration * sampleRate;
        const buffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);
        
        // Generate sine wave
        for (let i = 0; i < samples; i++) {
          const sample = Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.3 * Math.max(0, 1 - i / samples);
          view.setInt16(44 + i * 2, sample * 32767, true);
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' });
        audio.src = URL.createObjectURL(blob);
        audio.volume = 0.3;
        audio.play().catch(() => {
          // تجاهل أخطاء التشغيل
        });
      };
      
      // تشغيل النغمة البديلة
      beep(800, 0.3);
      
    } catch (fallbackError) {
      console.log('Fallback audio failed:', fallbackError);
    }
  }
};

// دالة لطلب إذن الصوت
export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    // اختبار إنشاء سياق صوتي
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // إذا كان السياق في حالة suspended، حاول تشغيله
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    return audioContext.state === 'running';
  } catch (error) {
    console.log('Audio permission denied or not supported:', error);
    return false;
  }
};