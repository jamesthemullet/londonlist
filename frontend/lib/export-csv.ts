export type ExportableListItem = {
  name: string;
  category: string | null;
  completed: boolean;
  visitedAt: string | null;
  notes: string | null;
  lat?: number | null;
  lng?: number | null;
};

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvString(items: ExportableListItem[], _listName: string): string {
  const headers = ['Name', 'Category', 'Completed', 'Visited At', 'Notes', 'Latitude', 'Longitude'];
  const rows = items.map((item) => [
    escapeCsvField(item.name),
    escapeCsvField(item.category ?? ''),
    item.completed ? 'Yes' : 'No',
    escapeCsvField(item.visitedAt ?? ''),
    escapeCsvField(item.notes ?? ''),
    item.lat != null ? String(item.lat) : '',
    item.lng != null ? String(item.lng) : '',
  ]);

  const lines = [headers.join(','), ...rows.map((row) => row.join(','))];
  return lines.join('\n');
}

export function triggerCsvDownload(csvString: string, listName: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = listName.replace(/[^a-z0-9-]/gi, '_').toLowerCase().replace(/^_+|_+$/g, '').replace(/_+/g, '_') || 'my-list';
  link.href = url;
  link.download = `${safeName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
