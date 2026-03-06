import { useRef } from 'react';

export default function PhotoCapture({ value, onChange }) {
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 bg-surface-light border border-border rounded text-sm text-text-muted hover:text-text hover:border-border-light transition-colors cursor-pointer"
        >
          {value ? 'Change Photo' : 'Add Photo'}
        </button>
        {value && (
          <>
            <img src={value} alt="Deflector" className="h-16 w-16 object-cover rounded border border-border" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-fail hover:text-fail/80 cursor-pointer"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}
