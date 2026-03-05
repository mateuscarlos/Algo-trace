import type { Structure } from '../../types/algo-trace';
import { ArrayView } from './ArrayView';
import { HashMapView } from './HashMapView';
import { VariableView } from './VariableView';

interface Props {
  structure: Structure;
}

export function StructureRenderer({ structure }: Props) {
  switch (structure.type) {
    case 'array':
      return <ArrayView structure={structure} />;
    case 'hash-map':
      return <HashMapView structure={structure} />;
    case 'variable':
      return <VariableView structure={structure} />;
    default:
      return (
        <div className="structure-card">
          <div className="structure-label">{(structure as Structure).label || 'Desconhecido'}</div>
          <pre style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {JSON.stringify((structure as Structure), null, 2)}
          </pre>
        </div>
      );
  }
}
