const STYLES = {
  pass: 'bg-pass/15 text-pass border-pass/30',
  fail: 'bg-fail/15 text-fail border-fail/30',
  incomplete: 'bg-warn/15 text-warn border-warn/30',
};

const LABELS = {
  pass: 'PASS',
  fail: 'FAIL',
  incomplete: 'INCOMPLETE',
};

export default function PassFailBadge({ result, size = 'sm' }) {
  const style = STYLES[result] || STYLES.incomplete;
  const label = LABELS[result] || result?.toUpperCase() || 'N/A';
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-mono font-bold border rounded ${sizeClass} ${style}`}>
      {label}
    </span>
  );
}
