"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function BackgroundSlideshow({ intervalMs = 3500, fadeMs = 900 }) {
  const [images, setImages] = useState([]);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [nextIdx, setNextIdx] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/bg", { cache: "no-store" })
      .then((r) => r.json())
      .then(async (d) => {
        if (!mounted) return;
        const urls = d.images || [];
        // Preload all images to avoid flicker
        await Promise.all(urls.map((u) => new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = u;
        })));
        if (mounted) {
          setImages(urls);
          setReady(true);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!images.length || !ready) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const n = (current + 1) % images.length;
      setNextIdx(n);
      setShowNext(true);
      // finalize switch after fade
      setTimeout(() => {
        setCurrent(n);
        setShowNext(false);
        setNextIdx(null);
      }, fadeMs);
    }, intervalMs);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [images, intervalMs, ready, current, fadeMs]);

  const currSrc = images.length ? images[current] : null;
  const nextSrc = nextIdx != null ? images[nextIdx] : null;

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none" aria-hidden>
      {/* Base brand color to keep tone behind images */}
      <div className="absolute inset-0" style={{ background: "#3d4a5d" }} />
      <div className="absolute inset-0" style={{ filter: "blur(10px) saturate(1.05)", transform: "scale(2.02)" }} />
      {/* Previous image fading out */}
      {/* Bottom: current always visible */}
      {ready && currSrc && (
        <FadeImage key={`cur-${currSrc}`} src={currSrc} durationMs={fadeMs} visible />
      )}
      {/* Top: next fades in, then we swap to make it current */}
      {ready && nextSrc && (
        <FadeImage key={`next-${nextSrc}`} src={nextSrc} durationMs={fadeMs} visible={showNext} />
      )}
      {/* Color tint to lock hue strictly to #3d4a5d */}
      <div className="absolute inset-0" style={{ background: "#3d4a5d", mixBlendMode: "color", opacity: 1 }} />
      {/* Darken pass */}
      <div className="absolute inset-0" style={{ background: "#000", mixBlendMode: "multiply", opacity: 0.35 }} />
      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 100%)"
      }} />
    </div>
  );
}

function FadeImage({ src, visible, durationMs }) {
  return (
    <img
      src={src}
      alt="bg"
      className="absolute inset-0 w-full h-full object-cover will-change-transform will-change-opacity"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${durationMs}ms ease-in-out, transform ${durationMs}ms ease-in-out`,
        transform: visible ? "scale(1.06)" : "scale(1)",
      }}
    />
  );
}


