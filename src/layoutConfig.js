// Every adjustable position/size/text on the label. This is the single
// source of truth for both the default layout and the on-screen controls
// panel that lets the user edit each element.

const FOOTER_TEXT_DEFAULT =
  "Distribuído por Apta Biotech Imp. Com. Prod. Lab. Ltda - CNPJ 55.990.143/0001-80 - Salto-SP - Brasil - CEP 13.327-543 - " +
  "www.aptabiotech.com.br - contato@aptabiotech.com.br - Fabricado por Diagnostek Ind. Com. Prod. Científicos - LTDA - " +
  "CNPJ 06.223.055/0001-47 - Rua Padre Antonio Pacheco da Silva 431 - Itu-SP - Brasil - CEP 13.303-003 - " +
  "ANVISA- 80368350005 - Resp. Técnico Radu Cesca Filho - CRQ 04206418 - www.dkdiagnostics.com - contato@dkdignostics.com";

const WARNING_TEXT_DEFAULT =
  "Não ingerir o líquido e evitar contato com os olhos, nariz e pele. Em caso de ingestão acidental, procurar um médico.";

export const DEFAULT_LAYOUT = {
  mfgLogo: { x: 1.5, y: 1, w: 19, h: 6.5 },
  clientLogo: { x: 39, y: 1, w: 19, h: 6.5 },
  barcode: { x: 60, y: 1, w: 18, h: 6.4, value: "7898607910371", numberFontSize: 2.1, numberGap: 1.8 },
  title: { x: 1.5, y: 10.6, fontSize: 4, text: "Formalina 10% - Fixador celular" },
  numberLabel: { x: 39, y: 10.8, fontSize: 2.6, text: "Nº" },
  numberDigits: { x: 43.5, y: 11.3, fontSize: 5 },
  conteudoLabel: { x: 1.5, y: 13.2, fontSize: 2.3, text: "CONTEÚDO" },
  conteudoValue: { x: 1.5, y: 17.8, fontSize: 5.5, text: "10mL" },
  iconWarning: { x: 16.5, y: 12.8, size: 3.4 },
  iconProhibited: { x: 20.3, y: 12.8, size: 3.4 },
  productCode: { x: 1.5, y: 21.0, fontSize: 3.1, text: "APT-1312063" },
  productBrand: { x: 1.5, y: 23.5, fontSize: 3.1, text: "MAXBIOPTEST®" },
  patientFields: {
    x: 27,
    y: 12.8,
    width: 31,
    fontSize: 1.85,
    pitch: 2.05,
    labelPaciente: "Paciente:",
    labelN: "N°:",
    labelIdade: "Idade:",
    labelMaterial: "Material:",
    lineData: "Data: __/__/__     Hora: __:__",
    labelInstituicao: "Instituição:",
    labelObs: "Obs:",
  },
  warningText: { x: 59, y: 12, width: 19.5, maxHeight: 8, fontSize: 2.2, text: WARNING_TEXT_DEFAULT },
  complianceIcons: { x: 59, y: 20.8, size: 2.3, gap: 0.4 },
  footer: { y: 24.6, fontSize: 2.1, text: FOOTER_TEXT_DEFAULT },
};

// Drives the auto-generated controls panel: one collapsible group per
// element, one input per field. Number fields use `min`/`max`/`step` (mm,
// or the field's own unit); text fields render as `<input type="text">`,
// and `multiline: true` text fields render as a `<textarea>`.
export const LAYOUT_SCHEMA = [
  {
    key: "mfgLogo",
    label: "Logo Apta (fabricante)",
    fields: [
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 0, max: 28, step: 0.5 },
      { key: "w", label: "Largura", type: "number", min: 5, max: 40, step: 0.5 },
      { key: "h", label: "Altura", type: "number", min: 3, max: 20, step: 0.5 },
    ],
  },
  {
    key: "clientLogo",
    label: "Logo do laboratório (Campo 1)",
    fields: [
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 0, max: 28, step: 0.5 },
      { key: "w", label: "Largura", type: "number", min: 5, max: 27, step: 0.5 },
      { key: "h", label: "Altura", type: "number", min: 3, max: 20, step: 0.5 },
    ],
  },
  {
    key: "barcode",
    label: "Código de barras",
    fields: [
      { key: "value", label: "Dígitos (EAN-13)", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 0, max: 28, step: 0.5 },
      { key: "w", label: "Largura", type: "number", min: 5, max: 30, step: 0.5 },
      { key: "h", label: "Altura", type: "number", min: 3, max: 15, step: 0.5 },
      { key: "numberFontSize", label: "Fonte do número", type: "number", min: 1, max: 4, step: 0.1 },
      { key: "numberGap", label: "Espaço até o número", type: "number", min: 0.5, max: 4, step: 0.1 },
    ],
  },
  {
    key: "title",
    label: "Título (Formalina 10%...)",
    fields: [
      { key: "text", label: "Texto", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho máx. da fonte", type: "number", min: 1.5, max: 7, step: 0.1 },
    ],
  },
  {
    key: "numberLabel",
    label: "Rótulo do número (Campo 2)",
    fields: [
      { key: "text", label: "Texto", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 1, max: 5, step: 0.1 },
    ],
  },
  {
    key: "numberDigits",
    label: "Número (Campo 2)",
    fields: [
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho máx. da fonte", type: "number", min: 2, max: 9, step: 0.1 },
    ],
  },
  {
    key: "conteudoLabel",
    label: "Texto \"CONTEÚDO\"",
    fields: [
      { key: "text", label: "Texto", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 1, max: 5, step: 0.1 },
    ],
  },
  {
    key: "conteudoValue",
    label: "Texto \"10mL\"",
    fields: [
      { key: "text", label: "Texto", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 2, max: 10, step: 0.1 },
    ],
  },
  {
    key: "iconWarning",
    label: "Ícone de risco (triângulo)",
    fields: [
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 0, max: 28, step: 0.5 },
      { key: "size", label: "Tamanho", type: "number", min: 1.5, max: 8, step: 0.1 },
    ],
  },
  {
    key: "iconProhibited",
    label: "Ícone de proibido",
    fields: [
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 0, max: 28, step: 0.5 },
      { key: "size", label: "Tamanho", type: "number", min: 1.5, max: 8, step: 0.1 },
    ],
  },
  {
    key: "productCode",
    label: "Código do produto (APT-...)",
    fields: [
      { key: "text", label: "Texto", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 1.5, max: 6, step: 0.1 },
    ],
  },
  {
    key: "productBrand",
    label: "Marca (MAXBIOPTEST)",
    fields: [
      { key: "text", label: "Texto", type: "text" },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 1.5, max: 6, step: 0.1 },
    ],
  },
  {
    key: "patientFields",
    label: "Campos do paciente (Padrão)",
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
      { key: "width", label: "Largura das linhas", type: "number", min: 10, max: 55, step: 0.5 },
      { key: "fontSize", label: "Tamanho da fonte", type: "number", min: 1, max: 4, step: 0.05 },
      { key: "pitch", label: "Espaço entre linhas", type: "number", min: 1, max: 5, step: 0.05 },
    ],
  },
  {
    key: "warningText",
    label: "Texto de advertência",
    fields: [
      { key: "text", label: "Texto", type: "text", multiline: true },
      { key: "x", label: "Posição X", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "width", label: "Largura máxima", type: "number", min: 8, max: 30, step: 0.5 },
      { key: "maxHeight", label: "Altura máxima", type: "number", min: 3, max: 15, step: 0.5 },
      { key: "fontSize", label: "Tamanho máx. da fonte", type: "number", min: 1, max: 4, step: 0.1 },
    ],
  },
  {
    key: "complianceIcons",
    label: "Ícones de conformidade (CE, IVD...)",
    fields: [
      { key: "x", label: "Posição X (início)", type: "number", min: 0, max: 78, step: 0.5 },
      { key: "y", label: "Posição Y", type: "number", min: 2, max: 28, step: 0.5 },
      { key: "size", label: "Tamanho", type: "number", min: 1.5, max: 6, step: 0.1 },
      { key: "gap", label: "Espaço entre ícones", type: "number", min: 0, max: 3, step: 0.1 },
    ],
  },
  {
    key: "footer",
    label: "Rodapé (dados regulatórios)",
    fields: [
      { key: "text", label: "Texto", type: "text", multiline: true },
      { key: "y", label: "Posição Y (topo da faixa)", type: "number", min: 15, max: 29, step: 0.5 },
      { key: "fontSize", label: "Tamanho máx. da fonte", type: "number", min: 0.6, max: 3.5, step: 0.05 },
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
