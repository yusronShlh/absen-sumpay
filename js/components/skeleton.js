export function createTableSkeleton(rows = 8, columns = 5) {
  let html = "";

  for (let i = 0; i < rows; i++) {
    html += `<tr>`;

    for (let j = 0; j < columns; j++) {
      html += `
        <td class="px-3 md:px-6 py-4">
            <div class="h-4 bg-gray-200 rounded animate-pulse">

            </div>
        </td>`;
    }

    html += `</tr>`;
  }

  return html;
}
