import { LABEL_W, LABEL_H } from "./layout.js";

const HANDLE_MM = 3; // resize-handle hit zone at an element's bottom-right corner
const MIN_BOX = 3;
const MIN_FONT = 1;
const MIN_SIZE = 1.2;

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// Picks the smallest hitbox containing the point (rather than draw order),
// so a small element nested inside a larger one's loose bounding box — e.g.
// an icon sitting near a text block — is still the one that gets grabbed.
function hitTest(hitboxes, mm) {
  let best = null;
  for (const b of hitboxes) {
    if (mm.x < b.x || mm.x > b.x + b.w || mm.y < b.y || mm.y > b.y + b.h) continue;
    const area = b.w * b.h;
    if (!best || area < best.box.w * best.box.h) {
      const resizable = b.resize !== "none" && b.resize !== "vmove";
      const nearCorner = resizable && mm.x >= b.x + b.w - HANDLE_MM && mm.y >= b.y + b.h - HANDLE_MM;
      best = { box: b, mode: nearCorner ? "resize" : "move" };
    }
  }
  return best;
}

function drawOverlay(ctx, box, mode) {
  ctx.save();
  ctx.strokeStyle = "#2b6cb0";
  ctx.lineWidth = 0.25;
  ctx.setLineDash([0.8, 0.6]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);
  if (box.resize !== "none" && box.resize !== "vmove") {
    ctx.fillStyle = mode === "resize" ? "#2b6cb0" : "#ffffff";
    ctx.strokeStyle = "#2b6cb0";
    ctx.lineWidth = 0.2;
    const hs = 1.4;
    ctx.beginPath();
    ctx.rect(box.x + box.w - hs, box.y + box.h - hs, hs, hs);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Makes the preview canvas directly editable: drag an element's body to
 * move it, drag its bottom-right corner to resize (box dimensions, font
 * size, or icon size, depending on the element). Mirrors the numeric
 * controls panel — both read/write the same `layout` object.
 *
 * `redraw()` must call drawLabel and return the hitboxes array it produces,
 * so hit-testing always matches exactly what's on screen.
 *
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   ctx: CanvasRenderingContext2D,
 *   scale: number,               // px per mm the canvas/ctx were set up with
 *   getLayout: () => object,
 *   redraw: () => Array,         // clears + draws the label, returns hitboxes
 *   onChange: () => void,        // called after a value actually changes (persist)
 * }} opts
 */
export function attachInteractivePreview({ canvas, ctx, scale, getLayout, redraw, onChange }) {
  let dragging = null;
  let hoverHit = null;
  let currentHitboxes = [];

  canvas.style.touchAction = "none";

  function pointerToMm(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: ((evt.clientX - rect.left) * scaleX) / scale,
      y: ((evt.clientY - rect.top) * scaleY) / scale,
    };
  }

  function paint() {
    currentHitboxes = redraw();
    const active = dragging ? hitboxes_find(dragging.key) : hoverHit;
    if (active) drawOverlay(ctx, active.box, active.mode);
  }

  function hitboxes_find(key) {
    const box = currentHitboxes.find((b) => b.key === key);
    return box ? { box, mode: dragging?.mode } : null;
  }

  function applyDrag(mm) {
    const layout = getLayout();
    const cfg = layout[dragging.key];
    const dx = mm.x - dragging.startMm.x;
    const dy = mm.y - dragging.startMm.y;

    if (dragging.mode === "move") {
      if (dragging.resizeType === "vmove") {
        cfg.y = clamp(dragging.startCfg.y + dy, 0, LABEL_H - 1);
      } else {
        cfg.x = clamp(dragging.startCfg.x + dx, 0, LABEL_W - 1);
        cfg.y = clamp(dragging.startCfg.y + dy, 0, LABEL_H - 1);
      }
    } else if (dragging.mode === "resize") {
      if (dragging.resizeType === "wh") {
        cfg.w = clamp(dragging.startCfg.w + dx, MIN_BOX, LABEL_W);
        cfg.h = clamp(dragging.startCfg.h + dy, MIN_BOX, LABEL_H);
      } else if (dragging.resizeType === "size") {
        cfg.size = clamp(dragging.startCfg.size + (dx + dy) / 2, MIN_SIZE, 15);
      } else if (dragging.resizeType === "font") {
        cfg.fontSize = clamp(dragging.startCfg.fontSize + (dx + dy) / 6, MIN_FONT, 12);
      }
    }
  }

  canvas.addEventListener("pointerdown", (evt) => {
    const mm = pointerToMm(evt);
    const hit = hitTest(currentHitboxes, mm);
    if (!hit) return;
    canvas.setPointerCapture(evt.pointerId);
    dragging = {
      key: hit.box.key,
      mode: hit.mode,
      resizeType: hit.box.resize,
      startMm: mm,
      startCfg: { ...getLayout()[hit.box.key] },
    };
    evt.preventDefault();
    paint();
  });

  canvas.addEventListener("pointermove", (evt) => {
    const mm = pointerToMm(evt);
    if (dragging) {
      applyDrag(mm);
      paint();
      onChange();
      return;
    }
    const hit = hitTest(currentHitboxes, mm);
    canvas.style.cursor = hit ? (hit.mode === "resize" ? "nwse-resize" : "move") : "default";
    if (hit?.box.key !== hoverHit?.box.key || hit?.mode !== hoverHit?.mode) {
      hoverHit = hit;
      paint();
    }
  });

  function endDrag() {
    if (!dragging) return;
    dragging = null;
    paint();
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("pointerout", () => {
    if (dragging) return; // pointer capture keeps tracking outside the canvas too
    if (hoverHit) {
      hoverHit = null;
      canvas.style.cursor = "default";
      paint();
    }
  });

  paint();
}
