import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProgram, updateProgram, deleteProgram, getTestLayoutsForProgram, createTestLayout, createTestCondition, getIterationsForLayout } from '../../db/database';
import { STANDARD_OPTIONS, ORIENTATION_OPTIONS, RESPONSE_TYPE_OPTIONS, K_FACTOR_OPTIONS, generateTestConditions, getDefaultLayoutConfig } from '../../data/presets';
import PassFailBadge from '../common/PassFailBadge';
import NewTestLayoutModal from './NewTestLayoutModal';
import { v4 as uuid } from 'uuid';

export default function ProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [layoutMeta, setLayoutMeta] = useState({});
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showNewLayout, setShowNewLayout] = useState(false);

  async function load() {
    const prog = await getProgram(programId);
    if (!prog) { navigate('/'); return; }
    setProgram(prog);
    setEditForm(prog);
    const lays = await getTestLayoutsForProgram(programId);
    setLayouts(lays);
    const meta = {};
    for (const l of lays) {
      const iters = await getIterationsForLayout(l.id);
      meta[l.id] = { iterationCount: iters.length };
    }
    setLayoutMeta(meta);
  }

  useEffect(() => { load(); }, [programId]);

  async function handleSaveEdit() {
    await updateProgram(programId, {
      name: editForm.name,
      modelNumber: editForm.modelNumber,
      projectNumber: editForm.projectNumber,
      kFactor: editForm.kFactor ? parseFloat(editForm.kFactor) : null,
      orientation: editForm.orientation,
      responseType: editForm.responseType,
      temperatureRating: editForm.temperatureRating,
      notes: editForm.notes,
    });
    setEditing(false);
    load();
  }

  async function handleDelete() {
    if (!confirm('Delete this program and all its data?')) return;
    await deleteProgram(programId);
    navigate('/');
  }

  async function handleCreateLayout(data) {
    const layoutId = uuid();
    const config = getDefaultLayoutConfig(data.standard);

    // For 4-head only tests in FM 4.31, use 4x4 grid
    const is4HeadOnly = data.standard === 'FM 2000 §4.31' && program?.orientation === 'sidewall';
    const layoutRecord = {
      id: layoutId,
      programId,
      name: data.name,
      standard: data.standard,
      standardSection: data.standardSection || '',
      panSize: config.panSize,
      roomGridRows: config.roomGridRows,
      roomGridCols: config.roomGridCols,
      evaluatedRegion: config.evaluatedRegion,
      deflectorToPanDistance: config.deflectorToPanDistance,
      collectionTimeMinimum: config.collectionTimeMinimum,
      seededFromIterationId: data.seededFromIterationId || null,
    };
    await createTestLayout(layoutRecord);

    // Auto-generate conditions
    const conditions = generateTestConditions(data.standard, String(program.kFactor), program.orientation, layoutId);
    for (const cond of conditions) {
      await createTestCondition(cond);
    }

    setShowNewLayout(false);
    load();
  }

  if (!program) return <div className="text-text-muted">Loading...</div>;

  const set = (key, val) => setEditForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <Link to="/" className="text-sm text-accent hover:text-accent/80 no-underline">&larr; Programs</Link>

      <div className="mt-4 bg-surface border border-border rounded-lg p-5">
        {editing ? (
          <div className="space-y-3">
            <input value={editForm.name} onChange={e => set('name', e.target.value)} className="w-full text-lg font-bold" />
            <div className="grid grid-cols-3 gap-3">
              <input value={editForm.modelNumber || ''} onChange={e => set('modelNumber', e.target.value)} placeholder="Model Number" className="w-full" />
              <input value={editForm.projectNumber || ''} onChange={e => set('projectNumber', e.target.value)} placeholder="Project Number" className="w-full" />
              <select value={editForm.kFactor || ''} onChange={e => set('kFactor', e.target.value)} className="w-full">
                <option value="">K-Factor</option>
                {K_FACTOR_OPTIONS.map(k => <option key={k} value={k}>K{k}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <select value={editForm.orientation} onChange={e => set('orientation', e.target.value)} className="w-full">
                {ORIENTATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={editForm.responseType} onChange={e => set('responseType', e.target.value)} className="w-full">
                {RESPONSE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input value={editForm.temperatureRating || ''} onChange={e => set('temperatureRating', e.target.value)} placeholder="Temp Rating" className="w-full" />
            </div>
            <textarea value={editForm.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Notes" className="w-full h-20 resize-y" />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-accent text-white rounded text-sm cursor-pointer">Save</button>
              <button onClick={() => { setEditing(false); setEditForm(program); }} className="px-3 py-1.5 text-text-muted text-sm cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">{program.name}</h1>
                <div className="text-sm text-text-muted mt-1">
                  {program.modelNumber && <span className="mr-3">{program.modelNumber}</span>}
                  {program.projectNumber && <span className="mr-3">{program.projectNumber}</span>}
                  {program.temperatureRating && <span>{program.temperatureRating}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {program.kFactor && <span className="px-2 py-0.5 bg-accent/15 text-accent border border-accent/30 rounded text-xs font-mono">K{program.kFactor}</span>}
                {program.orientation && <span className="px-2 py-0.5 bg-surface-light border border-border rounded text-xs text-text-muted capitalize">{program.orientation}</span>}
                {program.responseType && <span className="px-2 py-0.5 bg-surface-light border border-border rounded text-xs text-text-muted">{program.responseType === 'quick-response' ? 'QR' : 'SR'}</span>}
              </div>
            </div>
            {program.notes && <p className="text-sm text-text-muted mt-2">{program.notes}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(true)} className="text-xs text-accent hover:text-accent/80 cursor-pointer">Edit</button>
              <button onClick={handleDelete} className="text-xs text-fail hover:text-fail/80 cursor-pointer">Delete</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Test Layouts</h2>
        <button
          onClick={() => setShowNewLayout(true)}
          className="px-3 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded text-sm hover:bg-accent/25 transition-colors cursor-pointer"
        >
          + New Layout
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        {layouts.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">No test layouts yet. Create one to start testing.</div>
        ) : (
          layouts.map(layout => (
            <Link
              key={layout.id}
              to={`/layout/${layout.id}`}
              className="block bg-surface border border-border rounded-lg p-4 hover:border-border-light transition-colors no-underline"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text">{layout.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {layout.standard} &middot; {layout.roomGridRows}x{layout.roomGridCols} grid &middot; {layout.panSize}
                  </div>
                </div>
                <div className="text-sm text-text-muted">
                  {layoutMeta[layout.id]?.iterationCount || 0} iterations
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {showNewLayout && (
        <NewTestLayoutModal
          kFactor={program.kFactor}
          onSave={handleCreateLayout}
          onClose={() => setShowNewLayout(false)}
        />
      )}
    </div>
  );
}
