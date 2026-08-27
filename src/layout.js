import { DEFAULT_LAYOUT } from "./layoutConfig.js";
import { getBarcodeCanvas } from "./barcode.js";

// Label physical size, in millimetres. Matches the reference artwork:
// 80mm wide x 30mm tall, printed on a continuous thermal roll.
export const LABEL_W = 80;
export const LABEL_H = 30;

// Maximum bounding box for the client logo (Campo 1), in mm.
export const CLIENT_LOGO_MAX_W = 27;
export const CLIENT_LOGO_MAX_H = 20;

// Sentinel passed as `numberText` to draw the "Nº" label without digits —
// used to pre-render a shared background for a numbered batch, so the PDF
// exporter can overlay each page's actual digits as lightweight vector text
// instead of re-rasterizing the whole label per page.
export const NUMBER_LABEL_ONLY = Symbol("number-label-only");

function wrapText(ctx, text, maxWidthMm) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidthMm && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Shrinks font size until `text` wraps to fit within maxWidthMm x maxHeightMm.
// Small labels like this one are information-dense, so most blocks of running
// text only fit at a few-point font size — this finds a size that fits rather
// than guessing one and clipping.
function fitTextToBox(ctx, text, maxWidthMm, maxHeightMm, opts = {}) {
  const { minFont = 0.9, maxFont = 3, lineHeightRatio = 1.2, step = 0.05, fontStyle = "" } = opts;
  let fontSize = maxFont;
  let lines = [text];
  while (fontSize >= minFont) {
    ctx.font = `${fontStyle} ${fontSize}px sans-serif`.trim();
    lines = wrapText(ctx, text, maxWidthMm);
    const blockHeight = lines.length * fontSize * lineHeightRatio;
    if (blockHeight <= maxHeightMm) break;
    fontSize -= step;
  }
  fontSize = Math.max(fontSize, minFont);
  return { fontSize, lineHeight: fontSize * lineHeightRatio, lines };
}

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

// --- small vector icon approximations (no source artwork available yet) ---

function iconWarningTriangle(ctx, x, y, s) {
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 0.18;
  ctx.beginPath();
  ctx.moveTo(x + s / 2, y);
  ctx.lineTo(x + s, y + s);
  ctx.lineTo(x, y + s);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${s * 0.55}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", x + s / 2, y + s * 0.68);
  ctx.restore();
}

function iconProhibited(ctx, x, y, s) {
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 0.18;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const r = s / 2 - 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.7, cy - r * 0.7);
  ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
  ctx.stroke();
  ctx.restore();
}

function iconBook(ctx, x, y, s) {
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 0.15;
  ctx.beginPath();
  ctx.moveTo(x + s / 2, y + s * 0.15);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + s * 0.85);
  ctx.lineTo(x + s / 2, y + s);
  ctx.lineTo(x + s, y + s * 0.85);
  ctx.lineTo(x + s, y);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s / 2, y + s * 0.15);
  ctx.lineTo(x + s / 2, y + s);
  ctx.stroke();
  ctx.restore();
}

function iconThermometer(ctx, x, y, s, text) {
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#111";
  ctx.lineWidth = 0.15;
  const stemX = x + s * 0.12;
  ctx.beginPath();
  ctx.moveTo(stemX, y);
  ctx.lineTo(stemX, y + s * 0.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(stemX, y + s * 0.78, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `${s * 0.42}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + s * 0.32, y + s * 0.45);
  ctx.restore();
}

function iconCE(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${s * 0.85}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("CE", x, y + s * 0.5);
  ctx.restore();
}

function iconIVD(ctx, x, y, s) {
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 0.15;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const r = s / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${s * 0.32}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("IVD", cx, cy + 0.1);
  ctx.restore();
}

/**
 * Draws the full label (fixed "Padrão" layout + Campo 1 logo + Campo 2 number)
 * onto a 2D canvas context that has already been scaled so 1 unit = 1mm.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{
 *   clientLogoImg?: HTMLImageElement | HTMLCanvasElement | null,
 *   manufacturerLogoImg?: HTMLImageElement | HTMLCanvasElement | null,
 *   barcodeCanvas: HTMLCanvasElement,
 *   numberText?: string,
 *   layout?: object,
 * }} opts
 */
export function drawLabel(ctx, opts) {
  const { clientLogoImg, manufacturerLogoImg, numberText } = opts;
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

  // --- Header row: manufacturer logo | client logo (Campo 1) | barcode ---
  const mfgBox = L.mfgLogo;
  if (manufacturerLogoImg) {
    const { w, h } = fitImageInBox(manufacturerLogoImg.width, manufacturerLogoImg.height, mfgBox.w, mfgBox.h);
    ctx.drawImage(manufacturerLogoImg, mfgBox.x + (mfgBox.w - w) / 2, mfgBox.y + (mfgBox.h - h) / 2, w, h);
  } else {
    drawDashedPlaceholder(ctx, mfgBox.x, mfgBox.y, mfgBox.w, mfgBox.h, "LOGO APTA\n(a substituir)");
  }
  hit("mfgLogo", mfgBox.x, mfgBox.y, mfgBox.w, mfgBox.h, "wh");

  const clientBox = L.clientLogo;
  if (clientLogoImg) {
    const { w, h } = fitImageInBox(clientLogoImg.width, clientLogoImg.height, clientBox.w, clientBox.h);
    ctx.drawImage(clientLogoImg, clientBox.x + (clientBox.w - w) / 2, clientBox.y + (clientBox.h - h) / 2, w, h);
  } else {
    drawDashedPlaceholder(ctx, clientBox.x, clientBox.y, clientBox.w, clientBox.h, "LOGO LABORATÓRIO\n(Campo 1)");
  }
  hit("clientLogo", clientBox.x, clientBox.y, clientBox.w, clientBox.h, "wh");

  const barcodeBox = L.barcode;
  const barcodeCanvas = getBarcodeCanvas(barcodeBox.value);
  if (barcodeCanvas) {
    ctx.drawImage(barcodeCanvas, barcodeBox.x, barcodeBox.y, barcodeBox.w, barcodeBox.h);
  } else {
    drawDashedPlaceholder(ctx, barcodeBox.x, barcodeBox.y, barcodeBox.w, barcodeBox.h, "código\ninválido");
  }
  hit("barcode", barcodeBox.x, barcodeBox.y, barcodeBox.w, barcodeBox.h, "wh");
  ctx.fillStyle = "#111";
  ctx.font = `${barcodeBox.numberFontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(barcodeBox.value, barcodeBox.x + barcodeBox.w / 2, barcodeBox.y + barcodeBox.h + barcodeBox.numberGap);

  // --- Subheader row: product title | Campo 2 number ---
  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  const titleMaxWidth = Math.max(L.clientLogo.x - L.title.x - 2, 5);
  const titleFont = fitSingleLineFont(ctx, L.title.text, titleMaxWidth, L.title.fontSize, 1.8, "bold");
  ctx.font = `bold ${titleFont}px sans-serif`;
  ctx.fillText(L.title.text, L.title.x, L.title.y);
  textHit("title", L.title.text, L.title.x, L.title.y, titleFont);

  if (numberText) {
    ctx.font = `${L.numberLabel.fontSize}px sans-serif`;
    ctx.fillText(L.numberLabel.text, L.numberLabel.x, L.numberLabel.y);
    textHit("numberLabel", L.numberLabel.text, L.numberLabel.x, L.numberLabel.y, L.numberLabel.fontSize);
    if (numberText !== NUMBER_LABEL_ONLY) {
      const digitsMaxWidth = Math.max(L.barcode.x - L.numberDigits.x - 2, 5);
      const numberFont = fitSingleLineFont(ctx, numberText, digitsMaxWidth, L.numberDigits.fontSize, 3, "bold");
      ctx.font = `bold ${numberFont}px sans-serif`;
      ctx.fillText(numberText, L.numberDigits.x, L.numberDigits.y);
      textHit("numberDigits", numberText, L.numberDigits.x, L.numberDigits.y, numberFont);
    }
  }

  // --- Left column: conteúdo, hazard icons, product code ---
  ctx.textAlign = "left";
  ctx.font = `${L.conteudoLabel.fontSize}px sans-serif`;
  ctx.fillText(L.conteudoLabel.text, L.conteudoLabel.x, L.conteudoLabel.y);
  textHit("conteudoLabel", L.conteudoLabel.text, L.conteudoLabel.x, L.conteudoLabel.y, L.conteudoLabel.fontSize);
  ctx.font = `bold ${L.conteudoValue.fontSize}px sans-serif`;
  ctx.fillText(L.conteudoValue.text, L.conteudoValue.x, L.conteudoValue.y);
  textHit("conteudoValue", L.conteudoValue.text, L.conteudoValue.x, L.conteudoValue.y, L.conteudoValue.fontSize);

  iconWarningTriangle(ctx, L.iconWarning.x, L.iconWarning.y, L.iconWarning.size);
  hit("iconWarning", L.iconWarning.x, L.iconWarning.y, L.iconWarning.size, L.iconWarning.size, "size");
  iconProhibited(ctx, L.iconProhibited.x, L.iconProhibited.y, L.iconProhibited.size);
  hit("iconProhibited", L.iconProhibited.x, L.iconProhibited.y, L.iconProhibited.size, L.iconProhibited.size, "size");

  ctx.font = `bold ${L.productCode.fontSize}px sans-serif`;
  ctx.fillText(L.productCode.text, L.productCode.x, L.productCode.y);
  textHit("productCode", L.productCode.text, L.productCode.x, L.productCode.y, L.productCode.fontSize);
  ctx.font = `bold ${L.productBrand.fontSize}px sans-serif`;
  ctx.fillText(L.productBrand.text, L.productBrand.x, L.productBrand.y);
  textHit("productBrand", L.productBrand.text, L.productBrand.x, L.productBrand.y, L.productBrand.fontSize);

  // --- Middle column: Padrão patient fields ---
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
  ctx.fillText(pf.lineData, pf.x, fy);
  fy += pf.pitch;
  drawField(ctx, pf.labelInstituicao, pf.x, fy, pf.width, pf.fontSize);
  fy += pf.pitch;
  drawField(ctx, pf.labelObs, pf.x, fy, pf.width, pf.fontSize);
  hit("patientFields", pf.x, pf.y - pf.fontSize, pf.width, fy - pf.y + pf.fontSize * 1.2, "none");

  // --- Right column: warning paragraph + compliance icons ---
  const wt = L.warningText;
  const warnFit = fitTextToBox(ctx, wt.text, wt.width, wt.maxHeight, {
    minFont: 1.2,
    maxFont: wt.fontSize,
    lineHeightRatio: 1.15,
  });
  ctx.font = `${warnFit.fontSize}px sans-serif`;
  ctx.fillStyle = "#111";
  warnFit.lines.forEach((line, i) => {
    ctx.fillText(line, wt.x, wt.y + i * warnFit.lineHeight);
  });
  hit(
    "warningText",
    wt.x,
    wt.y - warnFit.fontSize,
    wt.width,
    warnFit.lines.length * warnFit.lineHeight + warnFit.fontSize * 0.3,
    "none",
  );

  const ci = L.complianceIcons;
  let iconX = ci.x;
  iconWarningTriangle(ctx, iconX, ci.y, ci.size);
  iconX += ci.size + ci.gap;
  iconProhibited(ctx, iconX, ci.y, ci.size);
  iconX += ci.size + ci.gap;
  iconBook(ctx, iconX, ci.y, ci.size);
  iconX += ci.size + ci.gap;
  const thermoWidth = ci.size * 2;
  iconThermometer(ctx, iconX, ci.y, thermoWidth, "15-30°C");
  iconX += thermoWidth + ci.gap;
  iconCE(ctx, iconX, ci.y, ci.size);
  iconX += ci.size + ci.gap + 0.4;
  iconIVD(ctx, iconX, ci.y, ci.size);
  hit("complianceIcons", ci.x, ci.y, iconX + ci.size - ci.x, ci.size, "none");

  // --- Footer band ---
  const footerY = L.footer.y;
  const footerH = LABEL_H - footerY;
  ctx.fillStyle = "#0e6b61";
  ctx.fillRect(0, footerY, LABEL_W, footerH);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  const footerFit = fitTextToBox(ctx, L.footer.text, LABEL_W - 3, footerH - 1, {
    minFont: 0.7,
    maxFont: L.footer.fontSize,
    lineHeightRatio: 1.15,
  });
  ctx.font = `${footerFit.fontSize}px sans-serif`;
  ctx.fillStyle = "#ffffff";
  footerFit.lines.forEach((line, i) => {
    ctx.fillText(line, 1.5, footerY + 1 + i * footerFit.lineHeight);
  });
  hit("footer", 0, footerY, LABEL_W, footerH, "vmove");

  return hitboxes;
}
