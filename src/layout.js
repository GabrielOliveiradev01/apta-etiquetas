import { DEFAULT_LAYOUT } from "./layoutConfig.js";

// Label physical size, in millimetres. Matches the reference artwork:
// 80mm wide x 30mm tall, printed on a continuous thermal roll.
export const LABEL_W = 80;
export const LABEL_H = 30;

// Sentinel passed as `numberText` to draw the "Nº" label without digits —
// used to pre-render a shared background for a numbered batch, so the PDF
// exporter can overlay each page's actual digits as lightweight vector text
// instead of re-rasterizing the whole label per page.
export const NUMBER_LABEL_ONLY = Symbol("number-label-only");

// Shrinks font size (no wrapping) until `text` fits on one line within maxWidthMm.
function fitSingleLineFont(ctx, text, maxWidthMm, maxFont, minFont, fontStyle = "") {
  let fontSize = maxFont;
  while (fontSize > minFont) {
    ctx.font = `${fontStyle} ${fontSize}px sans-serif`.trim();
    if (ctx.measureText(text).width <= maxWidthMm) break;
    fontSize -= 0.05;
  }
  return Math.max(fontSize, minFont);
}

// Draws "Label: ____" — the label text followed by a straight fill-in line
// stretching to `totalWidthMm` from x. Using a drawn line (rather than an
// underscore-heavy string) keeps the blank's width exact regardless of font
// metrics, which matters a lot on a column this narrow.
function drawField(ctx, label, x, y, totalWidthMm, fontSize) {
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  const labelWidth = ctx.measureText(label).width;
  const lineStartX = x + labelWidth + 0.8;
  const lineEndX = x + totalWidthMm;
  if (lineEndX > lineStartX) {
    ctx.save();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.moveTo(lineStartX, y);
    ctx.lineTo(lineEndX, y);
    ctx.stroke();
    ctx.restore();
  }
}

function fitImageInBox(imgW, imgH, boxW, boxH) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { w, h };
}

function drawDashedPlaceholder(ctx, x, y, w, h, label) {
  ctx.save();
  ctx.strokeStyle = "#b7c0c8";
  ctx.setLineDash([0.6, 0.6]);
  ctx.lineWidth = 0.15;
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.fillStyle = "#9aa5ad";
  ctx.font = "2.3px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = label.split("\n");
  const lineHeight = 2.6;
  const startY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x + w / 2, startY + i * lineHeight));
  ctx.restore();
}

/**
 * Draws the label — Campo 1 logo, Campo 2 sequential number, and the
 * patient info "ficha" — onto a 2D canvas context that has already been
 * scaled so 1 unit = 1mm.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{
 *   clientLogoImg?: HTMLImageElement | HTMLCanvasElement | null,
 *   numberText?: string,
 *   layout?: object,
 * }} opts
 */
export function drawLabel(ctx, opts) {
  const { clientLogoImg, numberText } = opts;
  const L = opts.layout || DEFAULT_LAYOUT;

  // Exact, per-element bounding boxes for the elements just drawn — used by
  // the interactive preview to hit-test clicks/drags. Built from the same
  // real values (post text-fitting, actual measured widths) used to draw,
  // so hit areas never drift out of sync with what's on screen.
  const hitboxes = [];
  const hit = (key, x, y, w, h, resize) => hitboxes.push({ key, x, y, w, h, resize });
  const textHit = (key, text, x, y, fontSize, resize = "font") => {
    const w = ctx.measureText(text).width;
    const pad = 0.4;
    hit(key, x - pad, y - fontSize * 0.8, w + pad * 2, fontSize * 1.05 + pad * 2, resize);
  };

  ctx.clearRect(0, 0, LABEL_W, LABEL_H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "alphabetic";

  // --- Campo 1: client/lab logo ---
  const clientBox = L.clientLogo;
  if (clientLogoImg) {
    const { w, h } = fitImageInBox(clientLogoImg.width, clientLogoImg.height, clientBox.w, clientBox.h);
    ctx.drawImage(clientLogoImg, clientBox.x + (clientBox.w - w) / 2, clientBox.y + (clientBox.h - h) / 2, w, h);
  } else {
    drawDashedPlaceholder(ctx, clientBox.x, clientBox.y, clientBox.w, clientBox.h, "LOGO LABORATÓRIO\n(Campo 1)");
  }
  hit("clientLogo", clientBox.x, clientBox.y, clientBox.w, clientBox.h, "wh");

  // --- Campo 2: sequential number ---
  if (numberText) {
    ctx.textAlign = "left";
    ctx.font = `${L.numberLabel.fontSize}px sans-serif`;
    ctx.fillText(L.numberLabel.text, L.numberLabel.x, L.numberLabel.y);
    textHit("numberLabel", L.numberLabel.text, L.numberLabel.x, L.numberLabel.y, L.numberLabel.fontSize);
    if (numberText !== NUMBER_LABEL_ONLY) {
      const digitsMaxWidth = Math.max(LABEL_W - L.numberDigits.x - 1.5, 5);
      const numberFont = fitSingleLineFont(ctx, numberText, digitsMaxWidth, L.numberDigits.fontSize, 3, "bold");
      ctx.font = `bold ${numberFont}px sans-serif`;
      ctx.fillText(numberText, L.numberDigits.x, L.numberDigits.y);
      textHit("numberDigits", numberText, L.numberDigits.x, L.numberDigits.y, numberFont);
    }
  }

  // --- Ficha: patient info fields ---
  const pf = L.patientFields;
  const halfWidth = pf.width * 0.44;
  const secondOffset = pf.width * 0.52;
  let fy = pf.y;
  drawField(ctx, pf.labelPaciente, pf.x, fy, pf.width, pf.fontSize);
  fy += pf.pitch;
  drawField(ctx, pf.labelN, pf.x, fy, halfWidth, pf.fontSize);
  drawField(ctx, pf.labelIdade, pf.x + secondOffset, fy, halfWidth, pf.fontSize);
  fy += pf.pitch;
  drawField(ctx, pf.labelMaterial, pf.x, fy, pf.width, pf.fontSize);
  fy += pf.pitch;
  ctx.font = `${pf.fontSize}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(pf.lineData, pf.x, fy);
  fy += pf.pitch;
  drawField(ctx, pf.labelInstituicao, pf.x, fy, pf.width, pf.fontSize);
  fy += pf.pitch;
  drawField(ctx, pf.labelObs, pf.x, fy, pf.width, pf.fontSize);
  hit("patientFields", pf.x, pf.y - pf.fontSize, pf.width, fy - pf.y + pf.fontSize * 1.2, "none");

  return hitboxes;
}
