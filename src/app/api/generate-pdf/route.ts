/**
 * PDF Generation API Route
 * 
 * Handles PDF generation requests from the AI Query system
 * Uses server-only PDF generators to avoid client-side bundling issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildLocationGraph, locationSummaries, type LocationGraph } from '@/app/data/locationGraphs';
import {
  generateLocationReportBuffer,
  generateKnowledgeGraphPDFBuffer,
  convertLocationGraphToReportData,
  convertLocationGraphToKnowledgeGraphData,
} from './pdf-generators';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, locationId } = body;

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Get location and graph data
    const location = locationSummaries.find((l) => l.id === locationId);
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const graphData: LocationGraph = buildLocationGraph(locationId);

    let pdfBuffer: Buffer;
    let filename: string;

    if (type === 'location-report' || !type) {
      // Generate location report
      const reportData = convertLocationGraphToReportData(locationId, location, graphData);
      pdfBuffer = await generateLocationReportBuffer(reportData);
      filename = `location-report-${locationId}-${Date.now()}.pdf`;
    } else if (type === 'knowledge-graph') {
      // Generate knowledge graph PDF
      const graphDataForPDF = convertLocationGraphToKnowledgeGraphData(locationId, location, graphData);
      pdfBuffer = await generateKnowledgeGraphPDFBuffer(graphDataForPDF);
      filename = `knowledge-graph-${locationId}-${Date.now()}.pdf`;
    } else {
      return NextResponse.json(
        { error: `Unknown PDF type: ${type}` },
        { status: 400 }
      );
    }

    // Return PDF as response
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
