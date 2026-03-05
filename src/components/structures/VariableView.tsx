import type { VariableStructure } from '../../types/algo-trace';
import './structures.css';

interface Props {
  structure: VariableStructure;
}

export function VariableView({ structure }: Props) {
  const displayValue = () => {
    if (structure.data === null) return 'null';
    if (typeof structure.data === 'boolean') return structure.data ? 'True' : 'False';
    return String(structure.data);
  };

  const colorClass = () => {
    if (typeof structure.data === 'boolean') {
      return structure.data ? 'var-true' : 'var-false';
    }
    return '';
  };

  return (
    <div className="structure-card variable-card">
      <div className="structure-label">{structure.label}</div>
      <div className={`variable-value ${colorClass()}`}>
        {displayValue()}
      </div>
    </div>
  );
}
