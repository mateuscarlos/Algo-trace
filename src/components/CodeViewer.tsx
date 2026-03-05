import './CodeViewer.css';

interface Props {
  code: string;
  language: string;
  highlightLine?: number;
}

export function CodeViewer({ code, language, highlightLine }: Props) {
  const lines = code.split('\n');

  return (
    <div className="code-viewer">
      <div className="code-header">
        <span className="code-language">{language}</span>
      </div>
      <div className="code-body">
        <pre>
          <code>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = lineNum === highlightLine;
              return (
                <div
                  key={idx}
                  className={`code-line ${isActive ? 'code-line-active' : ''}`}
                >
                  <span className="line-number">{lineNum}</span>
                  <span className="line-content">{line || ' '}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
