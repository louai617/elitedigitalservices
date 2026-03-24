"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  BrainCircuit,
  MessageSquare,
  Award,
  Smartphone,
  Layout,
  CheckCircle,
  ChevronDown,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom hook to check for screen size
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);
  return matches;
};

const services = [
  {
    icon: Smartphone,
    title: "Mobile App Development",
    subtitle: "Engaging experiences, pocket-sized.",
    description:
      "We build high-performance native and cross-platform mobile applications for iOS and Android. No recurring licensing fees or platform dependencies - you own your app completely. Our focus is on creating intuitive, user-centric designs that deliver seamless experiences from concept to store deployment.",
    offerings: [
      "Lightning-fast Native iOS & Android Apps",
      "Cost-effective Cross-Platform Solutions",
      "Pixel-perfect Mobile UI/UX Design",
      "Seamless Third-party Integrations",
    ],
    imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop",
  },
  {
    icon: Monitor,
    title: "Web Application Development",
    subtitle: "Scalable solutions for the modern web.",
    description:
      "Skip the monthly SaaS subscriptions and own your digital platform forever. Our team builds robust, full-stack web applications using cutting-edge frameworks like Next.js and React. One-time investment, lifetime ownership - no vendor lock-in, no recurring fees.",
    offerings: [
      "Enterprise-grade Full-Stack Solutions",
      "Blazing-fast Progressive Web Apps",
      "Real-time Analytics Dashboards",
      "Zero-downtime Cloud Infrastructure",
    ],
    imageUrl: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop",
  },
  {
    icon: Store,
    title: "E-commerce Solutions",
    subtitle: "Ready-to-launch and custom online stores.",
    description:
      "Tired of paying 3-5% transaction fees plus monthly subscriptions? Get your own e-commerce platform that you own forever. Choose from our battle-tested templates for quick launch or go fully custom. No Shopify fees, no platform limitations - just pure profit.",
    offerings: [
      "Launch-ready Store Templates (48hrs setup)",
      "Zero-commission Custom Platforms",
      "Advanced Payment Gateway Solutions",
      "AI-powered Sales Analytics",
    ],
    imageUrl: "/ecom-fastshop.jpg",
  },
  {
    icon: BrainCircuit,
    title: "AI & Machine Learning",
    subtitle: "Intelligent solutions to complex problems.",
    description:
      "We harness cutting-edge artificial intelligence and machine learning technologies to solve complex business challenges. Our team develops custom AI solutions that automate processes, provide deep insights, and drive innovation across various industries.",
    offerings: [
      "Custom AI Model Development",
      "Natural Language Processing",
      "Computer Vision Solutions",
      "Predictive Analytics",
    ],
    imageUrl: "https://images.unsplash.com/photo-1591696331111-ef95dfc02427?w=800&h=600&fit=crop",
  },
  {
    icon: MessageSquare,
    title: "Custom Chatbots",
    subtitle: "Automated conversations, human-like touch.",
    description:
      "We create intelligent, conversational AI that engages your customers 24/7. Our chatbots provide instant support, qualify leads, and enhance user experience with natural, context-aware interactions that feel genuinely helpful.",
    offerings: [
      "Intelligent Lead Qualification",
      "24/7 Customer Support",
      "Multi-platform Integration",
      "Natural Language Understanding",
    ],
    imageUrl: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=800&h=600&fit=crop",
  },
  {
    icon: Award,
    title: "Branding & Identity",
    subtitle: "Crafting brands that resonate and endure.",
    description:
      "We create compelling brand identities that tell your story and connect with your audience. From strategic positioning to visual design, we develop cohesive brand experiences that stand out in the marketplace.",
    offerings: [
      "Brand Strategy & Positioning",
      "Logo & Visual Identity",
      "Brand Guidelines",
      "Marketing Collateral",
    ],
    imageUrl: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=800&h=600&fit=crop",
  },
  {
    icon: Layout,
    title: "UI/UX & Design Systems",
    subtitle: "Intuitive design, built to scale.",
    description:
      "We design user experiences that are both beautiful and functional. Our approach combines user research, interaction design, and visual aesthetics to create digital products that users love and businesses depend on.",
    offerings: [
      "User Research & Testing",
      "Interactive Prototyping",
      "Design System Creation",
      "Conversion Optimization",
    ],
    imageUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=600&fit=crop",
  },
];

const DesktopLayout = ({ services, activeTab, setActiveTab }) => (
  <div className="hidden lg:flex flex-col lg:flex-row gap-8 lg:gap-12">
    {/* Left: Tabs */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col lg:w-1/3 space-y-2"
    >
      {services.map((service, index) => (
        <button
          key={service.title}
          onClick={() => setActiveTab(index)}
          className={cn(
            "relative w-full text-left p-4 rounded-lg transition-all duration-300 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            activeTab === index
              ? "bg-background shadow-lg scale-105"
              : "hover:bg-background/50"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2 rounded-md transition-colors",
              activeTab === index ? "bg-primary/10" : "bg-muted"
            )}>
              <service.icon
                className={cn(
                  "w-6 h-6 transition-colors",
                  activeTab === index ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground">
                {service.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {service.subtitle}
              </p>
            </div>
          </div>
          {activeTab === index && (
            <motion.div
              layoutId="active-service-underline-desktop"
              className="absolute -bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
            />
          )}
        </button>
      ))}
    </motion.div>

    {/* Right: Content */}
    <div className="lg:w-2/3 min-h-[420px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="bg-background p-6 sm:p-8 rounded-xl border border-border/50 shadow-sm h-full flex flex-col"
        >
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              {services[activeTab].title}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              {services[activeTab].description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {services[activeTab].offerings.map((offering) => (
                <div key={offering} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    {offering}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border/50">
            <img
              src={services[activeTab].imageUrl}
              alt={services[activeTab].title}
              className="w-full h-100 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
);

const MobileAccordion = ({ services, expanded, setExpanded }) => (
  <div className="lg:hidden w-full space-y-3">
    {services.map((service, index) => {
      const isOpen = index === expanded;
      return (
        <motion.div
          key={service.title}
          className="bg-background rounded-lg border border-border/50 overflow-hidden"
        >
          <motion.button
            initial={false}
            onClick={() => setExpanded(isOpen ? false : index)}
            className="w-full p-4 text-left flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-md">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground">
                  {service.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {service.subtitle}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </motion.button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.section
                key="content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                  open: { opacity: 1, height: "auto" },
                  collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0">
                  <img
                    src={service.imageUrl}
                    alt={service.title}
                    className="w-full h-100 object-cover rounded-lg mb-4"
                    loading="lazy"
                  />
                  <p className="text-muted-foreground mb-4 text-sm">
                    {service.description}
                  </p>
                  <div className="space-y-2">
                    {service.offerings.map((offering) => (
                      <div key={offering} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">
                          {offering}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      );
    })}
  </div>
);

export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState(0);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  return (
    <section id="services" className="py-16 sm:py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 pb-1 leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Our Digital Expertise
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            We transform ideas into high-impact digital products with a focus on quality, innovation, and craftsmanship.
          </p>
        </motion.div>

        {isMobile ? (
          <MobileAccordion services={services} expanded={expanded} setExpanded={setExpanded} />
        ) : (
          <DesktopLayout services={services} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </div>
    </section>
  );
}
