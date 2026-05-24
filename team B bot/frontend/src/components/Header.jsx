import { Menu, HelpCircle } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-md">
      <div className="flex items-center gap-3">
        <img
          src="/ssb-logo.png"
          alt="Summer Springboard"
          className="h-12 w-12 object-contain"
        />
        <div>
          <h1 className="text-lg font-bold text-ssb-navy font-display">SSB Assistant</h1>
          <p className="text-xs text-ssb-slate font-semibold">Berkeley 2026</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200"
          title="Help"
        >
          <HelpCircle className="w-5 h-5 text-ssb-blue" />
        </button>
        <button
          className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200"
          title="Menu"
        >
          <Menu className="w-5 h-5 text-ssb-blue" />
        </button>
      </div>
    </header>
  );
}
