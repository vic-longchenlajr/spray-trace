import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTestLayout, getProgram, getTestConditionsForLayout, getIterationsForLayout, getResultsForIteration } from '../../db/database';
import { computeDeltaGrid } from '../../utils/comparison';
import Heatmap from '../visualization/Heatmap';
import DeltaHeatmap from '../visualization/DeltaHeatmap';
import PassFailBadge from '../common/PassFailBadge';

export default function ComparisonView() {
  const { layoutId } = useParams();
  const [layout, setLayout] = useState(null);
  const [program, setProgram] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [iterAId, setIterAId] = useState('');
  const [iterBId, setIterBId] = useState('');
  const [resultsA, setResultsA] = useState([]);
  const [resultsB, setResultsB] = useState([]);

  async function load() {
    const lay = await getTestLayout(layoutId);
    setLayout(lay);
    const prog = await getProgram(lay.programId);
    setProgram(prog);
    const conds = await getTestConditionsForLayout(layoutId);
    setConditions(conds);
    const iters = await getIterationsForLayout(layoutId);
    iters.sort((a, b) => parseFloat(a.sequenceLabel) - parseFloat(b.sequenceLabel));
    setIterations(iters);

    // Default to last two
    if (iters.length >= 2) {
      setIterAId(iters[iters.length - 2].id);
      setIterBId(iters[iters.length - 1].id);
    }
  }

  useEffect(() => { load(); }, [layoutId]);

  useEffect(() => {
    if (iterAId) getResultsForIteration(iterAId).then(setResultsA);
    else setResultsA([]);
  }, [iterAId]);

  useEffect(() => {
    if (iterBId) getResultsForIteration(iterBId).then(setResultsB);
    else setResultsB([]);
  }, [iterBId]);

  if (!layout) return <div className="text-text-muted">Loading...</div>;

  const iterA = iterations.find(i => i.id === iterAId);
  const iterB = iterations.find(i => i.id === iterBId);

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link to="/" className="hover:text-accent no-underline text-text-muted">Programs</Link>
        <span>/</span>
        <Link to={`/program/${layout.programId}`} className="hover:text-accent no-underline text-text-muted">{program?.name}</Link>
        <span>/</span>
        <Link to={`/layout/${layoutId}`} className="hover:text-accent no-underline text-text-muted">{layout.name}</Link>
      </div>

      <h1 className="text-xl font-bold mb-4">Compare Iterations</h1>

      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="block text-xs text-text-muted mb-1">Iteration A</label>
          <select value={iterAId} onChange={e => setIterAId(e.target.value)} className="w-48">
            <option value="">Select...</option>
            {iterations.map(i => <option key={i.id} value={i.id}>#{i.sequenceLabel} ({i.date})</option>)}
          </select>
        </div>
        <span className="text-text-muted mt-4">vs</span>
        <div>
          <label className="block text-xs text-text-muted mb-1">Iteration B</label>
          <select value={iterBId} onChange={e => setIterBId(e.target.value)} className="w-48">
            <option value="">Select...</option>
            {iterations.map(i => <option key={i.id} value={i.id}>#{i.sequenceLabel} ({i.date})</option>)}
          </select>
        </div>
      </div>

      {iterA && iterB && conditions.map(cond => {
        const rA = resultsA.find(r => r.testConditionId === cond.id);
        const rB = resultsB.find(r => r.testConditionId === cond.id);

        if (!rA || !rB) return (
          <div key={cond.id} className="mb-4 bg-surface border border-border rounded-lg p-4">
            <h3 className="font-medium">{cond.label}</h3>
            <div className="text-sm text-text-muted mt-1">Data not available for both iterations</div>
          </div>
        );

        const delta = computeDeltaGrid(rA.gridData, rB.gridData);
        const evalRegion = cond.numSprinklers === 4
          ? { startRow: 0, endRow: 3, startCol: 0, endCol: 3 }
          : layout.evaluatedRegion;

        return (
          <div key={cond.id} className="mb-6 bg-surface border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">{cond.label}</h3>

            <div className="flex gap-4 overflow-x-auto">
              <div>
                <div className="text-xs text-text-muted mb-1">#{iterA.sequenceLabel}</div>
                <Heatmap
                  gridData={rA.gridData}
                  evaluatedRegion={evalRegion}
                  testCondition={{ minIndividual: cond.minIndividual, minAverage: cond.minAverage, excludeMiddleRows: cond.excludeMiddleRows }}
                />
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">#{iterB.sequenceLabel}</div>
                <Heatmap
                  gridData={rB.gridData}
                  evaluatedRegion={evalRegion}
                  testCondition={{ minIndividual: cond.minIndividual, minAverage: cond.minAverage, excludeMiddleRows: cond.excludeMiddleRows }}
                />
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Delta (B - A)</div>
                <DeltaHeatmap deltaGrid={delta} />
              </div>
            </div>

            {/* Metrics table */}
            <table className="mt-4 text-sm font-mono">
              <thead>
                <tr className="text-text-muted text-xs">
                  <th className="text-left pr-6 pb-1">Metric</th>
                  <th className="text-right pr-6 pb-1">#{iterA.sequenceLabel}</th>
                  <th className="text-right pr-6 pb-1">#{iterB.sequenceLabel}</th>
                  <th className="text-right pb-1">Change</th>
                </tr>
              </thead>
              <tbody>
                <MetricRow label="Average" a={rA.average} b={rB.average} higher />
                <MetricRow label="Min Value" a={rA.minValue} b={rB.minValue} higher />
                <MetricRow label="Max Value" a={rA.maxValue} b={rB.maxValue} />
                <MetricRow label="Low Pans" a={rA.lowPanCount} b={rB.lowPanCount} higher={false} integer />
                <MetricRow label="Dry Pans" a={rA.dryPanCount} b={rB.dryPanCount} higher={false} integer />
                <tr>
                  <td className="text-text-muted pr-6 pt-1">Result</td>
                  <td className="text-right pr-6 pt-1"><PassFailBadge result={rA.autoResult} /></td>
                  <td className="text-right pr-6 pt-1"><PassFailBadge result={rB.autoResult} /></td>
                  <td className="text-right pt-1">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function MetricRow({ label, a, b, higher = true, integer = false }) {
  const diff = b - a;
  const improved = higher ? diff > 0 : diff < 0;
  const regressed = higher ? diff < 0 : diff > 0;
  const fmt = v => integer ? v : v?.toFixed(4);
  const fmtDiff = integer ? (diff > 0 ? `+${diff}` : String(diff)) : (diff > 0 ? `+${diff.toFixed(4)}` : diff.toFixed(4));

  return (
    <tr>
      <td className="text-text-muted pr-6 py-0.5">{label}</td>
      <td className="text-right pr-6">{fmt(a)}</td>
      <td className="text-right pr-6">{fmt(b)}</td>
      <td className={`text-right ${improved ? 'text-pass' : regressed ? 'text-fail' : 'text-text-muted'}`}>
        {fmtDiff} {improved ? '\u25B2' : regressed ? '\u25BC' : ''}
      </td>
    </tr>
  );
}
