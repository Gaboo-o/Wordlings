import { Link } from 'react-router-dom';

/*
  TopLeftBrand
  Small, reusable brand label placed in the top-left corner.
  Useful across pages to provide consistent navigation back to home.
*/
export default function TopLeftBrand({ text = 'Wordlings', to = '/' }) {
  return (
    <Link className="top-left-brand" to={to}>
      {text}
    </Link>
  );
}
