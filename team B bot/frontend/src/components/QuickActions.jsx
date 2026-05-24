import { AlertCircle, Phone, MapPin, Calendar } from 'lucide-react';

const quickActions = [
  { icon: AlertCircle, label: 'Emergency', query: '🚨 What do I do in an emergency?', color: '#ef4444' },
  { icon: Phone, label: 'Contacts', query: 'Show me important contact numbers', color: '#3098cc' },
  { icon: MapPin, label: 'Locations', query: 'Where are the key campus locations?', color: '#008FA4' },
  { icon: Calendar, label: 'Schedule', query: 'What\'s the daily schedule?', color: '#feb74f' },
];

export default function QuickActions({ onAction }) {
  return (
    <div className="px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-gray-200 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onAction(action.query)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-ssb text-white text-sm font-semibold hover:opacity-90 hover:scale-105 transition-all duration-200 whitespace-nowrap shadow-sm"
            style={{ backgroundColor: action.color }}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
