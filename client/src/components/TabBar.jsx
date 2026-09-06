import { NavLink } from 'react-router-dom';
import { IconHome, IconCalendar, IconDumbbell, IconChart } from './Icons.jsx';
import './TabBar.css';

const TABS = [
  { to: '/', label: 'Home', Icon: IconHome, end: true },
  { to: '/schedule', label: 'Schedule', Icon: IconCalendar },
  { to: '/exercises', label: 'Exercises', Icon: IconDumbbell },
  { to: '/progress', label: 'Progress', Icon: IconChart },
];

export function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
