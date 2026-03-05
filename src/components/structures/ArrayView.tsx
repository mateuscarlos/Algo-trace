import type { ArrayStructure } from '../../types/algo-trace';
import './structures.css';

interface Props {
  structure: ArrayStructure;
}

export function ArrayView({ structure }: Props) {
  return (
    <div className="structure-card">
      <div className="structure-label">{structure.label}</div>
      <div className="array-container">
        {structure.data.map((val, idx) => {
          const isHighlighted = structure.highlights?.includes(idx);
          const pointerLabels = Object.entries(structure.pointers || {})
            .filter(([, i]) => i === idx)
            .map(([name]) => name);

          return (
            <div key={idx} className="array-cell-wrapper">
              {pointerLabels.length > 0 && (
                <div className="pointer-labels">
                  {pointerLabels.map((p) => (
                    <span key={p} className="pointer-label">{p}</span>
                  ))}
                  <div className="pointer-arrow">↓</div>
                </div>
              )}
              <div className={`array-cell ${isHighlighted ? 'highlighted' : ''}`}>
                <span className="array-index">{idx}</span>
                <span className="array-value">{String(val)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
