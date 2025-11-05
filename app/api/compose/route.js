import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export async function GET() {
	try {
		// اقرأ من مجلد svg: ضع final.* في النهاية لعرض الدمج
		const dir = path.join(process.cwd(), "svg");
		const entries = await fs.readdir(dir, { withFileTypes: true });
		const names = entries
			.filter((e) => e.isFile())
			.map((e) => e.name)
			.filter((n) => /\.(svg|png|jpe?g|webp)$/i.test(n))
			.sort(naturalCompare);
		const finals = names.filter((n) => /^final(\.|$)/i.test(n));
		const parts = names.filter((n) => !/^final(\.|$)/i.test(n));
		const ordered = [...parts, ...finals];
		const images = ordered.map((n) => `/api/svg/${n}`);
		return NextResponse.json({ images });
	} catch (err) {
		return NextResponse.json({ images: [], error: String(err) });
	}
}


