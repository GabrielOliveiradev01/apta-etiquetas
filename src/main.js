import { LABEL_W, LABEL_H, drawLabel } from "./layout.js";
import { loadLogoFile } from "./logoFile.js";
import { generateLabelsPdf, padNumber } from "./pdfExport.js";
import { mergeLayout } from "./layoutConfig.js";
import { buildConfigPanel, updatePanelInputs } from "./configPanel.js";
import { attachInteractivePreview } from "./interactivePreview.js";
import aptaLogoUrl from "./assets/apta-logo.png";

const MAX_QUANTITY = 500;
const MAX_START_NUMBER = 100000;
const LAYOUT_STORAGE_KEY = "apta-etiquetas-layout-v1";

const logoInput = document.getElementById("logo-input");
const logoStatus = document.getElementById("logo-status");
const logoClearBtn = document.getElementById("logo-clear");
const startNumberInput = document.getElementById("start-number");
const quantityInput = document.getElementById("quantity");
const formError = document.getElementById("form-error");
const generateBtn = document.getElementById("generate-btn");
const previewCanvas = document.getElementById("preview-canvas");
const layoutConfigContainer = document.getElementById("layout-config");
const layoutResetBtn = document.getElementById("layout-reset-btn");

const PREVIEW_SCALE = 10; // px per mm
previewCanvas.width = LABEL_W * PREVIEW_SCALE;
previewCanvas.height = LABEL_H * PREVIEW_SCALE;
const previewCtx = previewCanvas.getContext("2d");
previewCtx.scale(PREVIEW_SCALE, PREVIEW_SCALE);

let clientLogoImg = null;
let manufacturerLogoImg = null;

const mfgLogoImgEl = new Image();
mfgLogoImgEl.onload = () => {
  manufacturerLogoImg = mfgLogoImgEl;
  updatePreview();
};
mfgLogoImgEl.src = aptaLogoUrl;

function loadStoredLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return raw ? mergeLayout(JSON.parse(raw)) : mergeLayout(null);
  } catch {
    return mergeLayout(null);
  }
}

let layout = loadStoredLayout();

function persistLayout() {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // localStorage unavailable (private mode, etc.) — layout still works this session
  }
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function readForm() {
  const startRaw = startNumberInput.value.trim();
  const startNumber = startRaw === "" ? null : Number(startRaw);
  const quantity = Number(quantityInput.value);
  return { startNumber, quantity };
}

function validateForm({ startNumber, quantity }) {
  if (startNumber !== null) {
    if (!Number.isInteger(startNumber) || startNumber < 1 || startNumber > MAX_START_NUMBER) {
      return `Número inicial deve ser um inteiro entre 1 e ${MAX_START_NUMBER}.`;
    }
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return `Quantidade deve ser um inteiro entre 1 e ${MAX_QUANTITY}.`;
  }
  if (startNumber !== null && startNumber + quantity - 1 > MAX_START_NUMBER) {
    return `Com essa quantidade, a numeração ultrapassaria ${MAX_START_NUMBER}. Reduza a quantidade ou o número inicial.`;
  }
  return null;
}

function updatePreview() {
  const { startNumber } = readForm();
  const numberText = startNumber !== null && !Number.isNaN(startNumber) ? padNumber(startNumber) : null;
  return drawLabel(previewCtx, {
    clientLogoImg,
    manufacturerLogoImg,
    numberText,
    layout,
  });
}

function persistAndSyncPanel() {
  persistLayout();
  updatePanelInputs(layoutConfigContainer, layout);
}

function handleLayoutChange() {
  persistAndSyncPanel();
  updatePreview();
}

async function handleLogoChange() {
  const file = logoInput.files[0];
  if (!file) return;

  logoStatus.textContent = "Carregando...";
  logoStatus.className = "status";

  try {
    clientLogoImg = await loadLogoFile(file);
    logoStatus.textContent = `Logo carregada: ${file.name}`;
    logoStatus.className = "status ok";
    logoClearBtn.hidden = false;
    updatePreview();
  } catch (err) {
    clientLogoImg = null;
    logoStatus.textContent = err.message;
    logoStatus.className = "status error";
    logoInput.value = "";
    updatePreview();
  }
}

function clearLogo() {
  clientLogoImg = null;
  logoInput.value = "";
  logoStatus.textContent = "";
  logoStatus.className = "status";
  logoClearBtn.hidden = true;
  updatePreview();
}

function resetLayout() {
  layout = mergeLayout(null);
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch {
    // ignore
  }
  buildConfigPanel(layoutConfigContainer, layout, handleLayoutChange);
  updatePreview();
}

async function handleGenerate() {
  const form = readForm();
  const error = validateForm(form);
  showError(error);
  if (error) return;

  generateBtn.disabled = true;
  generateBtn.textContent = "Gerando...";
  try {
    const doc = generateLabelsPdf({
      clientLogoImg,
      manufacturerLogoImg,
      startNumber: form.startNumber,
      quantity: form.quantity,
      layout,
    });
    const filename =
      form.startNumber !== null
        ? `etiquetas_${padNumber(form.startNumber)}_a_${padNumber(form.startNumber + form.quantity - 1)}.pdf`
        : `etiquetas_${form.quantity}.pdf`;
    doc.save(filename);
  } catch (err) {
    showError(`Falha ao gerar o PDF: ${err.message}`);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Baixar PDF";
  }
}

logoInput.addEventListener("change", handleLogoChange);
logoClearBtn.addEventListener("click", clearLogo);
startNumberInput.addEventListener("input", updatePreview);
generateBtn.addEventListener("click", handleGenerate);
layoutResetBtn.addEventListener("click", resetLayout);

buildConfigPanel(layoutConfigContainer, layout, handleLayoutChange);

attachInteractivePreview({
  canvas: previewCanvas,
  ctx: previewCtx,
  scale: PREVIEW_SCALE,
  getLayout: () => layout,
  redraw: updatePreview,
  onChange: persistAndSyncPanel,
});
