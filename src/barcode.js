import JsBarcode from "jsbarcode";

let cache = { value: null, canvas: null };

/**
 * Renders `value` as an EAN-13 barcode, cached by value so redrawing the
 * label on every drag/keystroke doesn't re-run JsBarcode unless the digits
 * actually changed. Returns null if `value` isn't valid EAN-13 — callers
 * should fall back to a placeholder rather than crash mid-draw.
 */
export function getBarcodeCanvas(value) {
  if (cache.value === value) return cache.canvas;

  const canvas = document.createElement("canvas");
  try {
    JsBarcode(canvas, value, {
      format: "EAN13",
      width: 2,
      height: 60,
      margin: 0,
      displayValue: false,
    });
    cache = { value, canvas };
  } catch {
    cache = { value, canvas: null };
  }
  return cache.canvas;
}
