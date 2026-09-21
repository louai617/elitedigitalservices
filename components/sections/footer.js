"use client";

import React from "react";
import { site } from "@/lib/site-config";
import Image from "next/image";
import { 
  Instagram, 
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: "Instagram", href: site.social.instagram, icon: Instagram },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
            <div className="flex items-center gap-2">
                <Image
                    src={site.logo.src}
                    alt={site.logo.alt}
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain"
                    loading="eager"
                    decoding="async"
                />
                <span className="sr-only">{site.fullName}</span>
            </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>

          {/* Copyright */}
          <div className="text-white/50 text-sm order-first sm:order-last">
            Copyright © {currentYear} {site.name} ({site.shortName}). All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
