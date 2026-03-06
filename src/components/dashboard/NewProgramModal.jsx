import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { ORIENTATION_OPTIONS, RESPONSE_TYPE_OPTIONS, K_FACTOR_OPTIONS } from '../../data/presets';

export default function NewProgramModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    modelNumber: '',
    projectNumber: '',
    kFactor: '',
    orientation: 'pendent',
    responseType: 'standard',
    temperatureRating: '155°F',
    notes: '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      id: uuid(),
      ...form,
      kFactor: form.kFactor ? parseFloat(form.kFactor) : null,
    });
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">New Sprinkler Program</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Program Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full" placeholder="e.g., In-Rack K5.6" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Model Number</label>
              <input value={form.modelNumber} onChange={e => set('modelNumber', e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Project Number</label>
              <input value={form.projectNumber} onChange={e => set('projectNumber', e.target.value)} className="w-full" placeholder="e.g., R1430.1C" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">K-Factor</label>
              <select value={form.kFactor} onChange={e => set('kFactor', e.target.value)} className="w-full">
                <option value="">Select...</option>
                {K_FACTOR_OPTIONS.map(k => <option key={k} value={k}>K{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Orientation</label>
              <select value={form.orientation} onChange={e => set('orientation', e.target.value)} className="w-full">
                {ORIENTATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Response Type</label>
              <select value={form.responseType} onChange={e => set('responseType', e.target.value)} className="w-full">
                {RESPONSE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Temperature Rating</label>
              <input value={form.temperatureRating} onChange={e => set('temperatureRating', e.target.value)} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full h-20 resize-y" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80 cursor-pointer">Create Program</button>
          </div>
        </form>
      </div>
    </div>
  );
}
