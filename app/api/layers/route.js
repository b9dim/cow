import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export async function GET() {
	try {
		// اقرأ من مجلد svg في الجذر: استثنِ final.* وضع الروابط عبر /api/svg
		const dir = path.join(process.cwd(), "svg");
		const entries = await fs.readdir(dir, { withFileTypes: true });
		const names = entries
			.filter((e) => e.isFile())
			.map((e) => e.name)
			.filter((n) => /\.(png|jpe?g|webp|svg)$/i.test(n))
			.sort(naturalCompare)
			.filter((n) => !/^final(\.|$)/i.test(n));
		const images = names.map((n) => `/api/svg/${n}`);
		return NextResponse.json({ images });
	} catch (err) {
		return NextResponse.json({ images: [], error: String(err) });
	}
}


