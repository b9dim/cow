import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

function getContentType(fileName) {
	const ext = path.extname(fileName).toLowerCase();
	if (ext === ".svg") return "image/svg+xml";
	if (ext === ".png") return "image/png";
	if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
	if (ext === ".webp") return "image/webp";
	if (ext === ".gif") return "image/gif";
	return "application/octet-stream";
}

export async function GET(_req, { params }) {
	try {
		const segments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
		const safeSegments = segments.map((p) => path.basename(p));
		const filePath = path.join(process.cwd(), "svg", ...safeSegments);
		const data = await fs.readFile(filePath);
		return new NextResponse(data, {
			headers: {
				"Content-Type": getContentType(safeSegments[safeSegments.length - 1]),
				"Cache-Control": "no-store, must-revalidate",
			},
		});
	} catch (err) {
		return new NextResponse("Not Found", { status: 404 });
	}
}


