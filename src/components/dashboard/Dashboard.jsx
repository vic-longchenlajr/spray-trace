import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPrograms, getTestLayoutsForProgram, getIterationsForLayout, getResultsForIteration, createProgram } from '../../db/database';
import { seedSampleData } from '../../data/sampleData';
import SearchFilter from '../common/SearchFilter';
import PassFailBadge from '../common/PassFailBadge';
import NewProgramModal from './NewProgramModal';
import { computeTrend } from '../../utils/comparison';

export default function Dashboard() {
  const [programs, setPrograms] = useState([]);
  const [programMeta, setProgramMeta] = useState({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPrograms() {
    let progs = await getAllPrograms();
    // Seed sample data on first launch
    if (progs.length === 0) {
      await seedSampleData();
      progs = await getAllPrograms();
    }
    setPrograms(progs);

    // Load metadata for each program
    const meta = {};
    for (const prog of progs) {
      const layouts = await getTestLayoutsForProgram(prog.id);
      let layoutMeta = [];
      for (const layout of layouts) {
        const iterations = await getIterationsForLayout(layout.id);
        const latestIter = iterations.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        let latestResult = 'incomplete';
        let allResults = [];
        if (latestIter) {
          const results = await getResultsForIteration(latestIter.id);
          allResults = results;
          if (results.length > 0) {
            const hasPass = results.every(r => r.autoResult === 'pass');
            const hasFail = results.some(r => r.autoResult === 'fail');
            latestResult = hasFail ? 'fail' : hasPass ? 'pass' : 'incomplete';
          }
        }
        const trend = computeTrend(iterations, allResults);
        layoutMeta.push({ ...layout, iterationCount: iterations.length, latestResult, trend });
      }
      meta[prog.id] = layoutMeta;
    }
    setProgramMeta(meta);
    setLoading(false);
  }

  useEffect(() => { loadPrograms(); }, []);

  async function handleCreateProgram(data) {
    await createProgram(data);
    setShowNew(false);
    loadPrograms();
  }

  const filtered = programs.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.modelNumber?.toLowerCase().includes(q) || p.projectNumber?.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'kFactor') return (a.kFactor || 0) - (b.kFactor || 0);
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });

  if (loading) return <div className="text-text-muted">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Programs</h1>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80 transition-colors cursor-pointer"
        >
          + New Program
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <SearchFilter value={search} onChange={setSearch} placeholder="Search programs..." />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm">
          <option value="updatedAt">Recently Updated</option>
          <option value="name">Alphabetical</option>
          <option value="kFactor">K-Factor</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <div className="text-lg mb-2">No programs yet</div>
          <div className="text-sm">Create a program to start tracking deflector iterations.</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {sorted.map(prog => {
            const layouts = programMeta[prog.id] || [];
            return (
              <Link
                key={prog.id}
                to={`/program/${prog.id}`}
                className="block bg-surface border border-border rounded-lg p-4 hover:border-border-light transition-colors no-underline"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-text">{prog.name}</div>
                    <div className="text-sm text-text-muted mt-0.5">
                      {prog.modelNumber && <span>{prog.modelNumber}</span>}
                      {prog.projectNumber && <span className="ml-3">{prog.projectNumber}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {prog.kFactor && (
                      <span className="px-2 py-0.5 bg-accent/15 text-accent border border-accent/30 rounded text-xs font-mono">
                        K{prog.kFactor}
                      </span>
                    )}
                    {prog.orientation && (
                      <span className="px-2 py-0.5 bg-surface-light border border-border rounded text-xs text-text-muted capitalize">
                        {prog.orientation}
                      </span>
                    )}
                  </div>
                </div>
                {layouts.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {layouts.map(layout => (
                      <div key={layout.id} className="flex items-center gap-2 text-sm">
                        <span className="text-text-muted">{layout.name}</span>
                        <span className="text-xs text-text-muted">({layout.iterationCount} iterations)</span>
                        <PassFailBadge result={layout.latestResult} />
                        {layout.trend === 'up' && <span className="text-pass text-xs">&#9650;</span>}
                        {layout.trend === 'down' && <span className="text-fail text-xs">&#9660;</span>}
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {showNew && <NewProgramModal onSave={handleCreateProgram} onClose={() => setShowNew(false)} />}
    </div>
  );
}
