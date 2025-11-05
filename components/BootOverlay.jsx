"use client";

import { useEffect, useState } from "react";

export default function BootOverlay() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let mounted = true;
    const preload = async () => {
      try {
        const [bgRes, compRes] = await Promise.all([
          fetch("/api/bg", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ images: [] })),
          fetch("/api/compose", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ images: [] })),
        ]);
        const bg = bgRes.images || [];
        await Promise.all(bg.map((u) => new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = u;
        })));
      } finally {
        if (!mounted) return;
        // لطيفة: انتظر قليلًا لإحساس التحميل
        setTimeout(() => setVisible(false), 300);
      }
    };
    preload();
    return () => { mounted = false; };
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center" style={{ background: "#3d4a5d" }}>
      <LogoSpinner />
    </div>
  );
}

function LogoSpinner() {
  return (
    <svg width="140" height="140" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#eef0e4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="30" fill="none" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="188">
        <animate attributeName="stroke-dashoffset" from="188" to="0" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="1.6" fill="#00FFD1">
        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}


