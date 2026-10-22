export type ExportListItem = {
  name: string;
  category: string | null;
  completed: boolean;
  visitedAt: string | null;
  notes: string | null;
  osm_id: string;
};

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportListToCsv(items: ExportListItem[], listName: string): string {
  const headers = ['Name', 'Category', 'Status', 'Visited At', 'Notes', 'OpenStreetMap URL'];
  const rows = items.map((item) => [
    escapeCsvField(item.name),
    escapeCsvField(item.category ?? ''),
    item.completed ? 'Done' : 'To do',
    escapeCsvField(item.visitedAt ? new Date(item.visitedAt).toLocaleDateString('en-GB') : ''),
    escapeCsvField(item.notes ?? ''),
    `https://www.openstreetmap.org/${item.osm_id}`,
  ]);

  const metaRow = `# London List export: ${escapeCsvField(listName)}`;
  const csvLines = [metaRow, headers.join(','), ...rows.map((r) => r.join(','))];
  return csvLines.join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildCsvFilename(listName: string): string {
  const slug = listName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `london-list-${slug}.csv`;
}
