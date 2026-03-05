import type { HashMapStructure } from '../../types/algo-trace';
import './structures.css';

interface Props {
  structure: HashMapStructure;
}

export function HashMapView({ structure }: Props) {
  const entries = Object.entries(structure.data);

  return (
    <div className="structure-card">
      <div className="structure-label">{structure.label}</div>
      {entries.length === 0 ? (
        <div className="hashmap-empty">{ }</div>
      ) : (
        <div className="hashmap-container">
          {entries.map(([key, value]) => (
            <div key={key} className="hashmap-entry">
              <span className="hashmap-key">{key}</span>
              {value !== '' && (
                <>
                  <span className="hashmap-arrow">→</span>
                  <span className="hashmap-value">{String(value)}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
