"use client";

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

export default function SymbolCompose() {
  const [items, setItems] = useState([]);
  const [merged, setMerged] = useState(false);
  const [runId, setRunId] = useState(0);
  // نستخدم الضغط لتفعيل العرض فقط
  const [finalSvgPrepared, setFinalSvgPrepared] = useState("");
  const [nameSvgPrepared, setNameSvgPrepared] = useState("");
  const svgHostRef = useRef(null);
  const nameHostRef = useRef(null);
  const tlRef = useRef(null);
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

  // اجلب محتوى final.svg كما هو
  useEffect(() => {
    if (!finalLogo) return;
    let cancelled = false;
    const bustUrl = `${finalLogo}${finalLogo.includes('?') ? '&' : '?'}v=${Date.now()}`;
    fetch(bustUrl, { cache: 'no-store' })
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        // امنع تسريب أنماط خارجية من textlogo بتقوية قواعد final إلى !important
        const safe = text
          .replace(/fill:\s*none\s*;/g, 'fill: none !important;')
          .replace(/stroke:\s*([^;]+);/g, 'stroke: $1 !important;');
        setFinalSvgPrepared(safe);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [finalLogo]);

  // اجلب textlogo.svg (اختياري)
  useEffect(() => {
    let cancelled = false;
    const url = `/api/svg/textlogo.svg?v=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => {
        if (cancelled) return;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "image/svg+xml");
          const svg = doc.querySelector("svg");
          if (!svg) { setNameSvgPrepared(text); return; }
          // احذف جميع أنماط <style>
          svg.querySelectorAll("style").forEach((n) => n.parentNode && n.parentNode.removeChild(n));
          // نظّف الحدود وأبقِ التعبئة فقط، ولا تغيّر اللون إن كان موجودًا
          const elements = svg.querySelectorAll("path,line,polyline,polygon,rect,circle,ellipse");
          elements.forEach((el) => {
            el.setAttribute("stroke", "none");
            el.removeAttribute("stroke-width");
            el.removeAttribute("stroke-linecap");
            el.removeAttribute("stroke-linejoin");
            // إن كانت تعتمد على صنف st* لوني، وحقل fill غير موجود، ضع لونًا افتراضيًا مناسبًا للخلفية
            const cls = (el.getAttribute("class") || "");
            if (!el.getAttribute("fill") && /\bst\d+\b/i.test(cls)) {
              el.setAttribute("fill", "#eef0e4");
            }
            // إزالة class لتجنّب أي استهداف لاحق
            el.removeAttribute("class");
          });
          const serializer = new XMLSerializer();
          const cleaned = serializer.serializeToString(svg);
          setNameSvgPrepared(cleaned);
        } catch {
          setNameSvgPrepared(text);
        }
      })
      .catch(() => { if (!cancelled) setNameSvgPrepared(""); });
    return () => { cancelled = true; };
  }, []);

  // تهيئة أنيميشن GSAP بتتابع صارم وفق الوصفة المبسطة (جمع كل المسارات، ترتيبها، رسمها)
  useLayoutEffect(() => {
    if (!merged) {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      return;
    }
    const host = svgHostRef.current;
    if (!host) return;
    const svg = host.querySelector("svg");
    if (!svg) return;
    // 1) اجمع المسارات وارتبها كخطوات مرقمة
    const allPaths = Array.from(
      svg.querySelectorAll("path,line,polyline,polygon,rect,circle,ellipse")
    );
    const normalizeDigits = (s) => (s || "").replace(/[\u0660-\u0669]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    const extractNum = (el) => {
      const id = normalizeDigits(el.getAttribute("id") || "");
      const dn = normalizeDigits(el.getAttribute("data-name") || "");
      const m1 = id.match(/(\d{1,4})/);
      const m2 = dn.match(/(\d{1,4})/);
      const n1 = m1 ? parseInt(m1[1], 10) : Number.POSITIVE_INFINITY;
      const n2 = m2 ? parseInt(m2[1], 10) : Number.POSITIVE_INFINITY;
      return Math.min(n1, n2);
    };
    const stepItems = allPaths
      .map((p) => ({ p, num: extractNum(p) }))
      .filter((x) => Number.isFinite(x.num))
      .sort((a, b) => a.num - b.num);
    // دالة عامة لحساب طول العناصر المختلفة (بدون تعديل الشعار)
    const computeLen = (el) => {
      const tag = (el.tagName || "").toLowerCase();
      try {
        if (typeof el.getTotalLength === "function") {
          const v = el.getTotalLength();
          if (Number.isFinite(v)) return Math.max(1, v);
        }
      } catch {}
      const num = (v) => (v == null ? 0 : parseFloat(v));
      if (tag === "line") {
        const x1 = num(el.getAttribute("x1"));
        const y1 = num(el.getAttribute("y1"));
        const x2 = num(el.getAttribute("x2"));
        const y2 = num(el.getAttribute("y2"));
        return Math.hypot(x2 - x1, y2 - y1) || 1;
      }
      if (tag === "rect") {
        const w = Math.abs(num(el.getAttribute("width")));
        const h = Math.abs(num(el.getAttribute("height")));
        return 2 * (w + h) || 1;
      }
      if (tag === "circle") {
        const r = Math.abs(num(el.getAttribute("r")));
        return 2 * Math.PI * r || 1;
      }
      if (tag === "ellipse") {
        const rx = Math.abs(num(el.getAttribute("rx")));
        const ry = Math.abs(num(el.getAttribute("ry")));
        const a = Math.max(rx, ry);
        const b = Math.min(rx, ry);
        return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))) || 1;
      }
      if (tag === "polyline" || tag === "polygon") {
        const pts = (el.getAttribute("points") || "").trim().split(/\s+/).map((p) => p.split(",").map(Number)).filter((a) => a.length === 2 && a.every((n) => Number.isFinite(n)));
        let len = 0;
        for (let i = 1; i < pts.length; i += 1) len += Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]);
        if (tag === "polygon" && pts.length > 2) len += Math.hypot(pts[0][0] - pts[pts.length-1][0], pts[0][1] - pts[pts.length-1][1]);
        return len || 1;
      }
      // fallback
      const b = el.getBBox ? el.getBBox() : { width: 100, height: 100 };
      return 2 * (b.width + b.height) || 1;
    };

    // 2) احسب أطوال المسارات ومدد الخطوات دون تغيير خصائص الشعار النهائي
    const speedDivisor = 1000; // عدل السرعة العامة هنا
    stepItems.forEach((it) => {
      const len = computeLen(it.p);
      it.len = len;
      it.dur = len / speedDivisor;
    });
    const MIN_LEN = 12; // تجاهل العناصر القصيرة جدًا التي تنتج نقاطًا عند الرسم
    const drawItems = stepItems.filter((it) => it.len >= MIN_LEN);
    // حضّر حروف الاسم إن وجد: الترتيب الصريح C,O,N,R,D مرتبط بمجموعات خطوات محددة
    const textSvg = nameHostRef.current?.querySelector("svg");
    const letterOrder = ["c", "o", "n", "r", "d"];
    const stepGroups = [ [1,2], [3], [4], [5], [6] ];
    const letterEntries = [];
    if (textSvg) {
      // استخدم svg مباشرة: المسارات هنا مباشرة في المثال المرسل
      const directPaths = Array.from(textSvg.querySelectorAll(":scope > path, :scope > line, :scope > polyline, :scope > polygon, :scope > rect, :scope > circle, :scope > ellipse"));
      const used = new Set();
      const getId = (p) => (p.getAttribute("id") || p.getAttribute("data-name") || "").trim().toLowerCase();
      letterOrder.forEach((ch) => {
        const rx = new RegExp(`^${ch}\\d*$`, "i"); // يدعم C و C1، O و O1 ...
        const matches = directPaths.filter((p) => rx.test(getId(p)) && !used.has(p));
        if (!matches.length) return;
        matches.forEach((p) => {
          used.add(p);
          const b = p.getBBox();
          const w = Math.max(1, b.width);
          const h = Math.max(1, b.height);
          const pad = Math.max(w, h) * 0.08;
          const x1 = b.x - pad;
          const y1 = b.y + h + pad;
          const x2 = b.x + w + pad;
          const y2 = b.y - pad;
          const L = Math.hypot(x2 - x1, y2 - y1);
          const strike = document.createElementNS("http://www.w3.org/2000/svg", "line");
          strike.setAttribute("x1", String(x1));
          strike.setAttribute("y1", String(y1));
          strike.setAttribute("x2", String(x2));
          strike.setAttribute("y2", String(y2));
          strike.setAttribute("stroke", "#eef0e4");
          strike.setAttribute("stroke-width", "3");
          strike.setAttribute("stroke-linecap", "round");
          strike.setAttribute("vector-effect", "non-scaling-stroke");
          strike.style.strokeDasharray = String(L);
          strike.style.strokeDashoffset = String(L);
          strike.style.opacity = "0.85";
          textSvg.appendChild(strike);
          letterEntries.push({ key: ch, paths: [p], strike, strikeLen: L });
        });
      });
    }

    // 4) أنشئ تايملاين GSAP: لا نغيّر الشعار النهائي، نستخدم مدد خطواته فقط لتوقيت الاسم
    const ctx = gsap.context(() => {
      const logoTl = gsap.timeline({ defaults: { ease: "none" } });
      const textTl = gsap.timeline({ defaults: { ease: "none" } });
      // جدولة وقت بدء كل خطوة وتجميع مدد المجموعات
      let currentTime = 0;
      const stepStart = new Map();
      const stepDur = new Map();
      // أنشئ طبقة تراكب لرسم الشعار كخُطوط فقط (لا نلمس الشعار المعروض)
      // أخفِ svg الأصلي أثناء الرسم ثم أظهره بعد الاكتمال
      const prevVis = svg.style.visibility;
      svg.style.visibility = "hidden";

      const overlayHost = document.createElement("div");
      overlayHost.style.position = "absolute";
      overlayHost.style.inset = "0";
      overlayHost.style.pointerEvents = "none";
      host.appendChild(overlayHost);
      const overlaySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const vb = svg.getAttribute("viewBox");
      if (vb) overlaySvg.setAttribute("viewBox", vb);
      overlaySvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      overlaySvg.setAttribute("width", "100%");
      overlaySvg.setAttribute("height", "100%");
      overlaySvg.style.pointerEvents = "none";
      overlayHost.appendChild(overlaySvg);
      // انسخ أنماط final.svg إلى طبقة التراكب لضمان نفس المظهر
      svg.querySelectorAll("style").forEach((st) => {
        try { overlaySvg.appendChild(st.cloneNode(true)); } catch {}
      });

      const clones = drawItems.map((it) => {
        const c = it.p.cloneNode(true);
        // لا نغيّر الشعار الأصلي؛ نضبط خصائص التراكب فقط
        try {
          const cs = window.getComputedStyle(it.p);
          const stroke = cs.stroke;
          const sw = cs.strokeWidth;
          if (stroke && stroke !== "none") c.setAttribute("stroke", stroke);
          if (sw) c.setAttribute("stroke-width", sw);
          // منع تعبئة غير مقصودة
          c.setAttribute("fill", "none");
          // لمنع نقاط عند الأطراف
          c.setAttribute("stroke-linecap", "butt");
        } catch {}
        const L = computeLen(c);
        // اجعل الفجوة أكبر من الطول لمنع التفاف الداش الذي يسبب نقاط متعددة
        c.style.strokeDasharray = `${L} ${L * 2}`;
        c.style.strokeDashoffset = String(L + 0.5);
        overlaySvg.appendChild(c);
        return c;
      });

      // احسب زمن البدء/المدة لكل رقم خطوة اعتمادًا على العناصر المرسومة فقط
      const grouped = new Map();
      drawItems.forEach((it) => {
        grouped.set(it.num, (grouped.get(it.num) || 0) + it.dur);
      });
      Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]).forEach(([num, total]) => {
        // ارسم عناصر هذه المرحلة
        drawItems.filter((it) => it.num === num).forEach((it) => {
          const idx = drawItems.indexOf(it);
          logoTl.to(clones[idx], { strokeDashoffset: 0, duration: it.dur }, currentTime);
          currentTime += it.dur;
        });
        // بعد اكتمال الرسم: جدول الشطب لهذه المرحلة قبل البدء في المرحلة التالية
        const strikeStart = currentTime;
        const strikeDur = Math.max(0.35, Math.min(1.0, total * 0.6));
        stepStart.set(num, strikeStart);
        stepDur.set(num, strikeDur);
        currentTime += strikeDur; // اترك فسحة زمنية للشطب قبل المرحلة التالية
      });

      // عند اكتمال الرسم: اترك التراكب ظاهرًا ولا تعرض svg الأصلي
      // (لا إجراء هنا)

      // أضف حروف الاسم على تايملاين منفصل
      const lettersForGroups = ["c","o","n","r","d"];
      stepGroups.forEach((nums, idx) => {
        const letterKey = lettersForGroups[idx];
        const entries = letterEntries.filter((e) => e.key === letterKey);
        if (!entries.length) return;
        const start = Math.max(...nums.map((n) => stepStart.get(n) ?? -Infinity));
        const baseDur = nums.reduce((s, n) => s + (grouped.get(n) || 0), 0);
        const duration = Math.max(0.35, Math.min(1.2, baseDur * 0.6));
        if (!isFinite(start) || duration <= 0) return;
        entries.forEach((e) => {
          textTl.add(gsap.to(e.paths, { opacity: 0.35, duration: 0.25 }), start);
          if (e.strike) textTl.add(gsap.to(e.strike, { strokeDashoffset: 0, duration }), start);
        });
      });

      tlRef.current = { logoTl, textTl, overlayHost };
    }, host);
    return () => {
      if (tlRef.current?.logoTl) tlRef.current.logoTl.kill();
      if (tlRef.current?.textTl) tlRef.current.textTl.kill();
      if (tlRef.current?.overlayHost) tlRef.current.overlayHost.remove();
      try { svg.style.visibility = prevVis || ""; } catch {}
      ctx.revert();
      tlRef.current = null;
    };
  }, [merged, finalSvgPrepared, runId]);
  return (
    <section className="relative z-10 min-h-[100dvh] grid place-items-center px-4 md:px-6" data-no-nav>
      <div className="max-w-5xl mx-auto w-full">
        <AnimatePresence>
          {merged && (
            <div
              className="mt-6 md:mt-10 grid place-items-center cursor-pointer select-none"
              role="button"
              onClick={() => {
                // إعادة التشغيل بعد الانتهاء أو أثناء التشغيل
                setRunId((v) => v + 1);
              }}
            >
              <div className="relative w-44 h-44 md:w-64 md:h-64">
                {/* عرض final.svg كنص وإجراء الأنيميشن داخل DOM */}
                {finalSvgPrepared ? (
                  <div
                    ref={svgHostRef}
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{ __html: finalSvgPrepared }}
                  />
                ) : (
                  <motion.img
                    src={finalLogo}
                    alt="final"
                    className="absolute inset-0 w-full h-full object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </div>
              {nameSvgPrepared ? (
                <div className="relative mt-12 md:mt-12 w-56 md:w-72 h-10 md:h-12">
                  <div
                    ref={nameHostRef}
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{ __html: nameSvgPrepared }}
                  />
                </div>
              ) : null}
            </div>
          )}
        </AnimatePresence>
        {merged && (
          <p className="mt-8 text-center text-sm md:text-base tracking-wide leading-relaxed text-neutral-200/80">
            This art concords naturally into a balanced, harmonious symbol that reflects the values of architectural planning.
          </p>
        )}
        {!merged && (
          <>
            <div
              className="mt-6 md:mt-10 grid place-items-center cursor-pointer select-none"
              role="button"
              onClick={() => {
                setMerged(true);
                setRunId((v) => v + 1);
              }}
            >
              <div className="relative w-44 h-44 md:w-64 md:h-64">
                {finalSvgPrepared ? (
                  <div
                    ref={svgHostRef}
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{ __html: finalSvgPrepared }}
                  />
                ) : (
                  <img src={finalLogo} alt="final" className="absolute inset-0 w-full h-full object-contain" />
                )}
              </div>
              {nameSvgPrepared ? (
                <div className="relative mt-12 md:mt-12 w-56 md:w-72 h-10 md:h-12">
                  <div
                    ref={nameHostRef}
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{ __html: nameSvgPrepared }}
                  />
                </div>
              ) : null}
            </div>
            <p className="mt-8 text-center text-sm md:text-base tracking-wide leading-relaxed text-neutral-200/80">
              This art concords naturally into a balanced, harmonious symbol that reflects the values of architectural planning.
            </p>
            <div
              className="mt-4 text-center text-xs md:text-sm opacity-70 cursor-pointer select-none"
              role="button"
              onClick={() => setMerged(true)}
            >
              
            </div>
          </>
        )}
        {/* controls hidden for direct auto start */}
      </div>
      <div className="pointer-events-none absolute bottom-10 md:bottom-12 left-0 right-0 text-center text-[10px] md:text-xs opacity-60">
        By : ABDULLAH ALASMSARI - 2025 @ ALL RIGHTS RESERVED
      </div>
    </section>
  );
}

