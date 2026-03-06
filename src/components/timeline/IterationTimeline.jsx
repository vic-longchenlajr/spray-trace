import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTestLayout, getTestConditionsForLayout, getIterationsForLayout, getResultsForIteration, getProgram } from '../../db/database';
import PassFailBadge from '../common/PassFailBadge';
import { evaluateDistribution, computeIterationResult } from '../../utils/evaluation';

export default function IterationTimeline() {
  const { layoutId } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [program, setProgram] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [iterResults, setIterResults] = useState({});

  async function load() {
    const lay = await getTestLayout(layoutId);
    if (!lay) { navigate('/'); return; }
    setLayout(lay);
    const prog = await getProgram(lay.programId);
    setProgram(prog);
    const conds = await getTestConditionsForLayout(layoutId);
    setConditions(conds);
    const iters = await getIterationsForLayout(layoutId);

    // Sort by sequence label (natural sort)
    iters.sort((a, b) => {
      const na = parseFloat(a.sequenceLabel) || 0;
      const nb = parseFloat(b.sequenceLabel) || 0;
      return nb - na; // newest first
    });
    setIterations(iters);

    const results = {};
    for (const iter of iters) {
      const res = await getResultsForIteration(iter.id);
      const condResults = conds.map(cond => {
        const r = res.find(x => x.testConditionId === cond.id);
        return r || null;
      });
      results[iter.id] = {
        perCondition: condResults,
        overall: iter.overrideResult || computeIterationResult(condResults.map(r => r ? { result: r.autoResult } : null)),
      };
    }
    setIterResults(results);
  }

  useEffect(() => { load(); }, [layoutId]);

  if (!layout) return <div className="text-text-muted">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
        <Link to="/" className="hover:text-accent no-underline text-text-muted">Programs</Link>
        <span>/</span>
        <Link to={`/program/${layout.programId}`} className="hover:text-accent no-underline text-text-muted">{program?.name || '...'}</Link>
      </div>

      <div className="flex items-center justify-between mt-3 mb-2">
        <div>
          <h1 className="text-xl font-bold">{layout.name}</h1>
          <div className="text-sm text-text-muted mt-0.5">
            {layout.standard} &middot; {layout.roomGridRows}x{layout.roomGridCols} grid &middot; {layout.panSize}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/layout/${layoutId}/compare`}
            className="px-3 py-1.5 bg-surface-light border border-border rounded text-sm text-text-muted hover:text-text no-underline transition-colors"
          >
            Compare
          </Link>
          <Link
            to={`/layout/${layoutId}/add`}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80 no-underline transition-colors"
          >
            + Add Iteration
          </Link>
        </div>
      </div>

      {/* Condition headers */}
      <div className="mt-4 bg-surface border border-border rounded-lg overflow-hidden">
        <div className="grid items-center gap-2 px-4 py-2 bg-surface-light border-b border-border text-xs text-text-muted font-medium"
          style={{ gridTemplateColumns: `80px 80px 1fr ${conditions.map(() => '80px').join(' ')} 90px` }}
        >
          <div>Iteration</div>
          <div>Date</div>
          <div>Notes</div>
          {conditions.map(c => <div key={c.id} className="text-center">{c.label}</div>)}
          <div className="text-center">Overall</div>
        </div>

        {iterations.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">No iterations yet</div>
        ) : (
          iterations.map((iter, idx) => {
            const res = iterResults[iter.id];
            const prevIter = iterations[idx + 1]; // Previous in time (lower index = newer)
            return (
              <Link
                key={iter.id}
                to={`/iteration/${iter.id}`}
                className="grid items-center gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-light transition-colors no-underline"
                style={{ gridTemplateColumns: `80px 80px 1fr ${conditions.map(() => '80px').join(' ')} 90px` }}
              >
                <div className="font-mono font-bold text-text text-sm">#{iter.sequenceLabel}</div>
                <div className="text-xs text-text-muted">{iter.date}</div>
                <div className="text-sm text-text-muted truncate">{iter.notes || '—'}</div>
                {conditions.map((cond, ci) => {
                  const r = res?.perCondition[ci];
                  return (
                    <div key={cond.id} className="text-center">
                      {r ? <PassFailBadge result={r.autoResult} /> : <span className="text-xs text-text-muted">—</span>}
                    </div>
                  );
                })}
                <div className="text-center">
                  <PassFailBadge result={res?.overall || 'incomplete'} />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
