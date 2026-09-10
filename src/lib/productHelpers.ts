export type DiscountInfo = {
  active: boolean;
  pct: number;
  label: string | null;
  original: number | null;
};

type PriceProduct = {
  discount_enabled?: boolean;
  discount_value?: number | string | null;
  discount_type?: string | null;
  original_price?: number | string | null;
  price?: number | string | null;
};

/**
 * Determina si el producto tiene una promoción real activa:
 * descuento habilitado, valor > 0, y precio original mayor al final.
 */
export function isDiscounted(product: PriceProduct): boolean {
  const price = Number(product.price) || 0;
  const original = Number(product.original_price) || 0;
  const value = Number(product.discount_value) || 0;
  return Boolean(product.discount_enabled && value > 0 && original > price && price > 0);
}

/**
 * Datos de la etiqueta de descuento: "20% OFF" para porcentaje, "Oferta" para monto fijo.
 */
export function getDiscountInfo(product: PriceProduct): DiscountInfo {
  const original = Number(product.original_price) || 0;
  const price = Number(product.price) || 0;
  if (!isDiscounted(product)) return { active: false, pct: 0, label: null, original: null };
  const pct = Math.round(((original - price) / original) * 100);
  const label = product.discount_type === 'fixed' ? 'Oferta' : `${pct}% OFF`;
  return { active: true, pct, label, original };
}

/**
 * Calcula el precio final a partir del precio base y la configuración de descuento.
 * Solo retorna un valor menor al base cuando el descuento es válido (valor > 0).
 */
export function computeFinalPrice(
  basePrice: number | string,
  enabled: boolean,
  type: string | null | undefined,
  value: number | string,
): number {
  const base = Number(basePrice) || 0;
  const v = Number(value) || 0;
  if (!enabled || v <= 0 || base <= 0) return base;
  if (type === 'fixed') return Math.max(0, Math.round((base - v) * 100) / 100);
  return Math.max(0, Math.round(base * (1 - Math.min(v, 100) / 100) * 100) / 100);
}

/**
 * Genera un ID de producto único con el formato A-##### o B-#####.
 * A: consumibles capilares/barba/cuidado personal. B: herramientas y accesorios.
 */
export function generateProductCode(prefix: 'A' | 'B', existingCodes: string[]): string {
  const used = new Set(existingCodes.map((code) => String(code || '').trim().toUpperCase()));
  for (let attempt = 0; attempt < 500; attempt++) {
    const digits = String(Math.floor(10000 + Math.random() * 90000));
    const code = `${prefix}-${digits}`;
    if (!used.has(code)) return code;
  }
  let n = 10000;
  while (n < 99999) {
    const code = `${prefix}-${n}`;
    if (!used.has(code)) return code;
    n += 1;
  }
  return `${prefix}-${String(Date.now()).slice(-5)}`;
}

export function randomCodeDigits(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}