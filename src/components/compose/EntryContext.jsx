export default function EntryContext({ entry }) {
  return (
    <div className="csp__ai-context">
      <span className="csp__ai-context-label">Creating for:</span>
      <strong>{entry.title || 'Untitled Entry'}</strong>
      <div className="csp__picker-meta">
        <span className="cc__type-tag">{entry.platform}</span>
        {entry.content_type && <span className="cc__type-tag">{entry.content_type}</span>}
      </div>
    </div>
  );
}
