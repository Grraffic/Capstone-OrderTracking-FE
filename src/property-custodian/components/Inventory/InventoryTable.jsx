import React from "react";

/**
 * InventoryTable Component
 *
 * Displays inventory data in a table format with columns:
 * - No., Item, Beginning Inventory, Unreleased, Purchases, Released, Returns, Available, Ending Inventory, Unit Price, Total Amount
 */
const InventoryTable = ({ inventoryData, allInventoryData }) => {
  /**
   * Calculate total inventory cost per item
   * Formula: (Beginning Inventory × Beginning Inventory Unit Price) + (Purchase₁ × Purchase Unit Price₁) + ... + (Purchaseₙ × Purchase Unit Priceₙ)
   * 
   * Since we don't have separate unit prices for beginning inventory vs purchases,
   * we use the current unit price for both. If purchase prices differ, they would
   * need to be tracked separately in transactions metadata.
   * 
   * @param {object} item - Inventory item data
   * @returns {number} Total inventory cost for this item
   */
  const calculateTotalInventoryCostPerItem = (item) => {
    const beginningInventory = item.beginningInventory || 0;
    const purchases = item.purchases || 0;
    const unitPrice = item.unitPrice || 0;
    
    // Formula: (Beginning Inventory × Unit Price) + (Purchases × Unit Price)
    // Simplified: (Beginning Inventory + Purchases) × Unit Price
    // Note: If purchase prices differ, we'd need to sum individual purchase transactions
    return (beginningInventory + purchases) * unitPrice;
  };

  // Use all inventory (all pages) for total cost so it's easy to view in one place
  const dataForTotalCost = allInventoryData && allInventoryData.length > 0 ? allInventoryData : inventoryData;

  /**
   * Calculate total inventory cost (sum of all items across all pages)
   * @returns {number} Total inventory cost across all items (pages 1–6+)
   */
  const calculateTotalInventoryCost = () => {
    if (!dataForTotalCost || dataForTotalCost.length === 0) return 0;
    
    return dataForTotalCost.reduce((total, item) => {
      const itemCost = calculateTotalInventoryCostPerItem(item);
      return total + (typeof itemCost === 'number' ? itemCost : parseFloat(itemCost) || 0);
    }, 0);
  };

  const totalInventoryCost = calculateTotalInventoryCost();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-sm transition-opacity duration-200 ease-in-out font-sf-medium">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse [&_th]:border-r-0 [&_td]:border-r-0">
          <thead className="bg-[#003363]">
            <tr>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                No.
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Item
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white">
                <span className="text-white block leading-tight">
                  Beginning
                  <br />
                  Inventory
                </span>
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Unreleased
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Purchases
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                <span className="text-white">Released</span>
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Returns
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                <span className="text-white">Available</span>
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Ending <br className="hidden xl:block" />
                Inventory
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Unit Price
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Total Amount
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Total Inventory Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map((row, index) => (
              <tr
                key={row.id || `${row.item}-${row.size}-${row.no}`}
                className={`${
                  index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                } hover:bg-gray-50 transition-all duration-200 ease-in-out`}
              >
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-[#003363] whitespace-nowrap">
                  {row.no}
                </td>
                <td className="px-3 lg:px-4 py-2.5 md:py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs md:text-sm lg:text-sm font-medium text-[#003363] line-clamp-1">
                      {row.item}
                    </span>
                    <span className="inline-block px-1.5 py-px text-[9px] sm:text-[10px] font-sf-regular rounded bg-[#D7D7D7] text-[#48505E] w-fit">
                      {row.size}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-[#E68B00] whitespace-nowrap">
                  {row.beginningInventory}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-[#003363] whitespace-nowrap">
                  {row.unreleased}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-[#003363] whitespace-nowrap">
                  {row.purchases}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                  {row.released}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-[#0060BA] whitespace-nowrap">
                  {row.returns}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                  {row.available}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                  {row.endingInventory}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-[#0060BA] whitespace-nowrap">
                  P {row.unitPrice}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-[#0060BA] whitespace-nowrap">
                  P {row.totalAmount.toLocaleString()}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                  P {calculateTotalInventoryCostPerItem(row).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-[#003363]">
            <tr>
              <td colSpan={12} className="px-2 sm:px-3 md:px-3 lg:px-4 py-3 md:py-4 text-right">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-[#003363]">
                    Total Inventory Cost
                  </span>
                  <span className="text-sm sm:text-base md:text-base lg:text-lg font-semibold text-[#E68B00]">
                    P {totalInventoryCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Card Layout - Very Small Screens */}
      <div className="sm:hidden space-y-3">
        {inventoryData.map((row, index) => (
          <div
            key={row.id || `${row.item}-${row.size}-${row.no}`}
            className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
              index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">
                  #{row.no}
                </span>
                <span className="text-sm font-semibold text-[#003363]">
                  {row.item}
                </span>
              </div>
              <span className="inline-block px-1.5 py-px text-[9px] font-sf-regular rounded bg-[#D7D7D7] text-[#48505E] w-fit">
                {row.size}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">Beginning Inv.</span>
                <p className="text-sm font-semibold text-[#E68B00] mt-0.5">
                  {row.beginningInventory}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Unreleased</span>
                <p className="text-sm font-medium text-[#003363] mt-0.5">
                  {row.unreleased}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Purchases</span>
                <p className="text-sm font-medium text-[#003363] mt-0.5">
                  {row.purchases}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Released</span>
                <p className="text-sm font-sf-medium font-medium text-[#0060BA] mt-0.5">
                  {row.released}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Returns</span>
                <p className="text-sm font-medium text-[#0060BA] mt-0.5">
                  {row.returns}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Available</span>
                <p className="text-sm font-sf-medium font-medium text-[#0060BA] mt-0.5">
                  {row.available}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Ending Inv.</span>
                <p className="text-sm font-sf-medium font-medium text-[#0060BA] mt-0.5">
                  {row.endingInventory}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Unit Price</span>
                <p className="text-sm font-medium text-[#0060BA] mt-0.5">
                  P {row.unitPrice}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-600">Total Amount</span>
              <p className="text-base font-sf-medium font-medium text-[#0060BA] mt-0.5">
                P {row.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        
        {/* Total Inventory Cost - Mobile (sum of all pages) */}
        <div className="bg-[#003363] border border-gray-200 rounded-lg p-4 shadow-sm font-sf-medium">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-white">Total Inventory Cost</span>
            <span className="text-base font-semibold text-[#E68B00]">
              P {totalInventoryCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Tablet/Medium Mobile - Horizontally Scrollable Table */}
      <div className="hidden sm:block md:hidden overflow-x-auto -mx-4 px-4">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full border-collapse [&_th]:border-r-0 [&_td]:border-r-0">
              <thead className="bg-[#003363]">
                <tr>
                  <th className="sticky left-0 z-10 bg-[#003363] px-3 py-3 text-left text-xs font-semibold text-white">
                    No.
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Item
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">
                    <span className="text-white block leading-tight">
                      Beginning
                      <br />
                      Inventory
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Unreleased
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Purchases
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    <span className="text-[#0060BA]">Released</span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Returns
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    <span className="text-[#0060BA]">Available</span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Ending Inv.
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Unit Price
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Total Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Total Inventory Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((row, index) => (
                  <tr
                    key={row.id || `${row.item}-${row.size}-${row.no}`}
                    className={`${
                      index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                    } hover:bg-gray-50 transition-all duration-200 ease-in-out`}
                  >
                    <td className="sticky left-0 z-10 px-3 py-3 text-xs text-[#003363] bg-inherit">
                      {row.no}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-[#003363] line-clamp-1">
                          {row.item}
                        </span>
                        <span className="inline-block px-1.5 py-px text-[9px] font-sf-regular rounded bg-[#D7D7D7] text-[#48505E] w-fit">
                          {row.size}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#E68B00] whitespace-nowrap">
                      {row.beginningInventory}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#003363] whitespace-nowrap">
                      {row.unreleased}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#003363] whitespace-nowrap">
                      {row.purchases}
                    </td>
                    <td className="px-3 py-3 text-xs font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                      {row.released}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#0060BA] whitespace-nowrap">
                      {row.returns}
                    </td>
                    <td className="px-3 py-3 text-xs font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                      {row.available}
                    </td>
                    <td className="px-3 py-3 text-xs font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                      {row.endingInventory}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#0060BA] whitespace-nowrap">
                      P {row.unitPrice}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#0060BA] whitespace-nowrap">
                      P {row.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-xs font-sf-medium font-medium text-[#0060BA] whitespace-nowrap">
                      P {calculateTotalInventoryCostPerItem(row).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-[#003363]">
                <tr>
                  <td colSpan={12} className="px-3 py-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-semibold text-[#003363]">Total Inventory Cost</span>
                      <span className="text-sm font-semibold text-[#E68B00]">
                        P {totalInventoryCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
