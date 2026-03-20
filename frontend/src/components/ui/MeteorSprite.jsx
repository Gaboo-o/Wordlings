import MeteorBody from "../../icons/MeteorBody";

export default function MeteorSprite({ className = '' }) {
  return (
    <span className={`orbit-menu__meteor-sprite ${className}`} aria-hidden="true">
      <MeteorBody className="orbit-menu__meteor-body" />
    </span>
  );
}
