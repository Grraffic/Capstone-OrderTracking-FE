import React from "react";

/**
 * InventoryTable Component
 * 
 * Displays inventory data in a table format with columns:
 * - No., Item, Beginning Inventory, Unreleased, Purchases, Released, Returns, Available, Ending Inventory, Unit Price, Total Amount
 */
const InventoryTable = ({ inventoryData }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0C2340]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                No.
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Item
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                <span className="text-white">
                  Beginning <br /> Inventory
                </span>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Unreleased
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Purchases
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                <span className="text-white">Released</span>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Returns
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                <span className="text-white">Available</span>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Ending <br />
                Inventory
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Unit Price
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Total Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map((row, index) => (
              <tr
                key={row.no}
                className={`${
                  index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                } hover:bg-gray-50 transition-colors duration-150`}
              >
                <td className="px-4 py-3 text-sm text-gray-900">{row.no}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {row.item}
                    </span>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full w-fit">
                      {row.size}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#E68B00]">
                  {row.beginningInventory}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.unreleased}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.purchases}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#4A90E2]">
                  {row.released}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.returns}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#4A90E2]">
                  {row.available}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#E68B00]">
                  {row.endingInventory}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  P {row.unitPrice}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  P {row.totalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Table - Horizontally Scrollable with Fixed First Column */}
      <div className="md:hidden overflow-x-auto">
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
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                    <span className="text-[#E68B00]">Beginning Inv.</span>
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
                    key={row.no}
                    className={`${
                      index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                    }`}
                  >
                    <td className="sticky left-0 z-10 px-3 py-3 text-xs text-gray-900 bg-inherit">
                      {row.no}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-900">
                          {row.item}
                        </span>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full w-fit">
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

