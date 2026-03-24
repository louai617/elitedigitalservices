import React from 'react';
import {
  Megaphone,
  Users,
  TrendingUp,
  MessageCircle,
  Globe,
  Cpu,
  Bot,
  BarChart,
  MonitorSmartphone,
  Layers,
} from 'lucide-react';

const visionPillars = [
  {
    id: 1,
    title: 'Awareness',
    description:
      'Increase brand visibility and recognition through strategic marketing and digital campaigns.',
    icon: Megaphone,
  },
  {
    id: 2,
    title: 'Engagement',
    description:
      'Build meaningful relationships with audiences through interactive and engaging digital experiences.',
    icon: Users,
  },
  {
    id: 3,
    title: 'Sales',
    description:
      'Turn attention into revenue through optimized funnels, landing pages, and performance marketing.',
    icon: TrendingUp,
  },
  {
    id: 4,
    title: 'Communication & PR',
    description:
      'Strengthen brand communication with audiences, partners, and communities across all channels.',
    icon: MessageCircle,
  },
  {
    id: 5,
    title: '360° Marketing',
    description:
      'Deliver fully integrated marketing strategies combining social media, ads, content, and branding.',
    icon: Globe,
  },
  {
    id: 6,
    title: 'Digital Transformation',
    description:
      'Help businesses modernize operations by adopting powerful digital tools, platforms, and systems.',
    icon: Cpu,
  },
  {
    id: 7,
    title: 'AI Automation',
    description:
      'Implement AI agents and automation to streamline workflows and eliminate repetitive work.',
    icon: Bot,
  },
  {
    id: 8,
    title: 'Data-Driven Growth',
    description:
      'Use analytics and performance tracking to guide strategy and maximize business growth.',
    icon: BarChart,
  },
  {
    id: 9,
    title: 'Powerful Digital Presence',
    description:
      'Build high-performance websites, social platforms, and online experiences that attract customers.',
    icon: MonitorSmartphone,
  },
  {
    id: 10,
    title: 'Scalable Technology',
    description:
      'Develop custom apps, platforms, and systems designed to support long-term business scalability.',
    icon: Layers,
  },
];

function VisionCard({ icon: Icon, title, description }) {
  return (
    <article
      className="group relative flex flex-col rounded-2xl border border-slate-800 bg-black/60 px-5 py-6 shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:border-[#eab877]/70 hover:shadow-xl focus-within:-translate-y-1.5 focus-within:border-[#eab877]/70 focus-within:shadow-xl"
      tabIndex={0}
      aria-label={title}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eab877]/15 text-[#eab877] transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-slate-50">
          {title}
        </h3>
      </div>
      <p className="mt-3 text-xs text-slate-300 leading-relaxed">
        {description}
      </p>
    </article>
  );
}

export function VisionSection() {
  return (
    <section
      aria-labelledby="vision-heading"
      className="bg-black py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#eab877] text-underline">
            Our Vision
          </p>
          <h2
            id="vision-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-50 md:text-4xl"
          >
            10 pillars powering modern digital growth
          </h2>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            We combine creativity, technology, and data to help brands grow
            faster, communicate better, and build scalable digital ecosystems.
          </p>
        </header>

        <div className="mt-10 grid gap-5 md:mt-12 md:gap-6 grid-cols-1 md:grid-cols-3 xl:grid-cols-5">
          {visionPillars.map((pillar) => (
            <VisionCard
              key={pillar.id}
              icon={pillar.icon}
              title={pillar.title}
              description={pillar.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}