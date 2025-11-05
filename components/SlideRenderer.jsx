"use client";

import SymbolCompose from "./SymbolCompose";

export default function SlideRenderer({ slide }) {
  if (!slide) return null;
  const { type, title, subtitle } = slide;

  return (
    <div className="relative z-10 min-h-[100dvh] flex items-start justify-center px-6 pt-10 md:pt-16">
      <div className="max-w-5xl w-full">
        <SymbolCompose />
      </div>
    </div>
  );
}


