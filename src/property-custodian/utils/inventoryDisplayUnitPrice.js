/**
 * WAC display unit price for an inventory row.
 */
export function getInventoryDisplayUnitPrice(row) {
  const unitPrice = Number(row.unitPrice);
  const purchaseUnitPrice = Number(row.purchaseUnitPrice);
  const itemPrice = row.price != null ? Number(row.price) : 0;
  if (Number.isFinite(unitPrice) && unitPrice > 0) return unitPrice;
  if (Number.isFinite(purchaseUnitPrice) && purchaseUnitPrice > 0)
    return purchaseUnitPrice;
  return Number.isFinite(itemPrice) ? itemPrice : 0;
}
