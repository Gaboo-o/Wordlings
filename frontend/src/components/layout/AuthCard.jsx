/*
  AuthCard
  Reusable centered card used for authentication pages (login/signup).
  Keeps auth pages visually consistent and reduces repeated styling.
*/
export default function AuthCard({ title, error, children, footer }) {
  return (
    <div className="app-card">
      {title && <h2>{title}</h2>}
      {error ? <div className="error-text">{error}</div> : null}
      {children}
      {footer ? <div className="card-footer">{footer}</div> : null}
    </div>
  );
}
