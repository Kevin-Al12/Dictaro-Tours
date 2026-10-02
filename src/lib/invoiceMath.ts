// unitPrice se entiende como precio final por unidad (impuesto incluido), igual que
// el resto del sistema (Product/Quote nunca separaron el ITBIS). Aquí se descompone
// en subtotal + ITBIS para el documento fiscal.
export function computeLineAmounts(unitPrice: number, quantity: number, itbisRate: number) {
  const grossTotal = unitPrice * quantity;
  const subtotal = itbisRate > 0 ? grossTotal / (1 + itbisRate) : grossTotal;
  const itbis = grossTotal - subtotal;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itbis: Math.round(itbis * 100) / 100,
    total: Math.round(grossTotal * 100) / 100,
  };
}

export function sumLineAmounts(lines: { subtotal: number; itbis: number; total: number }[]) {
  return lines.reduce(
    (acc, l) => ({
      subtotal: Math.round((acc.subtotal + l.subtotal) * 100) / 100,
      itbis: Math.round((acc.itbis + l.itbis) * 100) / 100,
      total: Math.round((acc.total + l.total) * 100) / 100,
    }),
    { subtotal: 0, itbis: 0, total: 0 }
  );
}
