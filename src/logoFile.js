import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler essa imagem."));
    img.src = dataUrl;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsArrayBuffer(file);
  });
}

async function renderPdfFirstPageToImage(file) {
  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 4 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * Loads a user-uploaded logo file (jpg/png/pdf) and returns a drawable
 * image (HTMLImageElement or HTMLCanvasElement for PDFs).
 */
export async function loadLogoFile(file) {
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Arquivo maior que 5MB.");
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png)$/i.test(file.name);

  if (isPdf) {
    return renderPdfFirstPageToImage(file);
  }
  if (isImage) {
    const dataUrl = await readFileAsDataUrl(file);
    return loadImageFromDataUrl(dataUrl);
  }
  throw new Error("Formato não suportado. Envie JPG, PNG ou PDF.");
}
