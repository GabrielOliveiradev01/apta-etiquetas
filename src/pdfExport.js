import { jsPDF } from "jspdf";
import { LABEL_W, LABEL_H, drawLabel, NUMBER_LABEL_ONLY } from "./layout.js";

const RENDER_SCALE = 12; // px per mm (~305dpi, good for thermal label printers)
const MM_TO_PT = 2.8346;
const BACKGROUND_ALIAS = "label-background";

export function padNumber(n) {
  return String(n).padStart(6, "0");
}

/**
 * Builds a jsPDF document with one page per label (80x30mm each), numbered
 * sequentially starting at `startNumber` (or blank if null).
 *
 * The fixed "Padrão" layout + Campo 1 logo never change within a batch, so
 * they're rasterized once and reused (by alias) on every page; only the
 * Campo 2 number is drawn per page, as vector text. This keeps a 500-label
 * PDF a few hundred KB instead of ballooning to hundreds of MB.
 */
export function generateLabelsPdf({ clientLogoImg, manufacturerLogoImg, startNumber, quantity, layout }) {
  const hasNumbering = startNumber !== null && startNumber !== undefined;
  const numberPos = layout.numberDigits;

  const canvas = document.createElement("canvas");
  canvas.width = LABEL_W * RENDER_SCALE;
  canvas.height = LABEL_H * RENDER_SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(RENDER_SCALE, RENDER_SCALE);
  drawLabel(ctx, {
    clientLogoImg,
    manufacturerLogoImg,
    numberText: hasNumbering ? NUMBER_LABEL_ONLY : null,
    layout,
  });
  const backgroundDataUrl = canvas.toDataURL("image/png");

  const doc = new jsPDF({ unit: "mm", format: [LABEL_W, LABEL_H], orientation: "landscape" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(numberPos.fontSize * MM_TO_PT);

  for (let i = 0; i < quantity; i++) {
    if (i > 0) doc.addPage([LABEL_W, LABEL_H], "landscape");
    doc.addImage(backgroundDataUrl, "PNG", 0, 0, LABEL_W, LABEL_H, BACKGROUND_ALIAS);
    if (hasNumbering) {
      doc.text(padNumber(startNumber + i), numberPos.x, numberPos.y);
    }
  }

  return doc;
}
