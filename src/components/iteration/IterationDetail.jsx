import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getIteration, getTestLayout, getProgram, getTestConditionsForLayout, getResultsForIteration, updateIteration, updateDistributionResult, deleteIteration } from '../../db/database';
import PassFailBadge from '../common/PassFailBadge';
import Heatmap from '../visualization/Heatmap';
import { computeIterationResult } from '../../utils/evaluation';

export default function IterationDetail() {
  const { iterationId } = useParams();
  const navigate = useNavigate();
  const [iteration, setIteration] = useState(null);
  const [layout, setLayout] = useState(null);
  const [program, setProgram] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [results, setResults] = useState([]);

  async function load() {
    const iter = await getIteration(iterationId);
    if (!iter) { navigate('/'); return; }
    setIteration(iter);
    const lay = await getTestLayout(iter.testLayoutId);
    setLayout(lay);
    const prog = await getProgram(lay.programId);
    setProgram(prog);
    const conds = await getTestConditionsForLayout(lay.id);
    setConditions(conds);
    const res = await getResultsForIteration(iterationId);
    setResults(res);
  }

  useEffect(() => { load(); }, [iterationId]);

  async function handleOverrideIteration(result, reason) {
    await updateIteration(iterationId, { overrideResult: result, overrideReason: reason });
    load();
  }

  async function handleOverrideResult(resultId, result, reason) {
    await updateDistributionResult(resultId, { overrideResult: result, overrideReason: reason });
    load();
  }

  async function handleDelete() {
    if (!confirm('Delete this iteration and all its results?')) return;
    const layoutId = iteration.testLayoutId;
    await deleteIteration(iterationId);
    navigate(`/layout/${layoutId}`);
  }

  if (!iteration || !layout) return <div className="text-text-muted">Loading...</div>;

  const overallResult = iteration.overrideResult || computeIterationResult(
    conditions.map(c => {
      const r = results.find(res => res.testConditionId === c.id);
      return r ? { result: r.overrideResult || r.autoResult } : null;
    })
  );

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link to="/" className="hover:text-accent no-underline text-text-muted">Programs</Link>
        <span>/</span>
        <Link to={`/program/${layout.programId}`} className="hover:text-accent no-underline text-text-muted">{program?.name}</Link>
        <span>/</span>
        <Link to={`/layout/${layout.id}`} className="hover:text-accent no-underline text-text-muted">{layout.name}</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Iteration #{iteration.sequenceLabel}</h1>
          <div className="text-sm text-text-muted mt-1">{iteration.date}</div>
        </div>
        <div className="flex items-center gap-3">
          <PassFailBadge result={overallResult} size="lg" />
          <button onClick={handleDelete} className="text-xs text-fail hover:text-fail/80 cursor-pointer">Delete</button>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6">
        <div className="flex gap-6">
          {iteration.photoData && (
            <img src={iteration.photoData} alt="Deflector" className="w-32 h-32 object-cover rounded border border-border" />
          )}
          <div>
            {iteration.notes && <p className="text-sm">{iteration.notes}</p>}
            {iteration.overrideResult && (
              <div className="mt-2 text-xs">
                <span className="text-warn">Override: {iteration.overrideResult.toUpperCase()}</span>
                {iteration.overrideReason && <span className="text-text-muted ml-2">— {iteration.overrideReason}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Override controls */}
        <OverrideControl
          current={iteration.overrideResult}
          onOverride={(result, reason) => handleOverrideIteration(result, reason)}
          onClear={() => handleOverrideIteration(null, null)}
          label="Iteration"
        />
      </div>

      {/* Per-condition results */}
      <div className="space-y-6">
        {conditions.map(cond => {
          const result = results.find(r => r.testConditionId === cond.id);
          if (!result) {
            return (
              <div key={cond.id} className="bg-surface border border-border rounded-lg p-4">
                <h3 className="font-medium">{cond.label}</h3>
                <div className="text-sm text-text-muted mt-1">No data</div>
              </div>
            );
          }

          const displayResult = result.overrideResult || result.autoResult;

          return (
            <div key={cond.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{cond.label}</h3>
                  <div className="text-xs text-text-muted">
                    {cond.numSprinklers} heads &middot; {cond.flowPerHead} gpm/head
                  </div>
                </div>
                <PassFailBadge result={displayResult} size="lg" />
              </div>

              <div className="flex gap-6">
                {/* Heatmap */}
                <div>
                  <Heatmap
                    gridData={result.gridData}
                    evaluatedRegion={cond.numSprinklers === 4 ? { startRow: 0, endRow: 3, startCol: 0, endCol: 3 } : layout.evaluatedRegion}
                    testCondition={{ minIndividual: cond.minIndividual, minAverage: cond.minAverage, excludeMiddleRows: cond.excludeMiddleRows }}
                  />
                </div>

                {/* Stats */}
                <div className="w-48 shrink-0">
                  <div className="space-y-2 text-sm font-mono">
                    <Stat label="Average" value={result.average?.toFixed(4)} threshold={cond.minAverage} />
                    <Stat label="Min" value={result.minValue?.toFixed(4)} threshold={cond.minIndividual} />
                    <Stat label="Max" value={result.maxValue?.toFixed(4)} />
                    <Stat label="Low Pans" value={result.lowPanCount} threshold={cond.maxLowPans} inverse />
                    <Stat label="Dry Pans" value={result.dryPanCount} threshold={cond.noDryPans ? 0 : Infinity} inverse />
                  </div>
                  {result.technician && <div className="text-xs text-text-muted mt-3">Tech: {result.technician}</div>}

                  {result.overrideResult && (
                    <div className="mt-2 text-xs text-warn">
                      Override: {result.overrideResult.toUpperCase()}
                      {result.overrideReason && <div className="text-text-muted">{result.overrideReason}</div>}
                    </div>
                  )}

                  <OverrideControl
                    current={result.overrideResult}
                    onOverride={(res, reason) => handleOverrideResult(result.id, res, reason)}
                    onClear={() => handleOverrideResult(result.id, null, null)}
                    label={cond.label}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, threshold, inverse }) {
  let color = 'text-text';
  if (threshold !== undefined && value !== undefined) {
    if (inverse) {
      color = Number(value) <= threshold ? 'text-pass' : 'text-fail';
    } else {
      color = Number(value) >= threshold ? 'text-pass' : 'text-fail';
    }
  }
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}

function OverrideControl({ current, onOverride, onClear, label }) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState('');

  if (current) {
    return (
      <button onClick={onClear} className="text-xs text-text-muted hover:text-warn mt-2 cursor-pointer">
        Clear override
      </button>
    );
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="text-xs text-text-muted hover:text-accent mt-2 cursor-pointer">
        Override result
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Reason..."
        className="text-xs w-40"
      />
      <button onClick={() => { onOverride('pass', reason); setShow(false); }} className="text-xs text-pass cursor-pointer">Pass</button>
      <button onClick={() => { onOverride('fail', reason); setShow(false); }} className="text-xs text-fail cursor-pointer">Fail</button>
      <button onClick={() => setShow(false)} className="text-xs text-text-muted cursor-pointer">Cancel</button>
    </div>
  );
}
