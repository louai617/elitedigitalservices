"use client";

import React from "react";
import Image from "next/image";
import { 
  Instagram, 
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: "Instagram", href: "https://instagram.com/m2agency_", icon: Instagram },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
            <div className="flex items-center gap-2">
                <Image
                    src="/Digital Services.png"
                    alt="ELITE digital agency"
                    width={40}
                    height={40}
                    className="invert"
                    loading="eager"
                    decoding="async"
                />
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
            Copyright © {currentYear} ELITE digital agency
          </div>
        </div>
      </div>
    </footer>
  );
}
