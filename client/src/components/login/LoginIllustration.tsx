import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useState, useRef } from "react";
import dashboardAnimation from "@/assets/lottie/dashboard-illustration.json";
import dashboardBars from "@/assets/lottie/dashboard-bars.json";
import dashboardDonut from "@/assets/lottie/dashboard-donut.json";
import iconPhone from "@/assets/lottie/icon-phone.json";
import iconMail from "@/assets/lottie/icon-mail.json";
import iconWhatsapp from "@/assets/lottie/icon-whatsapp.json";
import iconChat from "@/assets/lottie/icon-chat.json";

export function LoginIllustration() {
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Intersection Observer for performance
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  const AnimatedCounter = ({ target, delay = 0 }: { target: number; delay?: number }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (!isVisible || prefersReducedMotion) return;
      
      const timer = setTimeout(() => {
        const increment = target / 30;
        const counter = setInterval(() => {
          setCount(prev => {
            const next = prev + increment;
            if (next >= target) {
              clearInterval(counter);
              return target;
            }
            return next;
          });
        }, 50);
        
        return () => clearInterval(counter);
      }, delay);
      
      return () => clearTimeout(timer);
    }, [target, delay, isVisible, prefersReducedMotion]);
    
    return <span>{Math.floor(count)}</span>;
  };

  if (prefersReducedMotion) {
    return (
      <div className="w-full max-w-[520px] rounded-2xl shadow-lg p-6 bg-white/80 backdrop-blur">
        <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">V</span>
            </div>
            <p className="text-purple-600 font-medium">Veterinary Dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex items-center justify-center"
      aria-label="Interactive veterinary dashboard illustration"
    >
      <motion.div
        animate={{ y: isVisible ? [0, -10, 0] : 0 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-full max-w-[520px] rounded-2xl shadow-lg p-6 bg-white/80 backdrop-blur relative overflow-hidden"
      >
        {/* Main Dashboard Animation */}
        <div className="relative">
          <Lottie
            animationData={dashboardAnimation}
            loop={isVisible}
            autoplay={isVisible}
            className="w-full h-auto"
            style={{ maxWidth: "100%", height: "auto" }}
            aria-label="Dashboard interface animation"
          />
        </div>
        
        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {/* Donut Chart */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-xl p-3 shadow-sm"
          >
            <Lottie
              animationData={dashboardDonut}
              loop={isVisible}
              autoplay={isVisible}
              className="w-16 h-16 mx-auto"
              aria-label="Performance donut chart showing 72% completion"
            />
            <div className="text-center mt-2">
              <div className="text-sm font-semibold text-gray-700">
                <AnimatedCounter target={1247} delay={500} />
              </div>
              <div className="text-xs text-gray-500">Patients</div>
            </div>
          </motion.div>
          
          {/* Bar Chart */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-xl p-3 shadow-sm"
          >
            <Lottie
              animationData={dashboardBars}
              loop={isVisible}
              autoplay={isVisible}
              className="w-full h-16"
              aria-label="Monthly statistics bar chart"
            />
            <div className="text-center mt-2">
              <div className="text-sm font-semibold text-gray-700">
                <AnimatedCounter target={89} delay={700} />%
              </div>
              <div className="text-xs text-gray-500">Success</div>
            </div>
          </motion.div>
          
          {/* KPI Card */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-white rounded-xl p-3 shadow-sm"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-lg mx-auto flex items-center justify-center">
              <div className="text-purple-600 text-2xl font-bold">
                <AnimatedCounter target={24} delay={900} />
              </div>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm font-semibold text-gray-700">Online</div>
              <div className="text-xs text-gray-500">Doctors</div>
            </div>
          </motion.div>
        </div>
        
        {/* Contact Icons Cloud */}
        <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
          <motion.div
            animate={{ 
              y: isVisible ? [0, -5, 0] : 0,
              rotate: isVisible ? [0, 5, 0] : 0
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0
            }}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
          >
            <Lottie
              animationData={iconPhone}
              loop={isVisible}
              autoplay={isVisible}
              className="w-6 h-6"
              aria-label="Phone contact animation"
            />
          </motion.div>
          
          <motion.div
            animate={{ 
              y: isVisible ? [0, -3, 0] : 0,
              rotate: isVisible ? [0, -3, 0] : 0
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2
            }}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
          >
            <Lottie
              animationData={iconMail}
              loop={isVisible}
              autoplay={isVisible}
              className="w-6 h-6"
              aria-label="Email contact animation"
            />
          </motion.div>
          
          <motion.div
            animate={{ 
              y: isVisible ? [0, -4, 0] : 0,
              scale: isVisible ? [1, 1.05, 1] : 1
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4
            }}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
          >
            <Lottie
              animationData={iconWhatsapp}
              loop={isVisible}
              autoplay={isVisible}
              className="w-6 h-6"
              aria-label="WhatsApp contact animation"
            />
          </motion.div>
          
          <motion.div
            animate={{ 
              y: isVisible ? [0, -6, 0] : 0,
              x: isVisible ? [0, 2, 0] : 0
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6
            }}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
          >
            <Lottie
              animationData={iconChat}
              loop={isVisible}
              autoplay={isVisible}
              className="w-6 h-6"
              aria-label="Chat contact animation"
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}