/**
 * FIFO display unit price for an inventory row — matches the Unit Price column.
 * - While beginning inventory is not exhausted by released qty: beginning unit price.
 * - When beginning layer is exhausted: purchase unit price.
 */
export function getInventoryDisplayUnitPrice(row) {
  const beg = row.beginningInventory ?? 0;
  const released = row.released ?? 0;
  const unitPrice = row.unitPrice ?? 0;
  const unitPriceBeginning = row.unitPriceBeginning ?? unitPrice;
  const itemPrice = row.price != null ? Number(row.price) : undefined;
  const fallbackPrice = unitPriceBeginning || unitPrice || itemPrice || 0;

  if (released >= beg && beg > 0) {
    return unitPrice || fallbackPrice;
  }
  return unitPriceBeginning || fallbackPrice;
}
