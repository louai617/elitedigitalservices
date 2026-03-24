"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import BlurFade from "../ui/blur-fade";
import Particles from "../magicui/particles";

export default function Hero() {
  const delay = 0.1;

  return (
    <div className="relative min-h-screen w-full bg-black flex items-center justify-center overflow-hidden">
      {/* Background Particles - Placed at the very back */}
      <div className="absolute inset-0 z-0">
        <Particles
          className="w-full h-full"
          quantity={120}
          staticity={30}
          ease={50}
          color="#eab877"
          refresh
        />
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        <div className="flex flex-col gap-12 sm:gap-16">
          {/* Main Content Row: Logo (Left) and Text (Right) on Desktop */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            
            {/* Logo Section - Left on Desktop */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start -mt-[60px] relative z-20">
                <BlurFade delay={delay * 1.5} inView className="relative z-20">
                  <div className="relative">
                    {/* Golden light spot behind the image - Even larger and more intense */}
                    <motion.div
                      className="absolute inset-0 -top-32 -bottom-32 -left-48 -right-48 rounded-full opacity-70 blur-[100px] pointer-events-none select-none"
                    style={{
                      background: "radial-gradient(circle, rgba(234, 184, 119, 0.5) 0%, rgba(234, 184, 119, 0.2) 40%, transparent 70%)",
                    }}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    aria-hidden
                  />
                  
                  <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.8}
                    whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-30 w-72 h-72 sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] cursor-grab active:cursor-grabbing select-none"
                  >
                    <Image 
                      src="/Digital Services.png" 
                      alt="Digital Services" 
                      fill
                      draggable={false}
                      className="object-contain pointer-events-none"
                      priority
                    />
                  </motion.div>
                </div>
              </BlurFade>
            </div>

            {/* Text Section - Right on Desktop */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 sm:gap-8 mt-10">
              {/* Tagline */}
              <BlurFade delay={delay * 2} inView>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-[#eab877] leading-tight sm:leading-relaxed">
                  We Build Digital Experiences That Actually Work
                </h1>
              </BlurFade>

              {/* Description */}
              <BlurFade delay={delay * 2.5} inView>
                <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed">
                  From sleek websites to complex platforms, we craft digital solutions leveraging AI to speed up the process by 10x, delivering results faster and smarter. 
                  Whether you need a full-stack application, a killer design, or an AI solution — 
                  we've got the expertise to make it happen.
                </p>
              </BlurFade>
            </div>
          </div>

          {/* Services Tags - Full Width below both */}
          <div className="w-full flex justify-center">
            <BlurFade delay={delay * 3} inView>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl">
                {[
                  "Web Apps", 
                  "Graphic Design",
                  "Brand Identity",
                  "Mobile Development",
                  "AI Development",
                  "Bots",
                  "Chat Bots",
                  "Branding",
                  "UI/UX Design",
                  "Automation",
                  "Design Systems", 
                  "E-commerce", 
                  "Blockchain", 
                  "Video Editing",
                ].map((service, index) => (
                  <span 
                    key={service}
                    className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-black border border-[#eab877] rounded-full text-xs sm:text-sm font-medium text-white hover:bg-[#eab877]/10 transition-colors duration-200 will-change-transform"
                    style={{ 
                      animationDelay: `${index * 0.05}s`,
                      transform: 'translateZ(0)' // Hardware acceleration hint
                    }}
                  >
                    {service}
                  </span>
                ))}
              </div>
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
}
