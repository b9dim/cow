import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

function getContentType(fileName) {
	const ext = path.extname(fileName).toLowerCase();
	if (ext === ".svg") return "image/svg+xml";
	if (ext === ".png") return "image/png";
	if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
	if (ext === ".webp") return "image/webp";
	return "application/octet-stream";
}

export async function GET(_req, { params }) {
	try {
		const safeName = path.basename(params.name);
		const filePath = path.join(process.cwd(), "svg", safeName);
		const data = await fs.readFile(filePath);
		return new NextResponse(data, {
			headers: {
				"Content-Type": getContentType(safeName),
				"Cache-Control": "no-store, must-revalidate",
			},
		});
	} catch (err) {
		return new NextResponse("Not Found", { status: 404 });
	}
}


