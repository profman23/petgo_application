import { motion } from "framer-motion";
import Lottie from "lottie-react";
import dashboardAnimation from "@/assets/lottie/dashboard-illustration.json";

export function LoginIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex items-center justify-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-full max-w-[520px] rounded-2xl shadow-lg p-6 bg-white/80 dark:bg-zinc-900/60 backdrop-blur"
      >
        <Lottie
          animationData={dashboardAnimation}
          loop={true}
          autoplay={true}
          className="w-full h-auto"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        
        {/* Additional decorative elements */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></div>
            <div className="h-2 bg-gray-200 rounded-full flex-1">
              <motion.div
                className="h-2 bg-purple-600 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <div className="h-2 bg-gray-200 rounded-full flex-1">
              <motion.div
                className="h-2 bg-gray-400 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "45%" }}
                transition={{ duration: 2, delay: 1, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <div className="h-2 bg-gray-200 rounded-full flex-1">
              <motion.div
                className="h-2 bg-purple-400 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}