import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".admin-data");
const MISSING_FILE = join(DATA_DIR, "missing-queries.json");

type MissingEntry = { id: string; query: string; timestamp: string };

function readMissing(): MissingEntry[] {
  try {
    if (!existsSync(MISSING_FILE)) return [];
    return JSON.parse(readFileSync(MISSING_FILE, "utf-8")) as MissingEntry[];
  } catch {
    return [];
  }
}

function writeMissing(entries: MissingEntry[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(MISSING_FILE, JSON.stringify(entries.slice(0, 200), null, 2), "utf-8");
}

export async function GET() {
  const entries = readMissing();
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query) return NextResponse.json({ ok: false });
    const entries = readMissing();
    const entry: MissingEntry = {
      id: crypto.randomUUID(),
      query: String(query).slice(0, 300),
      timestamp: new Date().toISOString()
    };
    writeMissing([entry, ...entries]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE() {
  writeMissing([]);
  return NextResponse.json({ ok: true });
}
