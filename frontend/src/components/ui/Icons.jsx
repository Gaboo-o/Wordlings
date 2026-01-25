/*
  Icons
  Small inline SVG icons used by UI components.

  Notes:
  - Uses currentColor for stroke/fill so icons inherit from CSS.
  - Kept intentionally minimal to avoid external icon dependencies.
*/

function BaseIcon({ children, size = '1em', strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

/* PlusIcon
   Used for the Add action. */
export function PlusIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}

/* ListIcon
   Used for Submissions. */
export function ListIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M8 7h12" />
      <path d="M8 12h12" />
      <path d="M8 17h12" />
      <path d="M4 7h0" />
      <path d="M4 12h0" />
      <path d="M4 17h0" />
    </BaseIcon>
  );
}

/* ShieldIcon
   Used for Admin. */
export function ShieldIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
      <path d="M12 6v14" />
    </BaseIcon>
  );
}

/* LogoutIcon
   Used for Logout. */
export function LogoutIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h10" />
      <path d="M7 9l-3 3 3 3" />
    </BaseIcon>
  );
}