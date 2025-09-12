import React from 'react';

const Table15Page = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Table 15. Shuttle Wet IRAS Designs</h1>
        <p className="text-sm text-gray-600">FM Global Property Loss Prevention Data Sheet 8-34</p>
        <p className="text-sm text-gray-600">Section 2.2.3.2.2</p>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className="border border-gray-400 p-2 text-left">
                Figure Showing IRAS<br/>Arrangement per Table 14
              </th>
              <th rowSpan={2} className="border border-gray-400 p-2 text-left">
                Commodity
              </th>
              <th rowSpan={2} className="border border-gray-400 p-2">
                Max. Vertical Distance<br/>Top of Storage to Ceiling**<br/>
                ft (m)
              </th>
              <th colSpan={4} className="border border-gray-400 p-2">
                In-Rack Sprinkler Design*
              </th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2">
                Min. Flow<br/>gpm (L/min)
              </th>
              <th className="border border-gray-400 p-2">
                Min.<br/>K-Factor<br/>(metric)
              </th>
              <th className="border border-gray-400 p-2">
                No. of IRAS<br/>in Design
              </th>
              <th className="border border-gray-400 p-2">
                Hydraulically<br/>Balance?
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Figure 4 Section */}
            <tr>
              <td rowSpan={10} className="border border-gray-400 p-2 align-top font-medium">
                Figure 4
              </td>
              <td rowSpan={2} className="border border-gray-400 p-2">Class 3</td>
              <td rowSpan={2} className="border border-gray-400 p-2 text-center">10 (3)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">6 if one IRAS level or<br/>10 (5 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 text-center">65 (250)</td>
              <td className="border border-gray-400 p-2 text-center">14 (200)</td>
              <td className="border border-gray-400 p-2">5 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            
            <tr>
              <td rowSpan={2} className="border border-gray-400 p-2">Cartoned Unexpanded Plastics</td>
              <td rowSpan={2} className="border border-gray-400 p-2 text-center">10 (3)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 text-center">65 (250)</td>
              <td className="border border-gray-400 p-2 text-center">14 (200)</td>
              <td className="border border-gray-400 p-2">5 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>

            <tr>
              <td rowSpan={2} className="border border-gray-400 p-2">Cartoned Expanded Plastics</td>
              <td rowSpan={2} className="border border-gray-400 p-2 text-center">10 (3)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 text-center">100 (380)</td>
              <td className="border border-gray-400 p-2 text-center">14 (200)</td>
              <td className="border border-gray-400 p-2">5 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>

            <tr>
              <td rowSpan={2} className="border border-gray-400 p-2">Uncartoned Unexpanded Plastics</td>
              <td rowSpan={2} className="border border-gray-400 p-2 text-center">10 (3)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 text-center">120 (455)</td>
              <td className="border border-gray-400 p-2 text-center">22.4 (320)</td>
              <td className="border border-gray-400 p-2">5 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>

            <tr>
              <td rowSpan={2} className="border border-gray-400 p-2">Uncartoned Expanded Plastics</td>
              <td rowSpan={2} className="border border-gray-400 p-2 text-center">10 (3)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 text-center">120 (455)</td>
              <td className="border border-gray-400 p-2 text-center">22.4 (320)</td>
              <td className="border border-gray-400 p-2">5 & 2*** on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>

            {/* Figures 5 or 7 Section */}
            <tr className="bg-gray-50">
              <td rowSpan={24} className="border border-gray-400 p-2 align-top font-medium">
                Figures 5 or 7
              </td>
              <td rowSpan={4} className="border border-gray-400 p-2">Class 3</td>
              <td className="border border-gray-400 p-2 text-center">25 (7.6)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">6 if one IRAS level or<br/>10 (5 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">30 (9.1)</td>
              <td className="border border-gray-400 p-2 text-center">65 (250)</td>
              <td className="border border-gray-400 p-2 text-center">14 (200)</td>
              <td className="border border-gray-400 p-2">4 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">40 (12.2)</td>
              <td className="border border-gray-400 p-2 text-center">120 (455)</td>
              <td className="border border-gray-400 p-2 text-center">22.4 (320)</td>
              <td className="border border-gray-400 p-2">4 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">DNA</td>
              <td className="border border-gray-400 p-2 text-center" colSpan={4}>Use Ceiling Sprinkler Design per Table 16</td>
            </tr>

            <tr className="bg-gray-50">
              <td rowSpan={4} className="border border-gray-400 p-2">Cartoned Unexpanded Plastics</td>
              <td className="border border-gray-400 p-2 text-center">20 (6.1)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">30 (9.1)</td>
              <td className="border border-gray-400 p-2 text-center">65 (250)</td>
              <td className="border border-gray-400 p-2 text-center">14 (200)</td>
              <td className="border border-gray-400 p-2">4 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">40 (12.2)</td>
              <td className="border border-gray-400 p-2 text-center">120 (455)</td>
              <td className="border border-gray-400 p-2 text-center">22.4 (320)</td>
              <td className="border border-gray-400 p-2">4 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">DNA</td>
              <td className="border border-gray-400 p-2 text-center" colSpan={4}>Use Ceiling Sprinkler Design per Table 16</td>
            </tr>

            <tr className="bg-gray-50">
              <td rowSpan={3} className="border border-gray-400 p-2">Cartoned Expanded Plastics</td>
              <td className="border border-gray-400 p-2 text-center">15 (4.6)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">30 (9.1)</td>
              <td className="border border-gray-400 p-2 text-center">100 (380)</td>
              <td className="border border-gray-400 p-2 text-center">14 (200)</td>
              <td className="border border-gray-400 p-2">4 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">DNA</td>
              <td className="border border-gray-400 p-2 text-center" colSpan={4}>Use Ceiling Sprinkler Design per Table 16</td>
            </tr>

            <tr className="bg-gray-50">
              <td rowSpan={3} className="border border-gray-400 p-2">Uncartoned Unexpanded Plastics</td>
              <td className="border border-gray-400 p-2 text-center">10 (3)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">30 (9.1)</td>
              <td className="border border-gray-400 p-2 text-center">120 (455)</td>
              <td className="border border-gray-400 p-2 text-center">22.4 (320)</td>
              <td className="border border-gray-400 p-2">4 on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">DNA</td>
              <td className="border border-gray-400 p-2 text-center" colSpan={4}>Use Ceiling Sprinkler Design per Table 16</td>
            </tr>

            <tr className="bg-gray-50">
              <td rowSpan={3} className="border border-gray-400 p-2">Uncartoned Expanded Plastics</td>
              <td className="border border-gray-400 p-2 text-center">10 (3)</td>
              <td className="border border-gray-400 p-2 text-center">30 (115)</td>
              <td className="border border-gray-400 p-2 text-center">5.6 (80)</td>
              <td className="border border-gray-400 p-2">8 if one IRAS level or<br/>14 (7 on top 2 levels)</td>
              <td className="border border-gray-400 p-2 text-center">Yes</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">30 (9.1)</td>
              <td className="border border-gray-400 p-2 text-center">120 (455)</td>
              <td className="border border-gray-400 p-2 text-center">22.4 (320)</td>
              <td className="border border-gray-400 p-2">4 & 2*** on top IRAS level</td>
              <td className="border border-gray-400 p-2 text-center">No (Pendent)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 text-center">DNA</td>
              <td className="border border-gray-400 p-2 text-center" colSpan={4}>Use Ceiling Sprinkler Design per Table 16</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footnotes */}
      <div className="mt-6 text-sm">
        <p className="font-semibold mb-2">Notes:</p>
        <p className="mb-1">
          * The indicated in-rack sprinkler design flow is based on a minimum 9 in. (225 mm) vertical distance between storage tier levels. 
          If the vertical distance between vertical tier levels is less than 9 in. (225 mm), add 20 gpm (75 L/min) to the indicated design flow.
        </p>
        <p className="mb-1">
          ** Maximum vertical distance between the top of the storage and the ceiling equals the indicated value.
        </p>
        <p className="mb-1">
          *** Additional sprinklers required for uncartoned expanded plastics
        </p>
        <p className="mb-1">
          DNA = Does Not Apply - In-rack sprinklers extend to top of storage
        </p>
      </div>

      {/* Additional Requirements */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="font-semibold text-sm mb-2">Important Requirements:</p>
        <ul className="text-sm space-y-1">
          <li>• Must use figure arrangement from Table 14</li>
          <li>• Minimum 7 psi (0.5 bar) pressure regardless of calculated value</li>
          <li>• No interpolation allowed - use specified values</li>
          <li>• Hydraulically balance where indicated</li>
        </ul>
      </div>
    </div>
  );
};

export default Table15Page;