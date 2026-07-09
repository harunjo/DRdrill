import { describe, it, expect } from "vitest";
import { buildPdf } from "./pdf";

describe("buildPdf", () => {
  it("produces a valid PDF exercising every block kind (incl. glyph sanitize)", () => {
    const doc = buildPdf({
      filename: "x.pdf",
      title: "Business Continuity — Justifikasi",
      subtitle: "C-level",
      brand: "DR Drill",
      date: "1/1/2026",
      intro: "intro paragraph that wraps ".repeat(6),
      footer: "footer · line",
      blocks: [
        { kind: "heading", num: 1, title: "Ringkasan", guide: "Panduan" },
        { kind: "subheading", text: "Sub" },
        { kind: "paragraph", text: "paragraf ".repeat(20) },
        { kind: "bullets", items: ["satu", "dua"] },
        { kind: "guide", lines: ["baris panduan a", "baris panduan b"] },
        { kind: "table", head: ["A", "B", "C"], rows: [["1", "2", "3"], ["x", "y", "z"]] },
        { kind: "loss", label: "Kerugian", value: "Rp 45 jt", sub: "Rentan", critical: true },
        // ≥ ≤ ≈ must be swapped for WinAnsi-safe glyphs, not dropped.
        { kind: "bullets", items: ["Ketersediaan ≥ 99,9%", "RTO ≤ 1 jam", "≈ Rp 1 jt"] },
      ],
    });
    const out = doc.output("arraybuffer");
    expect(out.byteLength).toBeGreaterThan(800);
    const head = String.fromCharCode(...new Uint8Array(out.slice(0, 5)));
    expect(head).toBe("%PDF-");
  });
});
