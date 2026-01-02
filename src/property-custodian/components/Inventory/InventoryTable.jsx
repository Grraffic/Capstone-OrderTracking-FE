import React from "react";

/**
 * InventoryTable Component
 *
 * Displays inventory data in a table format with columns:
 * - No., Item, Beginning Inventory, Unreleased, Purchases, Released, Returns, Available, Ending Inventory, Unit Price, Total Amount
 */
const InventoryTable = ({ inventoryData }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-sm transition-opacity duration-200 ease-in-out">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0C2340]">
            <tr>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                No.
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white whitespace-nowrap">
                Item
              </th>
              <th className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-left text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-white">
                <span className="text-[#E68B00] block leading-tight">
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
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                  {row.no}
                </td>
                <td className="px-3 lg:px-4 py-2.5 md:py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs md:text-sm lg:text-sm font-medium text-gray-900 line-clamp-1">
                      {row.item}
                    </span>
                    <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#E68B00]/10 text-[#E68B00] text-[10px] sm:text-xs font-semibold rounded-md w-fit border border-[#E68B00]/20">
                      {row.size}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-[#E68B00] whitespace-nowrap">
                  {row.beginningInventory}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                  {row.unreleased}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                  {row.purchases}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-[#4A90E2] whitespace-nowrap">
                  {row.released}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                  {row.returns}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-[#4A90E2] whitespace-nowrap">
                  {row.available}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold text-[#E68B00] whitespace-nowrap">
                  {row.endingInventory}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                  P {row.unitPrice}
                </td>
                <td className="px-2 sm:px-3 md:px-3 lg:px-4 py-2.5 md:py-3 text-[10px] sm:text-xs md:text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                  P {row.totalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
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
                <span className="text-sm font-semibold text-gray-900">
                  {row.item}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-[#E68B00]/10 text-[#E68B00] text-xs font-semibold rounded-md border border-[#E68B00]/20">
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
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {row.unreleased}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Purchases</span>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {row.purchases}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Released</span>
                <p className="text-sm font-semibold text-[#4A90E2] mt-0.5">
                  {row.released}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Returns</span>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {row.returns}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Available</span>
                <p className="text-sm font-semibold text-[#4A90E2] mt-0.5">
                  {row.available}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Ending Inv.</span>
                <p className="text-sm font-semibold text-[#E68B00] mt-0.5">
                  {row.endingInventory}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Unit Price</span>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  P {row.unitPrice}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-600">Total Amount</span>
              <p className="text-base font-semibold text-gray-900 mt-0.5">
                P {row.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet/Medium Mobile - Horizontally Scrollable Table */}
      <div className="hidden sm:block md:hidden overflow-x-auto -mx-4 px-4">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-[#0C2340]">
                <tr>
                  <th className="sticky left-0 z-10 bg-[#0C2340] px-3 py-3 text-left text-xs font-semibold text-white">
                    No.
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Item
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">
                    <span className="text-[#E68B00] block leading-tight">
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
                    <span className="text-[#4A90E2]">Released</span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    Returns
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    <span className="text-[#4A90E2]">Available</span>
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
                    <td className="sticky left-0 z-10 px-3 py-3 text-xs text-gray-900 bg-inherit">
                      {row.no}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-900 line-clamp-1">
                          {row.item}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-[#E68B00]/10 text-[#E68B00] text-[10px] font-semibold rounded-md w-fit border border-[#E68B00]/20">
                          {row.size}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#E68B00] whitespace-nowrap">
                      {row.beginningInventory}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                      {row.unreleased}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                      {row.purchases}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#4A90E2] whitespace-nowrap">
                      {row.released}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                      {row.returns}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#4A90E2] whitespace-nowrap">
                      {row.available}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#E68B00] whitespace-nowrap">
                      {row.endingInventory}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                      P {row.unitPrice}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                      P {row.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
