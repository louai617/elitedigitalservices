"use client";

import StackIcon from "tech-stack-icons";
import { techIcons } from "@/lib/projects-data";

/**
 * A single technology chip.
 *
 * Shared by the projects grid and the project detail page — they previously
 * held separate copies of this logic, which is how one of them kept rendering
 * icons the library does not ship.
 *
 * `tech-stack-icons` logs a console error for any name it does not recognise,
 * so a tech is only handed to StackIcon when `techIcons` gives it a real name.
 */
export default function TechStackItem({ tech, size = "sm" }) {
  const techData = techIcons[tech];

  const chip =
    size === "lg"
      ? "flex items-center gap-2 px-3 py-1.5 bg-muted/50 text-sm rounded-lg text-muted-foreground border border-border/50"
      : "flex items-center gap-1.5 px-2 py-1 bg-gray-300 text-xs rounded-md text-muted-foreground border border-border/50";

  // Unknown technology — nothing mapped at all.
  if (!techData) {
    return (
      <span className={chip}>
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 bg-muted-foreground/30"
          aria-hidden="true"
        />
        {tech}
      </span>
    );
  }

  // Known, but the library ships no icon for it: show the brand colour instead.
  if (!techData.name) {
    return (
      <span className={chip}>
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: techData.color }}
          aria-hidden="true"
        />
        {tech}
      </span>
    );
  }

  return (
    <span className={chip}>
      <div className={size === "lg" ? "w-5 h-5 flex items-center justify-center" : "w-5 h-5 flex items-center justify-center"}>
        <StackIcon
          name={techData.name}
          className="w-full h-full"
          style={{ maxWidth: "16px", maxHeight: "16px" }}
        />
      </div>
      {tech}
    </span>
  );
}
