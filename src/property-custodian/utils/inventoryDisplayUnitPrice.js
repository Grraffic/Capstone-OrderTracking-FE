/**
 * FIFO display unit price for an inventory row.
 *
 * Rule:
 *  - While beginning inventory still has stock → show the beginning inventory
 *    unit price (unit_price_beginning). This price is fixed at item creation and
 *    is never overridden by subsequent purchase transactions.
 *  - Once beginning inventory is fully exhausted → show the purchase unit price
 *    (the first-entered purchase price from transaction history).
 *  - Fallback: item-level price field.
 */
export function getInventoryDisplayUnitPrice(row) {
  const beginningInventory = Number(row.beginningInventory) || 0;
  const unitPriceBeginning = Number(row.unitPriceBeginning);
  const purchaseUnitPrice = Number(row.purchaseUnitPrice);
  const itemPrice = row.price != null ? Number(row.price) : 0;

  if (
    beginningInventory > 0 &&
    Number.isFinite(unitPriceBeginning) &&
    unitPriceBeginning > 0
  ) {
    return unitPriceBeginning;
  }

  if (Number.isFinite(purchaseUnitPrice) && purchaseUnitPrice > 0)
    return purchaseUnitPrice;

  return Number.isFinite(itemPrice) ? itemPrice : 0;
}
