import { IconDumbbell, IconLightning, IconStamina, IconMobility, IconFootball } from './Icons.jsx';

const META = {
  strength: { Icon: IconDumbbell, cls: 'strength' },
  speed_agility: { Icon: IconLightning, cls: 'strength' },
  stamina: { Icon: IconStamina, cls: 'strength' },
  mobility: { Icon: IconMobility, cls: 'rest-i' },
  rest: { Icon: IconMobility, cls: 'rest-i' },
  football: { Icon: IconFootball, cls: 'match-i' },
};

export function dayTypeMeta(type) {
  return META[type] || META.strength;
}

export function DayTypeIcon({ type, size }) {
  const { Icon } = dayTypeMeta(type);
  return <Icon width={size} height={size} />;
}
