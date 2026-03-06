import { exportAllData, importData } from '../db/database';

export async function downloadExport() {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spraytrace-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function handleImportFile(file, mode = 'merge') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version || !data.programs) {
          reject(new Error('Invalid SprayTrace backup file'));
          return;
        }
        await importData(data, mode);
        resolve({
          programs: data.programs?.length || 0,
          layouts: data.testLayouts?.length || 0,
          iterations: data.iterations?.length || 0,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
