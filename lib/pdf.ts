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

export interface PdfDoc {
  filename: string;
  title: string;
  subtitle: string;
  brand: string;
  date: string;
  intro: string;
  footer: string;
  blocks: PdfBlock[];
}

const M = 14; // page margin (mm)
const PW = 210;
const PH = 297; // A4
const CW = PW - 2 * M; // content width

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

  // Header
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(17, 17, 17);
  doc.text(san(d.title), M, y + 4);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(102, 102, 102);
  doc.text(d.brand, PW - M, y + 1, { align: "right" });
  doc.text(d.date, PW - M, y + 5, { align: "right" });
  y += 7;
  doc.setFontSize(8.5).setTextColor(102, 102, 102);
  doc.text(san(d.subtitle), M, y);
  y += 3;
  doc.setDrawColor(17, 17, 17).setLineWidth(0.5).line(M, y, PW - M, y);
  y += 5;

  para(d.intro, 9, [68, 68, 68], 3);

  for (const b of d.blocks) {
    switch (b.kind) {
      case "heading": {
        ensure(11);
        y += 2;
        const label = `${b.num}. ${b.title}`;
        doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(17, 17, 17);
        doc.text(san(label), M, y);
        if (b.guide) {
          const tw = doc.getTextWidth(san(label));
          const tag = san(b.guide);
          doc.setFont("helvetica", "bold").setFontSize(6.5);
          const gw = doc.getTextWidth(tag) + 4;
          doc.setFillColor(253, 246, 227).setDrawColor(236, 220, 160).setLineWidth(0.2);
          doc.roundedRect(M + tw + 3, y - 3, gw, 4.2, 1, 1, "FD");
          doc.setTextColor(138, 109, 0);
          doc.text(tag, M + tw + 5, y);
        }
        y += 1.5;
        doc.setDrawColor(221, 221, 221).setLineWidth(0.2).line(M, y, PW - M, y);
        y += 3.5;
        break;
      }
      case "subheading":
        ensure(6);
        doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(17, 17, 17);
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
        doc.setFillColor(247, 247, 247).setDrawColor(187, 187, 187).setLineWidth(0.2);
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
          headStyles: { fontStyle: "bold", textColor: [17, 17, 17] },
          // Horizontal rules only (like the on-screen tables): dark under the
          // header, light under each body row.
          didDrawCell: (data) => {
            const c = data.cell;
            if (data.section === "head") doc.setDrawColor(17, 17, 17).setLineWidth(0.4);
            else if (data.section === "body") doc.setDrawColor(229, 229, 229).setLineWidth(0.1);
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
        const col: RGB = b.critical ? [192, 57, 43] : [17, 17, 17];
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

  // Footer
  y += 3;
  ensure(8);
  doc.setDrawColor(204, 204, 204).setLineWidth(0.2).line(M, y, PW - M, y);
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
