export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="admin-brand" aria-label="Gamerie operations">
      <img className="admin-brand__mark" src="/gamerie-logo.svg" alt="" aria-hidden="true" />
      {!compact && (
        <span className="admin-brand__copy">
          <strong>Gamerie</strong>
          <small>Operations</small>
        </span>
      )}
    </span>
  );
}
