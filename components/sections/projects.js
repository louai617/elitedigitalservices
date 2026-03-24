"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MagicCard } from "@/components/magicui/magic-card";
import {
  ExternalLink,
  Github,
  LayoutGrid,
} from "lucide-react";

import StackIcon from "tech-stack-icons";
import { projects, filters, techIcons } from "@/lib/projects-data";

export default function ProjectsSection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const filteredProjects = useMemo(() => {
    if (activeFilter === "all") return projects;
    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter]);

  const availableFilters = useMemo(() => {
    return filters.filter((filter) => {
      if (filter.id === "all") return true;
      return projects.some((project) => project.category === filter.id);
    });
  }, []);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  const toggleTechStack = (slug) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const TechStackItem = ({ tech }) => {
    const techData = techIcons[tech];
    if (!techData) {
      return (
        <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-300 text-xs rounded-md text-muted-foreground border border-border/50">
          <div className="w-3 h-3 bg-muted-foreground/20 rounded-sm flex items-center justify-center">
            <span className="text-[8px] font-bold text-muted-foreground">?</span>
          </div>
          {tech}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-300 text-xs rounded-md text-muted-foreground border border-border/50">
        <div className="w-5 h-5 flex items-center justify-center">
          <StackIcon
            name={techData.name}
            className="w-full h-full"
            style={{ maxWidth: "16px", maxHeight: "16px" }}
          />
        </div>
        {tech}
      </span>
    );
  };

  return (
    <section className="py-12 sm:py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Our Recent Projects
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Explore our latest work across web development, AI, design, and more.
            Each project showcases our commitment to quality and innovation.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-2"
        >
          {availableFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">
                  {filter.id === "all" ? "All" :
                   filter.id === "web" ? "Web" :
                   filter.id === "ecommerce" ? "Store" :
                   filter.id === "ai" ? "AI" :
                   filter.id === "design" ? "Design" :
                   filter.id === "video" ? "Video" :
                   filter.id === "blockchain" ? "Web3" :
                   filter.id === "automation" ? "Tools" : filter.label}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.slug}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(index * 0.03, 0.3),
                  layout: { duration: 0.3 },
                }}
                className="w-full"
              >
                <Link href={`/projects/${project.slug}`} className="block h-full">
                  <MagicCard
                    className="h-full overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    gradientSize={150}
                    gradientFrom="#6366f1"
                    gradientTo="#8b5cf6"
                    gradientOpacity={0.1}
                  >
                    <div className="p-4 sm:p-6 h-full flex flex-col">
                      {/* Banner */}
                      <div className="relative mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden bg-muted aspect-video">
                        <Image
                          src={project.project.banner}
                          alt={project.title}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground line-clamp-1">
                          {project.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-3">
                          {project.description}
                        </p>

                        {/* Tech Stack */}
                        <div className="mb-3 sm:mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {project.tech
                              .slice(0, expandedProjects.has(project.slug) ? project.tech.length : 2)
                              .map((tech) => (
                                <TechStackItem key={tech} tech={tech} />
                              ))}
                            {project.tech.length > 2 && !expandedProjects.has(project.slug) && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleTechStack(project.slug);
                                }}
                                className="flex items-center px-2 py-1 bg-muted/50 text-xs rounded-md text-muted-foreground border border-border/50 hover:bg-muted transition-colors cursor-pointer relative z-10"
                              >
                                +{project.tech.length - 2}
                              </button>
                            )}
                            {expandedProjects.has(project.slug) && project.tech.length > 2 && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleTechStack(project.slug);
                                }}
                                className="flex items-center px-2 py-1 bg-muted/50 text-xs rounded-md text-muted-foreground border border-border/50 hover:bg-muted transition-colors cursor-pointer relative z-10"
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/50">
                          <span className="text-xs font-medium text-primary flex items-center gap-1">
                            View Details <ExternalLink size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </MagicCard>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
