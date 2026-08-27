// Every adjustable position/size/text on the label. This is the single
// source of truth for both the default layout and the on-screen controls
// panel that lets the user edit each element.
//
// The label only carries three things: the lab's own logo (Campo 1), the
// sequential number (Campo 2), and the patient info sheet ("ficha").

export const DEFAULT_LAYOUT = {
  clientLogo: { x: 2, y: 2, w: 24, h: 10 },
  numberLabel: { x: 58, y: 7.5, fontSize: 3, text: "Nº" },
  numberDigits: { x: 62, y: 8, fontSize: 5.5 },
  patientFields: {
    x: 2,
    y: 15.5,
    width: 76,
    fontSize: 2.4,
    pitch: 2.7,
    labelPaciente: "Paciente:",
    labelN: "N°:",
    labelIdade: "Idade:",
    labelMaterial: "Material:",
    lineData: "Data: __/__/__     Hora: __:__",
    labelInstituicao: "Instituição:",
    labelObs: "Obs:",
  },
};

// Drives the auto-generated controls panel: one collapsible group per
// element, one input per field. Number fields use `min`/`max`/`step` (mm,
// or the field's own unit); text fields render as `<input type="text">`,
// and `multiline: true` text fields render as a `<textarea>`.
export const LAYOUT_SCHEMA = [
  {
    key: "clientLogo",
    label: "Logo do laboratório (Campo 1)",
    fields: [
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 0, max: 28, step: 0.5 },
      { key: "w", label: "Largura", type: "number", min: 5, max: 40, step: 0.5 },
      { key: "h", label: "Altura", type: "number", min: 3, max: 26, step: 0.5 },
    ],
  },
  {
    key: "numberLabel",
    label: "Rótulo do número (Campo 2)",
    fields: [
      { key: "text", label: "Texto", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 1, max: 8, step: 0.1 },
    ],
  },
  {
    key: "numberDigits",
    label: "Número (Campo 2)",
    fields: [
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho máx. da fonte", type: "number", min: 2, max: 16, step: 0.1 },
    ],
  },
  {
    key: "patientFields",
    label: "Ficha (campos do paciente)",
    fields: [
      { key: "labelPaciente", label: "Rótulo \"Paciente\"", type: "text" },
      { key: "labelN", label: "Rótulo \"N°\"", type: "text" },
      { key: "labelIdade", label: "Rótulo \"Idade\"", type: "text" },
      { key: "labelMaterial", label: "Rótulo \"Material\"", type: "text" },
      { key: "lineData", label: "Linha \"Data / Hora\"", type: "text" },
      { key: "labelInstituicao", label: "Rótulo \"Instituição\"", type: "text" },
      { key: "labelObs", label: "Rótulo \"Obs\"", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y (1ª linha)", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "width", label: "Largura das linhas", type: "number", min: 10, max: 78, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 1, max: 5, step: 0.05 },
      { key: "pitch", label: "Espaço entre linhas", type: "number", min: 1, max: 6, step: 0.05 },
    ],
  },
];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function mergeLayout(overrides) {
  const merged = deepClone(DEFAULT_LAYOUT);
  if (!overrides) return merged;
  for (const groupKey of Object.keys(merged)) {
    if (overrides[groupKey]) {
      Object.assign(merged[groupKey], overrides[groupKey]);
    }
  }
  return merged;
}
