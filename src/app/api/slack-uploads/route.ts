import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force dynamic — never cache this route (data changes from Slack bot writes)
export const dynamic = 'force-dynamic';

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
    return NextResponse.json(metadata, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch {
    return NextResponse.json([]);
  }
}
