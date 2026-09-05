import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Calendar, Users, ArrowLeftRight, Landmark, Trophy } from 'lucide-react';


export default function Navbar() {
  const activeTab = useGameStore(state => state.activeTab);
  const setActiveTab = useGameStore(state => state.setActiveTab);

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'squad', label: 'Squad', icon: Users },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
    { id: 'club', label: 'Club', icon: Landmark },
    { id: 'tables', label: 'Tables', icon: Trophy },
  ];


  return (
    <>
      {/* DESKTOP SEGMENTED TAB BAR (md+) */}
      <div className="hidden md:block border-b border-white/[0.06] bg-zinc-950/60 backdrop-blur-sm sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="inline-flex p-1 bg-zinc-900/50 rounded-lg border border-white/[0.06] space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 cursor-pointer select-none outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border-white/[0.08]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
            <span>Tactical Precision Ready</span>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM DOCK (Mobile only) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
        <div className="bg-zinc-950/90 backdrop-blur-md border border-white/[0.08] p-1 rounded-xl shadow-2xl flex items-center justify-between">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-medium border transition-colors duration-150 outline-none focus:outline-none ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border-white/[0.08]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </>
  );
}

