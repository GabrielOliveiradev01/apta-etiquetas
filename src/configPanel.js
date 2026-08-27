import { LAYOUT_SCHEMA } from "./layoutConfig.js";

function createFieldInput(group, field, layout, onChange) {
  const isNumber = field.type !== "text";
  const input = document.createElement(field.multiline ? "textarea" : "input");
  input.id = `layout-input-${group.key}-${field.key}`;

  if (isNumber) {
    input.type = "number";
    input.min = String(field.min);
    input.max = String(field.max);
    input.step = String(field.step);
  } else if (!field.multiline) {
    input.type = "text";
  } else {
    input.rows = 4;
  }

  input.value = layout[group.key][field.key];

  input.addEventListener("input", () => {
    if (isNumber) {
      const value = parseFloat(input.value);
      if (Number.isNaN(value)) return;
      layout[group.key][field.key] = value;
    } else {
      layout[group.key][field.key] = input.value;
    }
    onChange();
  });

  return input;
}

/**
 * Renders one collapsible group per label element, with a number input for
 * each position/size field and a text input (or textarea) for each editable
 * text field. Wired to mutate `layout` in place and call `onChange` after
 * every edit. Re-render (call again) whenever `layout` is reset from outside
 * so the inputs reflect the new values.
 */
export function buildConfigPanel(container, layout, onChange) {
  container.innerHTML = "";

  LAYOUT_SCHEMA.forEach((group) => {
    const details = document.createElement("details");
    details.className = "layout-group";

    const summary = document.createElement("summary");
    summary.textContent = group.label;
    details.appendChild(summary);

    const grid = document.createElement("div");
    grid.className = "layout-group-grid";

    group.fields.forEach((field) => {
      const wrap = document.createElement("label");
      wrap.className = field.type === "text" ? "layout-field layout-field-text" : "layout-field";
      if (field.multiline) wrap.classList.add("layout-field-wide");

      const span = document.createElement("span");
      span.textContent = field.type === "text" ? field.label : `${field.label} (mm)`;

      const input = createFieldInput(group, field, layout, onChange);

      wrap.appendChild(span);
      wrap.appendChild(input);
      grid.appendChild(wrap);
    });

    details.appendChild(grid);
    container.appendChild(details);
  });
}

// Reflects `layout` values into the existing inputs without rebuilding the
// panel (so open/closed group state survives) — used after a drag edit on
// the preview canvas changes a value the panel also displays.
export function updatePanelInputs(container, layout) {
  LAYOUT_SCHEMA.forEach((group) => {
    group.fields.forEach((field) => {
      const input = container.querySelector(`#layout-input-${group.key}-${field.key}`);
      if (!input || document.activeElement === input) return;
      const value = layout[group.key][field.key];
      input.value = field.type === "text" ? value : Math.round(value * 100) / 100;
    });
  });
}
