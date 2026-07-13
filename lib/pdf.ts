// Client-side PDF builder for the C-level investment justification. Produces a
// real vector, selectable-text PDF and triggers a direct file download — no
// print dialog, no server round-trip (report data never leaves the browser, R13).
// Dynamically imported from the lens so jsPDF stays out of the initial bundle.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfBlock =
  | { kind: "heading"; num: number; title: string; guide?: string }
  | { kind: "subheading"; text: string }
  | { kind: "paragraph"; text: string; color?: RGB }
  | { kind: "bullets"; items: string[] }
  | { kind: "guide"; lines: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "loss"; label: string; value: string; sub: string; critical: boolean };

type RGB = [number, number, number];

/** Optional report branding — browser-only, never leaves the browser (R12). */
export interface Branding {
  name: string;
  logo: string | null; // data: URL
}

export interface PdfDoc {
  filename: string;
  title: string;
  subtitle: string;
  brand: string;
  date: string;
  intro: string;
  footer: string;
  blocks: PdfBlock[];
  company?: string;
  logo?: string | null; // data: URL, embedded in-document
}

const M = 14; // page margin (mm)
const PW = 210;
const PH = 297; // A4
const CW = PW - 2 * M; // content width

// Incident Timeline brand — mirrors the app tokens (globals.css).
const INK: RGB = [16, 20, 27];
const AMBER: RGB = [239, 122, 31];
const LINE: RGB = [198, 204, 212];
const MUTED: RGB = [86, 96, 112];
const FAINT: RGB = [136, 144, 160];
const CRIT: RGB = [207, 59, 43];

/** The timeline mark, in vector: recovery axis with a forward arrow, struck at
 *  t=0 by the amber incident line + diamond (same as components/logo.tsx). */
function drawMark(doc: jsPDF, x: number, y: number, s: number): void {
  const cy = y + s / 2;
  const cx = x + s / 2;
  doc.setDrawColor(...INK).setLineWidth(0.55);
  doc.line(x, cy, x + s * 0.92, cy); // axis
  doc.line(x + s * 0.72, cy - s * 0.16, x + s * 0.95, cy); // arrow top
  doc.line(x + s * 0.72, cy + s * 0.16, x + s * 0.95, cy); // arrow bottom
  doc.setDrawColor(...AMBER).setLineWidth(0.7);
  doc.line(cx, y + s * 0.06, cx, y + s * 0.94); // t=0 event line
  const d = s * 0.17; // diamond half-diagonal
  doc.setFillColor(...AMBER);
  doc.triangle(cx - d, cy, cx, cy - d, cx + d, cy, "F");
  doc.triangle(cx - d, cy, cx, cy + d, cx + d, cy, "F");
}

// jsPDF's built-in Helvetica is WinAnsi-encoded — swap the few glyphs our copy
// uses that aren't in it, so nothing renders as a blank box.
const san = (s: string): string => s.replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/≈/g, "~");

/** Build the PDF document (no download) — kept separate so it can run headless
 *  in a test (doc.save() needs the browser). */
export function buildPdf(d: PdfDoc): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = M;

  const ensure = (h: number) => {
    if (y + h > PH - M) {
      doc.addPage();
      y = M;
    }
  };
  const para = (text: string, size: number, rgb: RGB, gap: number) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(rgb[0], rgb[1], rgb[2]);
    const lh = size * 0.42;
    for (const ln of doc.splitTextToSize(san(text), CW)) {
      ensure(lh);
      doc.text(ln, M, y);
      y += lh;
    }
    y += gap;
  };

  // Optional brand band — logo (left) + company name.
  if (d.logo || d.company) {
    let bx = M;
    if (d.logo) {
      try {
        const p = doc.getImageProperties(d.logo);
        const h = 10;
        const w = (p.width / p.height) * h;
        const fmt = d.logo.includes("image/png")
          ? "PNG"
          : d.logo.includes("image/webp")
            ? "WEBP"
            : "JPEG";
        doc.addImage(d.logo, fmt, M, y, w, h);
        bx = M + w + 4;
      } catch {
        // unreadable image — skip it rather than fail the whole export
      }
    }
    if (d.company) {
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
      doc.text(san(d.company), bx, y + 7);
    }
    y += 14;
  }

  // Header — the timeline mark, title, and the amber axis rule (the masthead
  // edge from the app, carried onto the exported document).
  drawMark(doc, M, y - 1.5, 9);
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...INK);
  doc.text(san(d.title), M + 12, y + 4);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...FAINT);
  doc.text(d.brand, PW - M, y + 1, { align: "right" });
  doc.text(d.date, PW - M, y + 5, { align: "right" });
  y += 7;
  doc.setFontSize(8.5).setTextColor(...MUTED);
  doc.text(san(d.subtitle), M + 12, y);
  y += 3;
  // ruler ticks above the axis, then the amber rule
  doc.setDrawColor(...LINE).setLineWidth(0.2);
  for (let tx = M; tx <= PW - M; tx += 6) doc.line(tx, y - 1.4, tx, y);
  doc.setDrawColor(...AMBER).setLineWidth(0.8).line(M, y, PW - M, y);
  y += 5;

  para(d.intro, 9, [68, 68, 68], 3);

  for (const b of d.blocks) {
    switch (b.kind) {
      case "heading": {
        ensure(11);
        y += 2;
        // Number in incident amber, title in ink — the brand's two voices.
        doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...AMBER);
        const numLabel = `${b.num}.`;
        doc.text(numLabel, M, y);
        const numW = doc.getTextWidth(`${numLabel} `);
        doc.setTextColor(...INK);
        doc.text(san(b.title), M + numW, y);
        if (b.guide) {
          const tw = numW + doc.getTextWidth(san(b.title));
          const tag = san(b.guide);
          doc.setFont("helvetica", "bold").setFontSize(6.5);
          const gw = doc.getTextWidth(tag) + 4;
          doc.setFillColor(253, 246, 227).setDrawColor(236, 220, 160).setLineWidth(0.2);
          doc.roundedRect(M + tw + 3, y - 3, gw, 4.2, 1, 1, "FD");
          doc.setTextColor(138, 109, 0);
          doc.text(tag, M + tw + 5, y);
        }
        y += 1.5;
        doc.setDrawColor(...LINE).setLineWidth(0.2).line(M, y, PW - M, y);
        y += 3.5;
        break;
      }
      case "subheading":
        ensure(6);
        doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...INK);
        doc.text(san(b.text), M, y);
        y += 4.5;
        break;
      case "paragraph":
        para(b.text, 9.5, b.color ?? [51, 51, 51], 2);
        break;
      case "bullets": {
        doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(51, 51, 51);
        const lh = 9.5 * 0.42;
        for (const it of b.items) {
          const lines = doc.splitTextToSize(san(it), CW - 4);
          lines.forEach((ln: string, i: number) => {
            ensure(lh);
            if (i === 0) doc.text("•", M, y);
            doc.text(ln, M + 4, y);
            y += lh;
          });
        }
        y += 2;
        break;
      }
      case "guide": {
        doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(85, 85, 85);
        const lh = 9 * 0.42;
        const wrapped = b.lines.map((l) => doc.splitTextToSize(san(l), CW - 6) as string[]);
        const inner =
          wrapped.reduce((n, w) => n + w.length, 0) * lh + (b.lines.length - 1) * 1.5;
        const boxH = inner + 6;
        ensure(boxH + 2);
        doc.setFillColor(240, 241, 244).setDrawColor(...LINE).setLineWidth(0.2);
        doc.roundedRect(M, y, CW, boxH, 1.5, 1.5, "FD");
        let ty = y + 4.5;
        doc.setTextColor(85, 85, 85);
        wrapped.forEach((w, idx) => {
          for (const ln of w) {
            doc.text(ln, M + 3, ty);
            ty += lh;
          }
          if (idx < wrapped.length - 1) ty += 1.5;
        });
        y += boxH + 3;
        break;
      }
      case "table":
        autoTable(doc, {
          head: [b.head.map(san)],
          body: b.rows.map((r) => r.map(san)),
          startY: y,
          margin: { left: M, right: M },
          theme: "plain",
          styles: { fontSize: 9, cellPadding: 1.8, textColor: [51, 51, 51] },
          headStyles: { fontStyle: "bold", textColor: INK },
          // Horizontal rules only (like the on-screen tables): dark under the
          // header, light under each body row.
          didDrawCell: (data) => {
            const c = data.cell;
            if (data.section === "head") doc.setDrawColor(...INK).setLineWidth(0.4);
            else if (data.section === "body") doc.setDrawColor(...LINE).setLineWidth(0.1);
            else return;
            doc.line(c.x, c.y + c.height, c.x + c.width, c.y + c.height);
          },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
        break;
      case "loss": {
        ensure(16);
        if (b.label) {
          doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(102, 102, 102);
          doc.text(san(b.label.toUpperCase()), M, y);
          y += 6;
        }
        const col: RGB = b.critical ? CRIT : INK;
        doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(col[0], col[1], col[2]);
        for (const ln of doc.splitTextToSize(san(b.value), CW)) {
          ensure(8);
          doc.text(ln, M, y);
          y += 8;
        }
        if (b.sub) {
          doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(85, 85, 85);
          doc.text(san(b.sub), M, y);
          y += 5;
        }
        break;
      }
    }
  }

  // Footer — closed by the same amber axis that opened the document.
  y += 3;
  ensure(8);
  doc.setDrawColor(...AMBER).setLineWidth(0.5).line(M, y, PW - M, y);
  y += 4;
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(119, 119, 119);
  for (const ln of doc.splitTextToSize(san(d.footer), CW)) {
    doc.text(ln, M, y);
    y += 3;
  }

  return doc;
}

export function downloadPdf(d: PdfDoc): void {
  buildPdf(d).save(d.filename);
}
