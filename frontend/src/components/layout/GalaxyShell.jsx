import TopLeftBrand from './TopLeftBrand';

/*
  GalaxyShell
  Page wrapper that applies the shared galaxy background and consistent layering.

  Notes:
  - This component provides only the background and basic structure.
  - Pages opt into meteors by rendering MeteorField themselves.
*/
export default function GalaxyShell({
  children,
  variant = 'default',
  showBrand = true,
  brandText = 'Wordlings',
  brandTo = '/',
}) {
  const variantClass = variant === 'auth' ? 'galaxy-shell--auth' : '';

  return (
    <div className={`galaxy-shell ${variantClass}`.trim()}>
      {showBrand && <TopLeftBrand text={brandText} to={brandTo} />}
      <div className="galaxy-content">{children}</div>
    </div>
  );
}
