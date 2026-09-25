/** Escapa un valor para CSV (SSV; coma decimal → punto). */
function csvCell(value: string | number): string {
  const s = typeof value === "number" ? String(value).replace(".", ",") : value;
  // Separador ";": solo escapan celdas que contengan ;, comillas o saltos.
  return /["\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  const lines = [header, ...rows];
  return lines.map((row) => row.map(csvCell).join(";")).join("\r\n");
}

export function formatNumberRaw(value: number, digits = 3): string {
  return Number(value.toFixed(digits)).toString();
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv"): void {
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}