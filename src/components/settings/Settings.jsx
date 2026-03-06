import { useState } from 'react';
import { downloadExport, handleImportFile } from '../../utils/exportImport';
import { clearAllData } from '../../db/database';

export default function Settings() {
  const [importStatus, setImportStatus] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  const [confirmClear, setConfirmClear] = useState('');
  const [clearing, setClearing] = useState(false);

  async function handleExport() {
    await downloadExport();
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await handleImportFile(file, importMode);
      setImportStatus({ type: 'success', message: `Imported ${result.programs} programs, ${result.layouts} layouts, ${result.iterations} iterations` });
    } catch (err) {
      setImportStatus({ type: 'error', message: err.message });
    }
    e.target.value = '';
  }

  async function handleClear() {
    if (confirmClear !== 'CONFIRM') return;
    setClearing(true);
    await clearAllData();
    setClearing(false);
    setConfirmClear('');
    window.location.reload();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Export */}
      <section className="bg-surface border border-border rounded-lg p-5 mb-4">
        <h2 className="font-medium mb-2">Export Data</h2>
        <p className="text-sm text-text-muted mb-3">Download a complete backup of all your data as JSON.</p>
        <button onClick={handleExport} className="px-4 py-2 bg-accent text-white rounded text-sm cursor-pointer hover:bg-accent/80">
          Export All Data
        </button>
      </section>

      {/* Import */}
      <section className="bg-surface border border-border rounded-lg p-5 mb-4">
        <h2 className="font-medium mb-2">Import Data</h2>
        <p className="text-sm text-text-muted mb-3">Upload a SprayTrace JSON backup.</p>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="importMode" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} /> Merge
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="importMode" checked={importMode === 'overwrite'} onChange={() => setImportMode('overwrite')} /> Overwrite
          </label>
        </div>
        <input type="file" accept=".json" onChange={handleImport} className="text-sm" />
        {importStatus && (
          <div className={`mt-2 text-sm ${importStatus.type === 'success' ? 'text-pass' : 'text-fail'}`}>
            {importStatus.message}
          </div>
        )}
      </section>

      {/* Clear */}
      <section className="bg-surface border border-fail/30 rounded-lg p-5">
        <h2 className="font-medium text-fail mb-2">Clear All Data</h2>
        <p className="text-sm text-text-muted mb-3">Permanently delete all data. This cannot be undone.</p>
        <div className="flex items-center gap-3">
          <input
            value={confirmClear}
            onChange={e => setConfirmClear(e.target.value)}
            placeholder='Type "CONFIRM" to proceed'
            className="w-52 text-sm"
          />
          <button
            onClick={handleClear}
            disabled={confirmClear !== 'CONFIRM' || clearing}
            className="px-4 py-2 bg-fail text-white rounded text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {clearing ? 'Clearing...' : 'Clear All Data'}
          </button>
        </div>
      </section>

      {/* About */}
      <section className="mt-6 text-sm text-text-muted">
        <p>SprayTrace v{__APP_VERSION__} — Deflector Distribution Tracker</p>
        <p className="mt-1">Data stored locally in your browser (IndexedDB). No data is sent to any server.</p>
      </section>
    </div>
  );
}
