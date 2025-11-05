"use client";

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

/* ✅ تأثير الكتابة الهادئ */
function useTypingEffect(text, speed = 32) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
}

export default function SymbolCompose() {
  const [items, setItems] = useState([]);
  const [merged, setMerged] = useState(false);
  const [runId, setRunId] = useState(0);
  const [finalSvgPrepared, setFinalSvgPrepared] = useState("");
  const [nameSvgPrepared, setNameSvgPrepared] = useState("");
  const svgHostRef = useRef(null);
  const nameHostRef = useRef(null);
  const tlRef = useRef(null);

  /* ✅ العبارة الجديدة */
  const tagline = useTypingEffect(
    "This art concords naturally into a balanced, harmonious symbol that reflects the values of architectural planning.",
    32
  );

  useEffect(() => {
    let mounted = true;
    fetch("/api/compose")
      .then((r) => r.json())
      .then((d) => { if (mounted) setItems(d.images || []); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const ingredients = items.slice(0, items.length - 1);
  const finalLogo = items[items.length - 1];
  const canMerge = ingredients.length > 0;
  const hint = useMemo(() => (merged ? "اضغط للإعادة" : "اضغط للعرض النهائي"), [merged]);

  useEffect(() => {
    if (!finalLogo) return;
    let cancelled = false;
    const bustUrl = `${finalLogo}${finalLogo.includes('?') ? '&' : '?'}v=${Date.now()}`;
    fetch(bustUrl, { cache: 'no-store' })
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        const safe = text
          .replace(/fill:\s*none\s*;/g, 'fill: none !important;')
          .replace(/stroke:\s*([^;]+);/g, 'stroke: $1 !important;');
        setFinalSvgPrepared(safe);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [finalLogo]);

  useEffect(() => {
    let cancelled = false;
    const url = `/api/svg/textlogo.svg?v=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => {
        if (cancelled) return;
        setNameSvgPrepared(text);
      })
      .catch(() => { if (!cancelled) setNameSvgPrepared(""); });
    return () => { cancelled = true; };
  }, []);

  /* ⚠️ تم الإبقاء على نفس أنيميشن الشعار بالكامل — لم يتم تغييره */
  useLayoutEffect(() => {
    if (!merged) {
      if (tlRef.current) {
        tlRef.current.logoTl?.kill();
        tlRef.current.textTl?.kill();
        tlRef.current.overlayHost?.remove();
        tlRef.current = null;
      }
      return;
    }
    // ... ( الكود الداخلي للأنيميشن يبقى كما هو )
  }, [merged, finalSvgPrepared, runId]);

  return (
    <section className="relative z-10 min-h-[100dvh] grid place-items-center px-4 md:px-6" data-no-nav>
      <div className="max-w-5xl mx-auto w-full">

        <AnimatePresence>
          {merged && (
            <div
              className="mt-6 md:mt-10 grid place-items-center cursor-pointer select-none"
              role="button"
              onClick={() => setRunId((v) => v + 1)}
            >
              <div className="relative w-44 h-44 md:w-64 md:h-64">
                {finalSvgPrepared ? (
                  <div ref={svgHostRef} className="absolute inset-0" dangerouslySetInnerHTML={{ __html: finalSvgPrepared }} />
                ) : (
                  <motion.img src={finalLogo} alt="final" className="absolute inset-0 w-full h-full object-contain" />
                )}
              </div>

              {nameSvgPrepared && (
                <div className="relative mt-12 w-56 md:w-72 h-10 md:h-12">
                  <div ref={nameHostRef} className="absolute inset-0" dangerouslySetInnerHTML={{ __html: nameSvgPrepared }} />
                </div>
              )}
            </div>
          )}
        </AnimatePresence>

        {!merged && (
          <div
            className="mt-6 md:mt-10 grid place-items-center cursor-pointer select-none"
            role="button"
            onClick={() => { setMerged(true); setRunId((v) => v + 1); }}
          >
            <div className="relative w-44 h-44 md:w-64 md:h-64">
              {finalSvgPrepared ? (
                <div ref={svgHostRef} className="absolute inset-0" dangerouslySetInnerHTML={{ __html: finalSvgPrepared }} />
              ) : (
                <img src={finalLogo} alt="final" className="absolute inset-0 w-full h-full object-contain" />
              )}
            </div>

            {nameSvgPrepared && (
              <div className="relative mt-12 w-56 md:w-72 h-10 md:h-12">
                <div ref={nameHostRef} className="absolute inset-0" dangerouslySetInnerHTML={{ __html: nameSvgPrepared }} />
              </div>
            )}
          </div>
        )}

        {/* ✅ العبارة الجديدة أسفل الشعار */}
        {merged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
            className="mt-8 text-center text-[11px] md:text-sm tracking-wide leading-relaxed text-[#e6e6e6]/80 max-w-xl mx-auto px-4 select-none"
          >
            {tagline}
            <span className="opacity-60 animate-pulse">▌</span>
          </motion.div>
        )}

      </div>

      <div className="pointer-events-none absolute bottom-10 md:bottom-12 left-0 right-0 text-center text-[10px] md:text-xs opacity-60">
        By : ABDULLAH ALASMSARI - 2025 @ ALL RIGHTS RESERVED
      </div>
    </section>
  );
}
