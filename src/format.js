// Pure helpers (no React) so they can be unit-tested with `node --test`.

export function formatMoney(amount, currency) {
  if (typeof amount !== "number") return null;
  if (currency) {
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  }
  return String(amount);
}

export function formatWagering(x) {
  return typeof x === "number" ? `${x}×` : null;
}

export function safeUrl(u) {
  try {
    const p = new URL(u);
    return p.protocol === "https:" || p.protocol === "http:" ? p.href : null;
  } catch {
    return null;
  }
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
}
