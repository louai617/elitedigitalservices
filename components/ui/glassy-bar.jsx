"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Instagram, Menu, MenuIcon, X } from "lucide-react"

export default function LiquidGlassNavbar({ className = "", onNavigate } = {}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState("Showcase")
  const [isMobile, setIsMobile] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const hoverTimeoutRef = useRef(null)

  // Detect scroll to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > window.innerHeight * 0.9)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Optimized location fetch with fallback
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Timeout for slow connections
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) throw new Error('Network response was not ok')
        
        const data = await response.json()
        setLocation({
          city: data.city || "Unknown",
          timezone: data.timezone || "UTC",
          country: data.country_name || "Unknown",
          countryCode: (data.country_code || "xx").toLowerCase(),
        })
      } catch (error) {
        console.error("Error fetching location:", error)
        // Fallback location
        setLocation({
          city: "Global",
          timezone: "UTC",
          country: "Global",
          countryCode: "xx",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [])

  // Optimized time update with memoization
  const timeZone = useMemo(() => location?.timezone || "UTC", [location?.timezone])
  
  useEffect(() => {
    if (!location) return

    const updateTime = () => {
      try {
        const now = new Date()
        const timeString = now.toLocaleTimeString("en-US", {
          timeZone,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        setCurrentTime(timeString)
      } catch (error) {
        // Fallback for invalid timezone
        const now = new Date()
        setCurrentTime(now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }))
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [timeZone])

  // Optimized handlers with delay
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      setIsHovered(true)
    }
  }, [isMobile])

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      // Set a 1-second delay before closing
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false)
        hoverTimeoutRef.current = null
      }, 1000)
    }
  }, [isMobile])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen(prev => !prev)
  }, [])

  const handleNavigation = useCallback((item) => {
    setActiveItem(item)
    setIsMobileOpen(false)
    
    const idMap = {
      "Our Vision": "vision",
    };
    const elementId = idMap[item] || item.toLowerCase();
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    if (onNavigate) {
      onNavigate(item)
    }
  }, [onNavigate])

  const navItems = useMemo(() => ["Our Vision", "Services","Projects", "Contact"], [])

  // Dynamic text and background colors based on scroll position
  const textColor = hasScrolled ? "text-black" : "text-white";
  const hoverBg = hasScrolled ? "hover:bg-black/10" : "hover:bg-white/20";
  const activeItemStyle = hasScrolled ? "bg-black text-white" : "bg-white text-black";
  const navbarBg = hasScrolled ? "bg-white/50 border-black/10" : "bg-white/20 border-white/30";
  const mobileIconColor = hasScrolled ? "text-black" : "text-white";

  return (
    <>
      <nav className={`fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
        <div
          className={`
            relative overflow-hidden
            ${navbarBg} backdrop-blur-md border
            rounded-full shadow-lg
            transition-all duration-300 ease-out
            ${isHovered && !isMobile ? "w-[min(90vw,600px)]" : isMobile ? "w-auto" : "w-12 sm:w-16"}
            h-10 sm:h-12 flex items-center
            ${isMobile ? "px-3" : ""}
          `}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ willChange: 'transform, width' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full" />

          <div className="relative flex items-center w-full h-full px-2 sm:px-4 z-10">
            {/* Mobile Layout */}
            {isMobile ? (
              <>
                {/* Mobile - Only Menu Button */}
                <div className="flex items-center justify-center w-full">
                  <button
                    onClick={toggleMobileMenu}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Toggle menu"
                    style={{ willChange: 'transform' }}
                  >
                    {isMobileOpen ? (
                      <X className={`w-4 h-4 ${mobileIconColor}`} />
                    ) : (
                      <Menu className={`w-4 h-4 ${mobileIconColor}`} />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Desktop Layout */}
                {/* Left */}
                <div className={`flex-1 flex items-center transition-all duration-300 ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
                  <button 
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Social Media"
                  >
                    <Instagram className={`w-4 h-4 ${textColor}`} />
                  </button>
                </div>

                {/* Center */}
                <div className={`flex-1 flex justify-center items-center space-x-3 sm:space-x-6 transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                  {navItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleNavigation(item)}
                      className={`
                        px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium text-xs sm:text-sm transition-all duration-200
                        ${
                          activeItem === item
                            ? activeItemStyle
                            : `${textColor} ${hoverBg}`
                        }
                      `}
                      style={{ willChange: 'transform' }}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Right */}
                <div className={`flex-1 flex justify-end items-center gap-2 transition-all duration-300 ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs sm:text-sm font-medium ${textColor}`}>
                      {loading ? "Loading..." : location?.city}
                    </span>
                    <span className={`text-xs font-mono ${textColor}`}>
                      {currentTime || "--:--"}
                    </span>
                  </div>
                </div>

                {/* Collapsed label */}
                {!isHovered && (
                  <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs sm:text-sm font-medium ${textColor}`}>
                    <MenuIcon className={`w-6 h-6 ${textColor}`} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && (
        <div 
          className={`fixed inset-0 z-40 transition-all duration-300 ${
            isMobileOpen 
              ? 'bg-black/50 backdrop-blur-md opacity-100 pointer-events-auto' 
              : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
          }`}
          onClick={toggleMobileMenu}
        >
          <div 
            className={`absolute top-16 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-sm transition-all duration-300 ease-out ${
              isMobileOpen 
                ? 'translate-y-0 opacity-100 scale-100' 
                : '-translate-y-4 opacity-0 scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl p-4">
              <div className="flex flex-col space-y-3">
                {navItems.map((item, index) => (
                  <div
                    key={item}
                    className={`transition-all duration-300 ease-out ${
                      isMobileOpen 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-2 opacity-0'
                    }`}
                    style={{ 
                      transitionDelay: isMobileOpen ? `${index * 50}ms` : '0ms'
                    }}
                  >
                    <button
                      onClick={() => handleNavigation(item)}
                      className={`
                        w-full px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                        ${
                          activeItem === item
                            ? "bg-white text-black shadow-md scale-105"
                            : "text-white hover:bg-white/30 hover:scale-105"
                        }
                      `}
                      style={{ willChange: 'transform' }}
                    >
                      {item}
                    </button>
                  </div>
                ))}
                
                {/* Mobile Footer Info - Hidden as requested */}
                <div 
                  className={`pt-3 mt-3 border-t border-white/20 transition-all duration-300 ease-out ${
                    isMobileOpen 
                      ? 'translate-y-0 opacity-100' 
                      : 'translate-y-2 opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: isMobileOpen ? `${navItems.length * 50}ms` : '0ms'
                  }}
                >
                  <div className="flex justify-center items-center text-white/60 text-xs">
                    <span className="font-mono">{currentTime || "--:--"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
