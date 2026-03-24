import Hero from "@/components/sections/hero";
import StatsSection from "@/components/sections/Stats"; // Corrected import path
import ServicesSection from "@/components/sections/Services";
import ProjectsSection from "@/components/sections/projects";
import ContactSection from "@/components/sections/contact";
import Footer from "@/components/sections/footer";
import LiquidGlassNavbar from "@/components/ui/glassy-bar";
import { SmoothCursor } from "@/components/ui/smooth-cursor";
import { VisionSection } from "@/components/sections/Vision";
import { SectionDivider } from "@/components/ui/section-divider";

export default function Home() {
  return (
    <div>
      <div id="showcase">
        <Hero />
      </div>
      <SectionDivider />
      <div id="vision">
        <VisionSection />
      </div>
      <SectionDivider />
      <div id="about">
        <StatsSection />
      </div>
      <SectionDivider />
      <div id="services">
        <ServicesSection />
      </div>
      <LiquidGlassNavbar />

      <div id="projects">
        <ProjectsSection />
      </div>
      <SectionDivider />
      <div id="contact">
        <ContactSection />
      </div>
      <SectionDivider />
      <Footer />

      <SmoothCursor />
    </div>
  );
}
