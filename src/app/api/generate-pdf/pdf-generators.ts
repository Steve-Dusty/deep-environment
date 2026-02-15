import PDFDocument from 'pdfkit';
import type { LocationGraph, LocationSummary } from '@/app/data/locationGraphs';

interface LocationReportData {
  locationId: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  problems: Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    description: string;
    trend: string;
    confidence: number;
  }>;
  summary: {
    totalProblems: number;
    severity: string;
    lastUpdated: string;
    confidence: number;
  };
}

interface KnowledgeGraphData {
  locationId: string;
  locationName: string;
  nodes: Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    description: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: string;
    strength?: number;
  }>;
  metadata: {
    generatedAt: string;
    nodeCount: number;
    linkCount: number;
  };
}

export function convertLocationGraphToReportData(
  locationId: string,
  location: LocationSummary,
  graphData: LocationGraph,
): LocationReportData {
  return {
    locationId,
    locationName: location.name,
    coordinates: { lat: location.coordinates[1], lng: location.coordinates[0] },
    problems: graphData.problems.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      severity: p.severity,
      description: p.description,
      trend: p.trend,
      confidence: p.confidence,
    })),
    summary: {
      totalProblems: graphData.problems.length,
      severity: location.overallSeverity,
      lastUpdated: location.lastUpdated,
      confidence: location.confidence,
    },
  };
}

export function convertLocationGraphToKnowledgeGraphData(
  locationId: string,
  location: LocationSummary,
  graphData: LocationGraph,
): KnowledgeGraphData {
  const nodes = graphData.problems.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    severity: p.severity,
    description: p.description,
  }));

  const links = graphData.links.map((l) => ({
    source: l.source,
    target: l.target,
    type: l.type,
    strength: l.strength,
  }));

  return {
    locationId,
    locationName: location.name,
    nodes,
    links,
    metadata: {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      linkCount: links.length,
    },
  };
}

export async function generateLocationReportBuffer(data: LocationReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).text(data.locationName, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Location ID: ${data.locationId}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(
        `Coordinates: ${data.coordinates.lat.toFixed(6)}, ${data.coordinates.lng.toFixed(6)}`,
        { align: 'center' },
      );
      doc.moveDown(2);

      doc.fontSize(18).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Problems: ${data.summary.totalProblems}`);
      doc.text(`Severity: ${data.summary.severity}`);
      doc.text(`Last Updated: ${data.summary.lastUpdated}`);
      doc.text(`Confidence: ${data.summary.confidence}%`);
      doc.moveDown(2);

      doc.fontSize(18).text('Problems', { underline: true });
      doc.moveDown();

      data.problems.forEach((problem, index) => {
        doc.fontSize(14).text(`${index + 1}. ${problem.name}`);
        doc.fontSize(10);
        doc.text(`Category: ${problem.category}`);
        doc.text(`Severity: ${problem.severity}`);
        doc.text(`Trend: ${problem.trend}`);
        doc.text(`Confidence: ${problem.confidence}%`);
        doc.text(`Description: ${problem.description}`);
        doc.moveDown();
      });

      doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateKnowledgeGraphPDFBuffer(data: KnowledgeGraphData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).text('Knowledge Graph', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(data.locationName, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(12);
      doc.text(`Nodes: ${data.metadata.nodeCount}`);
      doc.text(`Links: ${data.metadata.linkCount}`);
      doc.text(`Generated: ${data.metadata.generatedAt}`);
      doc.moveDown(2);

      doc.fontSize(18).text('Nodes', { underline: true });
      doc.moveDown();

      data.nodes.forEach((node, index) => {
        doc.fontSize(12).text(`${index + 1}. ${node.name}`);
        doc.fontSize(10);
        doc.text(`Category: ${node.category}`);
        doc.text(`Severity: ${node.severity}`);
        doc.text(`Description: ${node.description}`);
        doc.moveDown();
      });

      doc.addPage();
      doc.fontSize(18).text('Relationships', { underline: true });
      doc.moveDown();

      data.links.forEach((link, index) => {
        doc.fontSize(10);
        const sourceNode = data.nodes.find((n) => n.id === link.source);
        const targetNode = data.nodes.find((n) => n.id === link.target);
        doc.text(
          `${index + 1}. ${sourceNode?.name || link.source} → ${link.type} → ${targetNode?.name || link.target}`,
        );
        if (link.strength) {
          doc.text(`   Strength: ${link.strength}`);
        }
        doc.moveDown();
      });

      doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
