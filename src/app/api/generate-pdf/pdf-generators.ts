import PDFDocument from 'pdfkit';
import type { LocationGraph, LocationSummary } from '@/app/data/locationGraphs';

// ── Types ────────────────────────────────────────────────────────────────────

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
    indicators?: string[];
    causes?: string[];
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

// ── Color Palette ────────────────────────────────────────────────────────────

const COLORS = {
  // Severity
  critical: '#DC2626',
  high: '#EA580C',
  elevated: '#D97706',
  moderate: '#2563EB',
  low: '#16A34A',
  // Categories
  pollution: '#EF4444',
  deforestation: '#F59E0B',
  runoff: '#06B6D4',
  wildfire: '#F97316',
  litter: '#6B7280',
  erosion: '#8B5CF6',
  invasive: '#22C55E',
  drought: '#3B82F6',
  contamination: '#E11D48',
  other: '#6B7280',
  // Link types
  causes: '#EF4444',
  amplifies: '#F59E0B',
  mitigates: '#22C55E',
  correlates: '#8B5CF6',
  // UI
  bg: '#0F172A',
  bgCard: '#1E293B',
  bgLight: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  accent: '#38BDF8',
  accentAlt: '#818CF8',
  border: '#475569',
  white: '#FFFFFF',
  black: '#000000',
};

const SEVERITY_ORDER = ['critical', 'high', 'elevated', 'moderate', 'low'];
const SEVERITY_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  elevated: 'ELEVATED',
  moderate: 'MODERATE',
  low: 'LOW',
};

// ── Drawing Helpers ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function drawRoundedRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  doc.moveTo(x + r, y);
  doc.lineTo(x + w - r, y);
  doc.quadraticCurveTo(x + w, y, x + w, y + r);
  doc.lineTo(x + w, y + h - r);
  doc.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  doc.lineTo(x + r, y + h);
  doc.quadraticCurveTo(x, y + h, x, y + h - r);
  doc.lineTo(x, y + r);
  doc.quadraticCurveTo(x, y, x + r, y);
  doc.closePath();
}

function drawFilledRoundedRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
) {
  doc.save();
  drawRoundedRect(doc, x, y, w, h, r);
  doc.fillColor(fillColor).fill();
  doc.restore();
}

function drawHorizontalBarChart(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  data: Array<{ label: string; value: number; color: string }>,
  title: string,
) {
  const barHeight = 22;
  const barGap = 8;
  const labelWidth = 80;
  const valueWidth = 40;
  const barAreaWidth = width - labelWidth - valueWidth - 10;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  // Title
  doc.fillColor(COLORS.bg).fontSize(13).font('Helvetica-Bold');
  doc.text(title, x, y);
  y += 24;

  // Bars
  data.forEach((item, i) => {
    const by = y + i * (barHeight + barGap);
    const barW = (item.value / maxVal) * barAreaWidth;

    // Label
    doc.fillColor(COLORS.bgLight).fontSize(10).font('Helvetica');
    doc.text(item.label, x, by + 5, { width: labelWidth, align: 'right' });

    // Bar background
    const barX = x + labelWidth + 8;
    drawFilledRoundedRect(doc, barX, by + 2, barAreaWidth, barHeight - 4, 4, '#E2E8F0');

    // Bar fill
    if (barW > 0) {
      drawFilledRoundedRect(doc, barX, by + 2, Math.max(barW, 8), barHeight - 4, 4, item.color);
    }

    // Value
    doc.fillColor(COLORS.bg).fontSize(10).font('Helvetica-Bold');
    doc.text(String(item.value), barX + barAreaWidth + 6, by + 5, {
      width: valueWidth,
    });
  });

  return y + data.length * (barHeight + barGap) + 10;
}

function drawDonutChart(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  data: Array<{ label: string; value: number; color: string }>,
  title: string,
) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return cy + outerR * 2 + 40;

  // Title
  doc.fillColor(COLORS.bg).fontSize(13).font('Helvetica-Bold');
  doc.text(title, cx - outerR - 20, cy - outerR - 30, {
    width: outerR * 2 + 40,
    align: 'center',
  });

  let startAngle = -Math.PI / 2;

  data.forEach((item) => {
    if (item.value === 0) return;
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    // Draw slice using path
    doc.save();
    doc.path(describeArc(cx, cy, outerR, innerR, startAngle, endAngle));
    doc.fillColor(item.color).fill();
    doc.restore();

    startAngle = endAngle;
  });

  // Center text
  doc.fillColor(COLORS.bg).fontSize(20).font('Helvetica-Bold');
  doc.text(String(total), cx - 20, cy - 12, { width: 40, align: 'center' });
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica');
  doc.text('TOTAL', cx - 20, cy + 8, { width: 40, align: 'center' });

  // Legend (to the right of the donut)
  const legendX = cx + outerR + 20;
  let legendY = cy - (data.filter((d) => d.value > 0).length * 16) / 2;

  data.forEach((item) => {
    if (item.value === 0) return;
    doc.save();
    doc.rect(legendX, legendY + 2, 10, 10).fillColor(item.color).fill();
    doc.restore();
    doc.fillColor(COLORS.bg).fontSize(9).font('Helvetica');
    doc.text(
      `${item.label} (${item.value})`,
      legendX + 16,
      legendY + 1,
      { width: 120 },
    );
    legendY += 16;
  });

  return cy + outerR + 30;
}

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStartX = cx + outerR * Math.cos(startAngle);
  const outerStartY = cy + outerR * Math.sin(startAngle);
  const outerEndX = cx + outerR * Math.cos(endAngle);
  const outerEndY = cy + outerR * Math.sin(endAngle);
  const innerStartX = cx + innerR * Math.cos(endAngle);
  const innerStartY = cy + innerR * Math.sin(endAngle);
  const innerEndX = cx + innerR * Math.cos(startAngle);
  const innerEndY = cy + innerR * Math.sin(startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerStartX} ${innerStartY}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEndX} ${innerEndY}`,
    'Z',
  ].join(' ');
}

function drawGauge(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  radius: number,
  value: number,
  label: string,
  color: string,
) {
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const valueAngle = startAngle + ((value / 100) * (endAngle - startAngle));

  // Background arc
  const bgSegments = 40;
  for (let i = 0; i < bgSegments; i++) {
    const a1 = startAngle + (i / bgSegments) * (endAngle - startAngle);
    const a2 = startAngle + ((i + 1) / bgSegments) * (endAngle - startAngle);
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy + radius * Math.sin(a2);
    doc.save();
    doc.lineWidth(8).strokeColor('#E2E8F0');
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
    doc.restore();
  }

  // Value arc
  const valSegments = Math.max(1, Math.round(bgSegments * (value / 100)));
  for (let i = 0; i < valSegments; i++) {
    const a1 = startAngle + (i / bgSegments) * (endAngle - startAngle);
    const a2 = startAngle + ((i + 1) / bgSegments) * (endAngle - startAngle);
    if (a2 > valueAngle) break;
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy + radius * Math.sin(a2);
    doc.save();
    doc.lineWidth(8).strokeColor(color);
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
    doc.restore();
  }

  // Center value text
  doc.fillColor(COLORS.bg).fontSize(18).font('Helvetica-Bold');
  doc.text(`${value}%`, cx - 25, cy - 10, { width: 50, align: 'center' });

  // Label
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica');
  doc.text(label, cx - 35, cy + 10, { width: 70, align: 'center' });
}

function drawMetricCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  color: string,
) {
  // Card background
  drawFilledRoundedRect(doc, x, y, w, h, 6, '#F1F5F9');

  // Colored top accent
  doc.save();
  doc.rect(x, y, w, 4).fillColor(color).fill();
  doc.restore();

  // Value
  doc.fillColor(COLORS.bg).fontSize(22).font('Helvetica-Bold');
  doc.text(value, x + 8, y + 16, { width: w - 16, align: 'center' });

  // Label
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica');
  doc.text(label.toUpperCase(), x + 8, y + 42, { width: w - 16, align: 'center' });
}

function drawTrendIndicator(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  trend: string,
) {
  const trendColor =
    trend === 'worsening' ? COLORS.critical :
    trend === 'improving' ? COLORS.low : COLORS.moderate;

  const trendSymbol =
    trend === 'worsening' ? '\u25B2' : // up triangle (bad)
    trend === 'improving' ? '\u25BC' : // down triangle (good)
    '\u25CF'; // dot (stable)

  doc.fillColor(trendColor).fontSize(8).font('Helvetica');
  doc.text(`${trendSymbol} ${trend.toUpperCase()}`, x, y, { width: 80 });
}

function drawSeverityBadge(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  severity: string,
) {
  const color = COLORS[severity as keyof typeof COLORS] || COLORS.bgLight;
  const label = SEVERITY_LABELS[severity] || severity.toUpperCase();

  drawFilledRoundedRect(doc, x, y, 65, 16, 8, color);
  doc.fillColor(COLORS.white).fontSize(7).font('Helvetica-Bold');
  doc.text(label, x + 4, y + 3, { width: 57, align: 'center' });
}

function drawPageHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle: string,
) {
  // Dark header bar
  doc.rect(0, 0, doc.page.width, 90).fill(COLORS.bg);

  // Accent line
  doc.rect(0, 88, doc.page.width, 3).fill(COLORS.accent);

  // Logo mark
  doc.save();
  doc.circle(50, 45, 16).fill(COLORS.accent);
  doc.fillColor(COLORS.bg).fontSize(16).font('Helvetica-Bold');
  doc.text('DE', 38, 37, { width: 24, align: 'center' });
  doc.restore();

  // Title
  doc.fillColor(COLORS.white).fontSize(22).font('Helvetica-Bold');
  doc.text(title, 80, 22);

  // Subtitle
  doc.fillColor(COLORS.textMuted).fontSize(10).font('Helvetica');
  doc.text(subtitle, 80, 50);

  // Date
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica');
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    doc.page.width - 200,
    70,
    { width: 160, align: 'right' },
  );
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNum: number) {
  const y = doc.page.height - 40;
  doc.rect(0, y - 5, doc.page.width, 45).fill('#F8FAFC');
  doc.rect(0, y - 5, doc.page.width, 1).fill(COLORS.border);

  doc.fillColor(COLORS.textMuted).fontSize(7).font('Helvetica');
  doc.text('DEEP ENVIRONMENT  |  Environmental Monitoring Intelligence', 50, y + 5);

  doc.text(`Page ${pageNum}`, doc.page.width - 100, y + 5, {
    width: 60,
    align: 'right',
  });

  doc.text('CONFIDENTIAL', doc.page.width / 2 - 40, y + 5, {
    width: 80,
    align: 'center',
  });
}

function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  title: string,
  width: number,
) {
  doc.rect(x, y, 4, 20).fill(COLORS.accent);
  doc.fillColor(COLORS.bg).fontSize(14).font('Helvetica-Bold');
  doc.text(title, x + 12, y + 3);
  doc.rect(x, y + 24, width, 1).fill('#E2E8F0');
  return y + 32;
}

// ── Converters ───────────────────────────────────────────────────────────────

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
      indicators: p.indicators,
      causes: p.causes,
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

// ── Location Report PDF ──────────────────────────────────────────────────────

export async function generateLocationReportBuffer(data: LocationReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      // ── Page 1: Header + Executive Summary + Charts ──────────────────

      drawPageHeader(
        doc,
        data.locationName,
        `Environmental Threat Assessment  |  ${data.locationId}  |  ${data.coordinates.lat.toFixed(4)}, ${data.coordinates.lng.toFixed(4)}`,
      );

      let y = 110;

      // Executive summary metric cards
      const cardW = (contentWidth - 30) / 4;
      const severityColor = COLORS[data.summary.severity as keyof typeof COLORS] || COLORS.bgLight;

      drawMetricCard(doc, margin, y, cardW, 60, String(data.summary.totalProblems), 'Active Problems', COLORS.accent);
      drawMetricCard(doc, margin + cardW + 10, y, cardW, 60, data.summary.severity.toUpperCase(), 'Threat Level', severityColor);
      drawMetricCard(doc, margin + (cardW + 10) * 2, y, cardW, 60, `${data.summary.confidence}%`, 'Confidence', COLORS.accentAlt);
      drawMetricCard(doc, margin + (cardW + 10) * 3, y, cardW, 60, data.summary.lastUpdated, 'Last Updated', COLORS.bgLight);

      y += 85;

      // ── Severity Distribution Bar Chart ──────────────────────────────

      const severityCounts: Record<string, number> = {};
      data.problems.forEach((p) => {
        severityCounts[p.severity] = (severityCounts[p.severity] || 0) + 1;
      });

      const severityData = SEVERITY_ORDER
        .filter((s) => severityCounts[s])
        .map((s) => ({
          label: SEVERITY_LABELS[s] || s,
          value: severityCounts[s] || 0,
          color: COLORS[s as keyof typeof COLORS] || COLORS.bgLight,
        }));

      const chartLeftWidth = contentWidth * 0.5;

      y = drawSectionHeader(doc, margin, y, 'Threat Overview', contentWidth);
      y += 8;

      const chartStartY = y;
      const barChartEndY = drawHorizontalBarChart(
        doc,
        margin,
        y,
        chartLeftWidth - 20,
        severityData,
        'Severity Distribution',
      );

      // ── Category Donut Chart (right side) ────────────────────────────

      const categoryCounts: Record<string, number> = {};
      data.problems.forEach((p) => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      });

      const categoryData = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => ({
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          value: count,
          color: COLORS[cat as keyof typeof COLORS] || COLORS.bgLight,
        }));

      const donutCx = margin + chartLeftWidth + (contentWidth - chartLeftWidth) / 2 - 30;
      const donutCy = chartStartY + 70;
      drawDonutChart(doc, donutCx, donutCy, 50, 28, categoryData, 'Category Breakdown');

      y = Math.max(barChartEndY, chartStartY + 160) + 10;

      // ── Trend Summary ────────────────────────────────────────────────

      const trendCounts = { worsening: 0, stable: 0, improving: 0 };
      data.problems.forEach((p) => {
        if (p.trend in trendCounts) trendCounts[p.trend as keyof typeof trendCounts]++;
      });

      y = drawSectionHeader(doc, margin, y, 'Trend Analysis', contentWidth);
      y += 5;

      const trendBarWidth = contentWidth - 20;
      const trendTotal = data.problems.length || 1;

      // Stacked horizontal bar
      const wPct = trendCounts.worsening / trendTotal;
      const sPct = trendCounts.stable / trendTotal;
      const iPct = trendCounts.improving / trendTotal;

      let tx = margin + 10;
      if (wPct > 0) {
        drawFilledRoundedRect(doc, tx, y, trendBarWidth * wPct, 20, 3, COLORS.critical);
        if (trendBarWidth * wPct > 30) {
          doc.fillColor(COLORS.white).fontSize(7).font('Helvetica-Bold');
          doc.text(String(trendCounts.worsening), tx + 4, y + 5, { width: trendBarWidth * wPct - 8 });
        }
        tx += trendBarWidth * wPct + 2;
      }
      if (sPct > 0) {
        drawFilledRoundedRect(doc, tx, y, trendBarWidth * sPct, 20, 3, COLORS.moderate);
        if (trendBarWidth * sPct > 30) {
          doc.fillColor(COLORS.white).fontSize(7).font('Helvetica-Bold');
          doc.text(String(trendCounts.stable), tx + 4, y + 5, { width: trendBarWidth * sPct - 8 });
        }
        tx += trendBarWidth * sPct + 2;
      }
      if (iPct > 0) {
        drawFilledRoundedRect(doc, tx, y, trendBarWidth * iPct, 20, 3, COLORS.low);
        if (trendBarWidth * iPct > 30) {
          doc.fillColor(COLORS.white).fontSize(7).font('Helvetica-Bold');
          doc.text(String(trendCounts.improving), tx + 4, y + 5, { width: trendBarWidth * iPct - 8 });
        }
      }

      y += 28;

      // Trend legend
      const legends = [
        { label: `Worsening (${trendCounts.worsening})`, color: COLORS.critical },
        { label: `Stable (${trendCounts.stable})`, color: COLORS.moderate },
        { label: `Improving (${trendCounts.improving})`, color: COLORS.low },
      ];
      legends.forEach((leg, i) => {
        const lx = margin + 10 + i * 140;
        doc.rect(lx, y, 8, 8).fill(leg.color);
        doc.fillColor(COLORS.bg).fontSize(8).font('Helvetica');
        doc.text(leg.label, lx + 13, y - 1);
      });

      y += 25;

      // ── Confidence Gauge ─────────────────────────────────────────────

      const gaugeX = margin + contentWidth / 2;
      const gaugeY = y + 40;
      drawGauge(doc, gaugeX, gaugeY, 35, data.summary.confidence, 'OVERALL CONFIDENCE', COLORS.accent);

      y = gaugeY + 55;

      drawPageFooter(doc, 1);

      // ── Page 2+: Detailed Problems ───────────────────────────────────

      doc.addPage();
      let pageNum = 2;

      drawPageHeader(doc, 'Detailed Findings', `${data.locationName}  |  Problem Analysis`);
      y = 110;

      y = drawSectionHeader(doc, margin, y, 'Environmental Problems', contentWidth);
      y += 5;

      data.problems.forEach((problem, index) => {
        // Check if we need a new page
        if (y > doc.page.height - 180) {
          drawPageFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
          drawPageHeader(doc, 'Detailed Findings (cont.)', `${data.locationName}`);
          y = 110;
        }

        // Problem card
        const cardH = 110 + (problem.indicators ? 14 : 0) + (problem.causes ? 14 : 0);
        drawFilledRoundedRect(doc, margin, y, contentWidth, cardH, 6, '#F8FAFC');

        // Left severity accent bar
        const sevColor = COLORS[problem.severity as keyof typeof COLORS] || COLORS.bgLight;
        doc.rect(margin, y, 5, cardH).fill(sevColor);

        // Problem number + name
        doc.fillColor(COLORS.bg).fontSize(12).font('Helvetica-Bold');
        doc.text(`${index + 1}. ${problem.name}`, margin + 14, y + 10, { width: contentWidth - 100 });

        // Severity badge
        drawSeverityBadge(doc, margin + contentWidth - 80, y + 8, problem.severity);

        // Category + Trend
        let detailY = y + 30;
        const catColor = COLORS[problem.category as keyof typeof COLORS] || COLORS.bgLight;
        drawFilledRoundedRect(doc, margin + 14, detailY, 75, 14, 7, catColor);
        doc.fillColor(COLORS.white).fontSize(7).font('Helvetica-Bold');
        doc.text(problem.category.toUpperCase(), margin + 18, detailY + 3, { width: 67, align: 'center' });

        drawTrendIndicator(doc, margin + 100, detailY + 3, problem.trend);

        // Confidence mini-bar
        doc.fillColor(COLORS.textMuted).fontSize(7).font('Helvetica');
        doc.text(`Confidence: ${problem.confidence}%`, margin + 190, detailY + 3);
        const confBarX = margin + 260;
        doc.rect(confBarX, detailY + 4, 60, 6).fill('#E2E8F0');
        doc.rect(confBarX, detailY + 4, 60 * (problem.confidence / 100), 6).fill(COLORS.accent);

        detailY += 22;

        // Description
        doc.fillColor(COLORS.bg).fontSize(9).font('Helvetica');
        doc.text(problem.description, margin + 14, detailY, {
          width: contentWidth - 28,
          lineGap: 2,
        });
        detailY += 30;

        // Indicators
        if (problem.indicators && problem.indicators.length > 0) {
          doc.fillColor(COLORS.textMuted).fontSize(7).font('Helvetica-Bold');
          doc.text('INDICATORS:', margin + 14, detailY);
          doc.font('Helvetica').fillColor(COLORS.bg);
          doc.text(problem.indicators.join('  |  '), margin + 80, detailY, { width: contentWidth - 94 });
          detailY += 14;
        }

        // Causes
        if (problem.causes && problem.causes.length > 0) {
          doc.fillColor(COLORS.textMuted).fontSize(7).font('Helvetica-Bold');
          doc.text('CAUSES:', margin + 14, detailY);
          doc.font('Helvetica').fillColor(COLORS.bg);
          doc.text(problem.causes.join('  |  '), margin + 62, detailY, { width: contentWidth - 76 });
          detailY += 14;
        }

        y += cardH + 10;
      });

      drawPageFooter(doc, pageNum);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ── Knowledge Graph PDF ──────────────────────────────────────────────────────

export async function generateKnowledgeGraphPDFBuffer(data: KnowledgeGraphData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      // ── Page 1: Header + Overview + Graph Visualization ──────────────

      drawPageHeader(
        doc,
        'Knowledge Graph',
        `${data.locationName}  |  Relationship Analysis  |  ${data.locationId}`,
      );

      let y = 110;

      // Metric cards
      const cardW = (contentWidth - 20) / 3;
      drawMetricCard(doc, margin, y, cardW, 60, String(data.metadata.nodeCount), 'Graph Nodes', COLORS.accent);
      drawMetricCard(doc, margin + cardW + 10, y, cardW, 60, String(data.metadata.linkCount), 'Relationships', COLORS.accentAlt);

      // Density metric
      const density = data.metadata.nodeCount > 1
        ? (data.metadata.linkCount / (data.metadata.nodeCount * (data.metadata.nodeCount - 1) / 2) * 100).toFixed(1)
        : '0';
      drawMetricCard(doc, margin + (cardW + 10) * 2, y, cardW, 60, `${density}%`, 'Graph Density', COLORS.bgLight);

      y += 85;

      // ── Link Type Distribution Chart ─────────────────────────────────

      const linkTypeCounts: Record<string, number> = {};
      data.links.forEach((l) => {
        linkTypeCounts[l.type] = (linkTypeCounts[l.type] || 0) + 1;
      });

      const linkTypeData = Object.entries(linkTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
          label: type.charAt(0).toUpperCase() + type.slice(1),
          value: count,
          color: COLORS[type as keyof typeof COLORS] || COLORS.bgLight,
        }));

      y = drawSectionHeader(doc, margin, y, 'Relationship Overview', contentWidth);
      y += 8;

      const chartStartY = y;
      drawHorizontalBarChart(doc, margin, y, contentWidth * 0.5 - 20, linkTypeData, 'Relationship Types');

      // Severity distribution of nodes
      const nodeSeverityCounts: Record<string, number> = {};
      data.nodes.forEach((n) => {
        nodeSeverityCounts[n.severity] = (nodeSeverityCounts[n.severity] || 0) + 1;
      });

      const nodeSeverityData = SEVERITY_ORDER
        .filter((s) => nodeSeverityCounts[s])
        .map((s) => ({
          label: SEVERITY_LABELS[s] || s,
          value: nodeSeverityCounts[s] || 0,
          color: COLORS[s as keyof typeof COLORS] || COLORS.bgLight,
        }));

      const donutCx2 = margin + contentWidth * 0.5 + (contentWidth * 0.5) / 2 - 30;
      const donutCy2 = chartStartY + 55;
      drawDonutChart(doc, donutCx2, donutCy2, 45, 25, nodeSeverityData, 'Node Severity');

      y = chartStartY + 140;

      // ── Network Visualization (adjacency matrix style) ───────────────

      y = drawSectionHeader(doc, margin, y, 'Connection Matrix', contentWidth);
      y += 5;

      const maxNodes = Math.min(data.nodes.length, 10); // Cap for readability
      const cellSize = Math.min(28, (contentWidth - 100) / maxNodes);
      const matrixX = margin + 100;
      const matrixY = y + 20;

      // Column headers (rotated labels)
      data.nodes.slice(0, maxNodes).forEach((node, i) => {
        doc.save();
        doc.fillColor(COLORS.bg).fontSize(6).font('Helvetica');
        const tx = matrixX + i * cellSize + cellSize / 2;
        doc.text(
          node.name.length > 12 ? node.name.substring(0, 12) + '..' : node.name,
          tx - 5,
          matrixY - 14,
          { width: cellSize, align: 'left' },
        );
        doc.restore();
      });

      // Row labels + cells
      data.nodes.slice(0, maxNodes).forEach((rowNode, ri) => {
        const ry = matrixY + ri * cellSize;

        // Row label
        doc.fillColor(COLORS.bg).fontSize(6).font('Helvetica');
        doc.text(
          rowNode.name.length > 15 ? rowNode.name.substring(0, 15) + '..' : rowNode.name,
          margin,
          ry + cellSize / 2 - 4,
          { width: 95, align: 'right' },
        );

        data.nodes.slice(0, maxNodes).forEach((colNode, ci) => {
          const cx = matrixX + ci * cellSize;

          // Find link between these nodes
          const link = data.links.find(
            (l) =>
              (l.source === rowNode.id && l.target === colNode.id) ||
              (l.source === colNode.id && l.target === rowNode.id),
          );

          if (ri === ci) {
            // Diagonal
            const sevColor = COLORS[rowNode.severity as keyof typeof COLORS] || COLORS.bgLight;
            doc.rect(cx + 1, ry + 1, cellSize - 2, cellSize - 2).fill(sevColor);
          } else if (link) {
            const linkColor = COLORS[link.type as keyof typeof COLORS] || COLORS.bgLight;
            const opacity = link.strength || 0.5;
            const rgb = hexToRgb(linkColor);
            // Blend with white based on opacity
            const blended = rgb.map((c) => Math.round(c * opacity + 255 * (1 - opacity)));
            const blendedHex = `#${blended.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
            doc.rect(cx + 1, ry + 1, cellSize - 2, cellSize - 2).fill(blendedHex);
          } else {
            doc.rect(cx + 1, ry + 1, cellSize - 2, cellSize - 2).fill('#F1F5F9');
          }
        });
      });

      y = matrixY + maxNodes * cellSize + 20;

      // Matrix legend
      const matrixLegendItems = [
        { label: 'Causes', color: COLORS.causes },
        { label: 'Amplifies', color: COLORS.amplifies },
        { label: 'Mitigates', color: COLORS.mitigates },
        { label: 'Correlates', color: COLORS.correlates },
        { label: 'Self (severity)', color: COLORS.bgLight },
      ];

      matrixLegendItems.forEach((item, i) => {
        const lx = margin + i * 100;
        doc.rect(lx, y, 10, 10).fill(item.color);
        doc.fillColor(COLORS.bg).fontSize(7).font('Helvetica');
        doc.text(item.label, lx + 14, y + 1);
      });

      y += 25;

      drawPageFooter(doc, 1);

      // ── Page 2+: Node Details ────────────────────────────────────────

      doc.addPage();
      let pageNum = 2;

      drawPageHeader(doc, 'Graph Nodes', `${data.locationName}  |  Detailed Node Analysis`);
      y = 110;

      y = drawSectionHeader(doc, margin, y, 'Node Details', contentWidth);
      y += 5;

      data.nodes.forEach((node, index) => {
        if (y > doc.page.height - 130) {
          drawPageFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
          drawPageHeader(doc, 'Graph Nodes (cont.)', data.locationName);
          y = 110;
        }

        // Node card
        drawFilledRoundedRect(doc, margin, y, contentWidth, 75, 6, '#F8FAFC');

        // Severity accent
        const sevColor = COLORS[node.severity as keyof typeof COLORS] || COLORS.bgLight;
        doc.rect(margin, y, 5, 75).fill(sevColor);

        // Node name
        doc.fillColor(COLORS.bg).fontSize(11).font('Helvetica-Bold');
        doc.text(`${index + 1}. ${node.name}`, margin + 14, y + 10, { width: contentWidth - 100 });

        // Badges
        drawSeverityBadge(doc, margin + contentWidth - 80, y + 8, node.severity);

        const catColor = COLORS[node.category as keyof typeof COLORS] || COLORS.bgLight;
        drawFilledRoundedRect(doc, margin + 14, y + 30, 75, 14, 7, catColor);
        doc.fillColor(COLORS.white).fontSize(7).font('Helvetica-Bold');
        doc.text(node.category.toUpperCase(), margin + 18, y + 33, { width: 67, align: 'center' });

        // Connections count
        const connections = data.links.filter(
          (l) => l.source === node.id || l.target === node.id,
        ).length;
        doc.fillColor(COLORS.textMuted).fontSize(7).font('Helvetica');
        doc.text(`${connections} connections`, margin + 100, y + 33);

        // Description
        doc.fillColor(COLORS.bg).fontSize(9).font('Helvetica');
        doc.text(node.description, margin + 14, y + 50, {
          width: contentWidth - 28,
          lineGap: 2,
        });

        y += 85;
      });

      // ── Relationships Page ───────────────────────────────────────────

      if (y > doc.page.height - 200) {
        drawPageFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        drawPageHeader(doc, 'Relationships', `${data.locationName}  |  Link Analysis`);
        y = 110;
      } else {
        y += 10;
        y = drawSectionHeader(doc, margin, y, 'Relationships', contentWidth);
        y += 5;
      }

      // Relationship strength chart
      const sortedLinks = [...data.links].sort((a, b) => (b.strength || 0) - (a.strength || 0));

      sortedLinks.forEach((link, index) => {
        if (y > doc.page.height - 70) {
          drawPageFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
          drawPageHeader(doc, 'Relationships (cont.)', data.locationName);
          y = 110;
        }

        const sourceNode = data.nodes.find((n) => n.id === link.source);
        const targetNode = data.nodes.find((n) => n.id === link.target);
        const sourceName = sourceNode?.name || link.source;
        const targetName = targetNode?.name || link.target;
        const strength = link.strength || 0.5;

        // Row background
        if (index % 2 === 0) {
          doc.rect(margin, y - 2, contentWidth, 22).fill('#F8FAFC');
        }

        // Index
        doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica');
        doc.text(`${index + 1}.`, margin + 4, y + 3, { width: 20 });

        // Source → Target
        doc.fillColor(COLORS.bg).fontSize(8).font('Helvetica-Bold');
        doc.text(sourceName, margin + 22, y + 3, { width: 130 });

        const linkColor = COLORS[link.type as keyof typeof COLORS] || COLORS.bgLight;
        doc.fillColor(linkColor).fontSize(7).font('Helvetica-Bold');
        doc.text(` ${link.type.toUpperCase()} `, margin + 155, y + 3, { width: 65, align: 'center' });

        doc.fillColor(COLORS.bg).fontSize(8).font('Helvetica-Bold');
        doc.text(targetName, margin + 225, y + 3, { width: 130 });

        // Strength bar
        const strengthBarX = margin + contentWidth - 110;
        doc.rect(strengthBarX, y + 5, 80, 8).fill('#E2E8F0');
        doc.rect(strengthBarX, y + 5, 80 * strength, 8).fill(linkColor);
        doc.fillColor(COLORS.bg).fontSize(7).font('Helvetica');
        doc.text(`${(strength * 100).toFixed(0)}%`, strengthBarX + 84, y + 3);

        y += 22;
      });

      drawPageFooter(doc, pageNum);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
