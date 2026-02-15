import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'composio-slack-test', 'uploads');
const METADATA_FILE = path.join(UPLOADS_DIR, 'metadata.json');

export async function GET() {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      return NextResponse.json([]);
    }
    const raw = fs.readFileSync(METADATA_FILE, 'utf-8');
    const metadata = JSON.parse(raw);
    // Sort newest first
    metadata.sort(
      (a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp,
    );
    return NextResponse.json(metadata);
  } catch {
    return NextResponse.json([]);
  }
}
