import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { getTestLayout, getTestConditionsForLayout, getIterationsForLayout, createIteration, createDistributionResult, getProgram } from '../../db/database';
import { evaluateDistribution, computeIterationResult } from '../../utils/evaluation';
import PasteGrid from '../common/PasteGrid';
import PhotoCapture from '../common/PhotoCapture';
import PassFailBadge from '../common/PassFailBadge';

export default function AddIteration() {
  const { layoutId } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [program, setProgram] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState(0);

  // Form state
  const [info, setInfo] = useState({ sequenceLabel: '', date: new Date().toISOString().slice(0, 10), photoData: null, notes: '' });
  const [gridDataMap, setGridDataMap] = useState({});
  const [condMeta, setCondMeta] = useState({}); // { [condId]: { technician, testedDate, notes } }

  async function load() {
    const lay = await getTestLayout(layoutId);
    if (!lay) { navigate('/'); return; }
    setLayout(lay);
    const prog = await getProgram(lay.programId);
    setProgram(prog);
    const conds = await getTestConditionsForLayout(layoutId);
    setConditions(conds);

    // Auto-suggest next sequence label
    const iters = await getIterationsForLayout(layoutId);
    const labels = iters.map(i => parseFloat(i.sequenceLabel)).filter(n => !isNaN(n));
    const nextLabel = labels.length > 0 ? Math.floor(Math.max(...labels) + 1) : 1;
    setInfo(prev => ({ ...prev, sequenceLabel: String(nextLabel) }));
  }

  useEffect(() => { load(); }, [layoutId]);

  function getEvaluation(conditionId) {
    const cond = conditions.find(c => c.id === conditionId);
    const grid = gridDataMap[conditionId];
    if (!cond || !grid || grid.length === 0) return null;
    // Check if grid has any non-null values
    const hasData = grid.some(row => row.some(cell => cell !== null && cell !== undefined));
    if (!hasData) return null;
    // Fill nulls with 0 for evaluation
    const filledGrid = grid.map(row => row.map(cell => cell ?? 0));
    return evaluateDistribution(filledGrid, {
      minIndividual: cond.minIndividual,
      minAverage: cond.minAverage,
      maxLowPans: cond.maxLowPans,
      noDryPans: cond.noDryPans,
      excludeMiddleRows: cond.excludeMiddleRows,
    }, layout.evaluatedRegion);
  }

  async function handleSave() {
    const iterationId = uuid();
    const conditionEvals = conditions.map(c => getEvaluation(c.id));
    const overallResult = computeIterationResult(conditionEvals);

    await createIteration({
      id: iterationId,
      testLayoutId: layoutId,
      sequenceLabel: info.sequenceLabel,
      date: info.date,
      photoData: info.photoData,
      notes: info.notes,
      overallAutoResult: overallResult,
      overrideResult: null,
      overrideReason: null,
    });

    for (const cond of conditions) {
      const grid = gridDataMap[cond.id];
      if (!grid) continue;
      const hasData = grid.some(row => row.some(cell => cell !== null && cell !== undefined));
      if (!hasData) continue;
      const filledGrid = grid.map(row => row.map(cell => cell ?? 0));
      const evaluation = evaluateDistribution(filledGrid, {
        minIndividual: cond.minIndividual,
        minAverage: cond.minAverage,
        maxLowPans: cond.maxLowPans,
        noDryPans: cond.noDryPans,
        excludeMiddleRows: cond.excludeMiddleRows,
      }, layout.evaluatedRegion);

      const meta = condMeta[cond.id] || {};
      await createDistributionResult({
        id: uuid(),
        iterationId,
        testConditionId: cond.id,
        gridData: filledGrid,
        average: evaluation.average,
        minValue: evaluation.minValue,
        maxValue: evaluation.maxValue,
        lowPanCount: evaluation.lowPanCount,
        dryPanCount: evaluation.dryPanCount,
        autoResult: evaluation.result,
        overrideResult: null,
        overrideReason: null,
        testedDate: meta.testedDate || info.date,
        technician: meta.technician || '',
        notes: meta.notes || '',
      });
    }

    navigate(`/iteration/${iterationId}`);
  }

  if (!layout) return <div className="text-text-muted">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link to="/" className="hover:text-accent no-underline text-text-muted">Programs</Link>
        <span>/</span>
        <Link to={`/program/${layout.programId}`} className="hover:text-accent no-underline text-text-muted">{program?.name}</Link>
        <span>/</span>
        <Link to={`/layout/${layoutId}`} className="hover:text-accent no-underline text-text-muted">{layout.name}</Link>
      </div>

      <h1 className="text-xl font-bold mb-4">Add Iteration</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-6">
        {['Info', 'Distribution Data', 'Review & Save'].map((label, i) => (
          <button
            key={i}
            onClick={() => setStep(i + 1)}
            className={`text-sm font-medium pb-1 cursor-pointer ${
              step === i + 1 ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-surface border border-border rounded-lg p-5 space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Iteration Label</label>
              <input value={info.sequenceLabel} onChange={e => setInfo(f => ({ ...f, sequenceLabel: e.target.value }))} className="w-full font-mono" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Date</label>
              <input type="date" value={info.date} onChange={e => setInfo(f => ({ ...f, date: e.target.value }))} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Photo</label>
            <PhotoCapture value={info.photoData} onChange={v => setInfo(f => ({ ...f, photoData: v }))} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Notes (what changed from last iteration)</label>
            <textarea value={info.notes} onChange={e => setInfo(f => ({ ...f, notes: e.target.value }))} className="w-full h-24 resize-y" />
          </div>
          <button onClick={() => setStep(2)} className="px-4 py-2 bg-accent text-white rounded text-sm cursor-pointer">Next: Distribution Data</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {conditions.map((cond, i) => {
              const ev = getEvaluation(cond.id);
              return (
                <button
                  key={cond.id}
                  onClick={() => setActiveTab(i)}
                  className={`px-3 py-2 text-sm rounded-t whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    activeTab === i ? 'bg-surface border border-border border-b-0 text-text' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {cond.label}
                  {ev && <PassFailBadge result={ev.result} />}
                </button>
              );
            })}
          </div>

          {conditions[activeTab] && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{conditions[activeTab].label}</h3>
                  <div className="text-xs text-text-muted mb-3">
                    {conditions[activeTab].numSprinklers} heads &middot; {conditions[activeTab].flowPerHead} gpm/head &middot;
                    Min avg: {conditions[activeTab].minAverage} &middot; Min individual: {conditions[activeTab].minIndividual}
                  </div>

                  <PasteGrid
                    rows={conditions[activeTab].numSprinklers === 4 ? 4 : layout.roomGridRows}
                    cols={conditions[activeTab].numSprinklers === 4 ? 4 : layout.roomGridCols}
                    value={gridDataMap[conditions[activeTab].id] || []}
                    onChange={grid => setGridDataMap(m => ({ ...m, [conditions[activeTab].id]: grid }))}
                    evaluatedRegion={conditions[activeTab].numSprinklers === 4 ? { startRow: 0, endRow: 3, startCol: 0, endCol: 3 } : layout.evaluatedRegion}
                    testCondition={{ minIndividual: conditions[activeTab].minIndividual, minAverage: conditions[activeTab].minAverage, excludeMiddleRows: conditions[activeTab].excludeMiddleRows }}
                  />

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Technician</label>
                      <input
                        value={condMeta[conditions[activeTab].id]?.technician || ''}
                        onChange={e => setCondMeta(m => ({ ...m, [conditions[activeTab].id]: { ...m[conditions[activeTab].id], technician: e.target.value } }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Test Date</label>
                      <input
                        type="date"
                        value={condMeta[conditions[activeTab].id]?.testedDate || ''}
                        onChange={e => setCondMeta(m => ({ ...m, [conditions[activeTab].id]: { ...m[conditions[activeTab].id], testedDate: e.target.value } }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time evaluation panel */}
                <div className="w-52 shrink-0">
                  <EvalPanel evaluation={getEvaluation(conditions[activeTab].id)} condition={conditions[activeTab]} />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-text-muted text-sm cursor-pointer">Back</button>
            <button onClick={() => setStep(3)} className="px-4 py-2 bg-accent text-white rounded text-sm cursor-pointer">Next: Review</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="font-medium mb-3">Review</h3>
          <div className="text-sm mb-2">
            <span className="text-text-muted">Iteration:</span> <span className="font-mono font-bold">#{info.sequenceLabel}</span>
            <span className="text-text-muted ml-4">Date:</span> {info.date}
          </div>
          {info.notes && <div className="text-sm text-text-muted mb-3">{info.notes}</div>}

          <div className="space-y-2 mb-4">
            {conditions.map(cond => {
              const ev = getEvaluation(cond.id);
              return (
                <div key={cond.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32">{cond.label}</span>
                  {ev ? (
                    <>
                      <PassFailBadge result={ev.result} />
                      <span className="text-text-muted font-mono text-xs">
                        avg: {ev.average.toFixed(3)} | min: {ev.minValue.toFixed(3)} | low: {ev.lowPanCount} | dry: {ev.dryPanCount}
                      </span>
                    </>
                  ) : (
                    <span className="text-text-muted text-xs">No data</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-text-muted">Overall:</span>
            <PassFailBadge
              result={computeIterationResult(conditions.map(c => getEvaluation(c.id)))}
              size="lg"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-text-muted text-sm cursor-pointer">Back</button>
            <button onClick={handleSave} className="px-4 py-2 bg-pass text-white rounded-lg text-sm font-medium hover:bg-pass/80 cursor-pointer">Save Iteration</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EvalPanel({ evaluation, condition }) {
  if (!evaluation) {
    return (
      <div className="bg-surface-light border border-border rounded p-3">
        <div className="text-xs text-text-muted mb-2">Evaluation</div>
        <div className="text-sm text-text-muted">Enter data to see results</div>
      </div>
    );
  }

  return (
    <div className="bg-surface-light border border-border rounded p-3">
      <div className="text-xs text-text-muted mb-2">Evaluation</div>
      <PassFailBadge result={evaluation.result} size="lg" />
      <div className="mt-3 space-y-1.5 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-text-muted">Average</span>
          <span className={evaluation.average >= condition.minAverage ? 'text-pass' : 'text-fail'}>
            {evaluation.average.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Min req</span>
          <span className="text-text-muted">{condition.minAverage}</span>
        </div>
        <div className="h-px bg-border my-1" />
        <div className="flex justify-between">
          <span className="text-text-muted">Min Value</span>
          <span className={evaluation.minValue >= condition.minIndividual ? 'text-pass' : 'text-fail'}>
            {evaluation.minValue.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Max Value</span>
          <span>{evaluation.maxValue.toFixed(4)}</span>
        </div>
        <div className="h-px bg-border my-1" />
        <div className="flex justify-between">
          <span className="text-text-muted">Low Pans</span>
          <span className={evaluation.lowPanCount <= condition.maxLowPans ? 'text-pass' : 'text-fail'}>
            {evaluation.lowPanCount} / {condition.maxLowPans} max
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Dry Pans</span>
          <span className={evaluation.dryPanCount === 0 ? 'text-pass' : 'text-fail'}>
            {evaluation.dryPanCount}
          </span>
        </div>
      </div>
    </div>
  );
}
