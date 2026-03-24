"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ExternalLink, 
  Github, 
  Calendar, 
  Layers, 
  Info,
  Sparkles
} from "lucide-react";
import StackIcon from "tech-stack-icons";
import { techIcons } from "@/lib/projects-data";

export default function ProjectDetailClient({ project }) {
  const TechStackItem = ({ tech }) => {
    const techData = techIcons[tech];
    if (!techData) {
      return (
        <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 text-sm rounded-lg text-muted-foreground border border-border/50">
          {tech}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 text-sm rounded-lg text-muted-foreground border border-border/50">
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/#projects" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </Link>
          <div className="flex items-center gap-4">
            {project.github && (
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-full transition-colors">
                <Github size={20} />
              </a>
            )}
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2">
                Live Preview <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              {project.service.split('-').join(' ')}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Calendar size={14} />
              {project.year}
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight text-balance">
            {project.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
            {project.description}
          </p>
        </motion.div>

        {/* Banner Image */}
        {project.project.banner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden mb-16 border border-border/50 shadow-2xl"
          >
            <img
              src={project.project.banner}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {project.content && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Info size={24} className="text-primary" />
                  Project Overview
                </h2>
                <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
                  {project.content.split('\n').map((para, i) => (para ? <p key={i}>{para}</p> : <br key={i} />))}
                </div>
              </section>
            )}

            {project.result && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles size={24} className="text-primary" />
                  The Result
                </h2>
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 text-muted-foreground leading-relaxed">
                  {project.result}
                </div>
              </section>
            )}

            {project.project.images && project.project.images.length > 1 && (
              <section>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <Layers size={24} className="text-primary" />
                  Project Gallery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.project.images.slice(1).map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-colors group"
                    >
                      <img
                        src={image}
                        alt={`${project.title} screenshot ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            <section>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                Technologies Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <TechStackItem key={tech} tech={tech} />
                ))}
              </div>
            </section>

            {project.link && (
              <section className="p-8 rounded-3xl bg-primary text-primary-foreground relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                  <ExternalLink size={80} />
                </div>
                <h3 className="text-xl font-bold mb-2">Ready to see it?</h3>
                <p className="text-primary-foreground/80 mb-6 text-sm">Experience the live version of this project.</p>
                <a 
                  href={project.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-bold hover:bg-opacity-90 transition-all active:scale-95"
                >
                  Visit Website <ExternalLink size={18} />
                </a>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
