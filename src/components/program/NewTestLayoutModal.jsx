import { useState } from 'react';
import { STANDARD_OPTIONS } from '../../data/presets';

export default function NewTestLayoutModal({ kFactor, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    standard: 'FM 2000 §4.31',
    standardSection: '4.31',
  });

  function handleStandardChange(value) {
    const sectionMap = {
      'FM 2000 §4.31': '4.31',
      'FM 2000 §4.32': '4.32',
      'UL 199 §54.4': '54.4',
      'UL 199 §54.5': '54.5',
      'Custom': '',
    };
    const nameMap = {
      'FM 2000 §4.31': 'FM 2000 §4.31 Standard Coverage',
      'FM 2000 §4.32': 'FM 2000 §4.32 Extended Coverage',
      'UL 199 §54.4': 'UL 199 §54.4 16-Pan Distribution',
      'UL 199 §54.5': 'UL 199 §54.5 100-Pan Sidewall',
      'Custom': 'Custom Test',
    };
    setForm(f => ({
      ...f,
      standard: value,
      standardSection: sectionMap[value] || '',
      name: f.name || nameMap[value] || '',
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">New Test Layout</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Standard</label>
            <select value={form.standard} onChange={e => handleStandardChange(e.target.value)} className="w-full">
              {STANDARD_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Layout Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full" autoFocus />
          </div>
          {kFactor && (
            <div className="text-xs text-text-muted p-2 bg-surface-light rounded">
              Test conditions will be auto-populated for K{kFactor} based on the selected standard.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80 cursor-pointer">Create Layout</button>
          </div>
        </form>
      </div>
    </div>
  );
}
