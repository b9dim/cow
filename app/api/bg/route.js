import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export async function GET() {
  try {
    // 1) حاول public/bg
    const pubDir = path.join(process.cwd(), "public", "bg");
    let pubEntries = [];
    try { pubEntries = await fs.readdir(pubDir, { withFileTypes: true }); } catch {}
    const pubImages = (pubEntries || [])
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => /\.(png|jpe?g|webp|gif|svg)$/i.test(n))
      .sort(naturalCompare)
      .map((n) => `/bg/${n}`);
    if (pubImages.length) return NextResponse.json({ images: pubImages });

    // 2)fallback: svg/bg باستخدام api/svg-path
    const svgBgDir = path.join(process.cwd(), "svg", "bg");
    let svgEntries = [];
    try { svgEntries = await fs.readdir(svgBgDir, { withFileTypes: true }); } catch {}
    const svgImages = (svgEntries || [])
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => /\.(png|jpe?g|webp|gif|svg)$/i.test(n))
      .sort(naturalCompare)
      .map((n) => `/api/svg-path/bg/${n}`);
    return NextResponse.json({ images: svgImages });
  } catch (err) {
    return NextResponse.json({ images: [], error: String(err) });
  }
}


