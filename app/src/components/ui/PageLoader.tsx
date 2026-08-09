export function PageLoader({ label = "Loading Gamerie" }: { label?: string }) {
  return (
    <div className="g-page-loader" role="status" aria-live="polite">
      <span className="g-page-loader__orbit" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
