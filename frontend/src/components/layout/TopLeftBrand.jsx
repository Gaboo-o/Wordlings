import { Link } from 'react-router-dom';

/*
  TopLeftBrand
  Small, reusable brand mark placed in the top-left corner.

  Notes:
  - Default rendering is a logo mark only (to avoid repeating the title on the Home hero).
  - `showText` can be enabled on pages that need a wordmark.
*/
export default function TopLeftBrand({ text = 'Wordlings', to = '/', showText = false }) {
  return (
    <Link className="top-left-brand" to={to} aria-label={text} title={text}>
      <span className="brand-mark" aria-hidden="true" />
      {showText ? <span className="brand-text">{text}</span> : <span className="sr-only">{text}</span>}
    </Link>
  );
}