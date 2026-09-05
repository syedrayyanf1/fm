import React, { useState, useEffect } from 'react';
import { X, Check, Sliders, Shield, Zap, Target, Gauge } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { TacticalSetup, Archetype } from '../../types/game';

const FORMATIONS: Array<TacticalSetup['formation']> = [
  '4-3-3', '4-2-3-1', '3-5-2', '4-4-2', '5-3-2'
];

const ARCHETYPES: Array<{
  key: Archetype;
  name: string;
  desc: string;
}> = [
  {
    key: 'GEGENPRESS',
    name: 'Gegenpress',
    desc: 'High-tempo, suffocating pressure, creates turnovers, drains stamina.',
  },
  {
    key: 'TIKI_TAKA',
    name: 'Tiki-Taka',
    desc: 'Patient possession, high passing volume, low counter risk, requires high CRE/MEN.',
  },
  {
    key: 'DIRECT_COUNTER',
    name: 'Direct Counter',
    desc: 'Deep defensive block, explosive transitions, ideal for fast wingers.',
  },
  {
    key: 'LOW_BLOCK',
    name: 'Low Block',
    desc: 'Ultra-resilient defensive fortress, minimal attacking output.',
  },
];

export default function TacticsModal() {
  const isTacticsModalOpen = useGameStore(state => state.isTacticsModalOpen);
  const setIsTacticsModalOpen = useGameStore(state => state.setIsTacticsModalOpen);
  const club = useGameStore(state => state.clubs[state.userClubId]);
  const updateTactics = useGameStore(state => state.updateTactics);
  const showToast = useGameStore(state => state.showToast);

  const defaultTactics: TacticalSetup = {
    formation: '4-3-3',
    archetype: 'TIKI_TAKA',
    defensiveLine: 'BALANCED',
    pressingIntensity: 'BALANCED',
    buildUpSpeed: 'BALANCED',
    pitchWidth: 'BALANCED',
    roleToggles: {
      invertedFullbacks: false,
      poacherFocus: false,
      sweeperKeeper: true,
    },
  };

  const [tactics, setTactics] = useState<TacticalSetup>(club?.tactics || defaultTactics);

  useEffect(() => {
    if (club?.tactics) {
      setTactics(club.tactics);
    }
  }, [club?.tactics, isTacticsModalOpen]);

  if (!isTacticsModalOpen) return null;

  // Real-time sector preview calculation
  const calculateSectors = () => {
    let midfield = 84;
    let attacking = 83;
    let defensive = 80;

    // Archetype impact
    if (tactics.archetype === 'TIKI_TAKA') {
      midfield += 4;
      attacking += 1;
    } else if (tactics.archetype === 'GEGENPRESS') {
      midfield += 2;
      attacking += 3;
      defensive -= 1;
    } else if (tactics.archetype === 'DIRECT_COUNTER') {
      midfield -= 2;
      attacking += 3;
      defensive += 2;
    } else if (tactics.archetype === 'LOW_BLOCK') {
      midfield -= 3;
      attacking -= 3;
      defensive += 5;
    }

    // Defensive Line
    if (tactics.defensiveLine === 'HIGH') {
      midfield += 3;
      defensive -= 2;
    } else if (tactics.defensiveLine === 'DEEP') {
      defensive += 3;
      midfield -= 2;
    }

    // Pressing Intensity
    if (tactics.pressingIntensity === 'RELENTLESS') {
      attacking += 2;
      midfield += 2;
    } else if (tactics.pressingIntensity === 'CONSERVATIVE') {
      defensive += 2;
      attacking -= 2;
    }

    // Build-Up Speed
    if (tactics.buildUpSpeed === 'DIRECT_FAST') {
      attacking += 2;
      midfield -= 1;
    } else if (tactics.buildUpSpeed === 'SLOW_PATIENT') {
      midfield += 2;
    }

    // Pitch Width
    if (tactics.pitchWidth === 'WIDE') {
      attacking += 2;
      defensive -= 1;
    } else if (tactics.pitchWidth === 'NARROW') {
      midfield += 2;
      defensive += 1;
    }

    // Role Toggles
    if (tactics.roleToggles.invertedFullbacks) {
      midfield += 3;
      defensive -= 1;
    }
    if (tactics.roleToggles.poacherFocus) {
      attacking += 3;
      midfield -= 1;
    }
    if (tactics.roleToggles.sweeperKeeper) {
      defensive += 3;
    }

    return {
      midfield: Math.min(99, Math.max(60, midfield)),
      attacking: Math.min(99, Math.max(60, attacking)),
      defensive: Math.min(99, Math.max(60, defensive)),
    };
  };

  const sectors = calculateSectors();

  const handleSave = () => {
    updateTactics(tactics);
    setIsTacticsModalOpen(false);
    showToast('Tactical System Saved', `${tactics.formation} ${tactics.archetype.replace('_', ' ')} applied to squad.`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-zinc-950 border border-zinc-800/90 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        role="dialog"
        aria-label="Tactical System Blueprint"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                Tactical System Blueprint
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Configure Macro Knobs, Inverted Roles & Transition Archetypes
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTacticsModalOpen(false)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. Formation Selector */}
          <section className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
              Primary Formation
            </label>
            <div className="grid grid-cols-5 gap-2">
              {FORMATIONS.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setTactics({ ...tactics, formation: fmt })}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-medium border transition-all duration-150 ${
                    tactics.formation === fmt
                      ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                      : 'bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </section>

          {/* 2. Base Tactical Archetype */}
          <section className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
              Base Tactical Archetype
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ARCHETYPES.map(arch => {
                const isSelected = tactics.archetype === arch.key;
                return (
                  <button
                    key={arch.key}
                    onClick={() => setTactics({ ...tactics, archetype: arch.key })}
                    className={`p-3 rounded-lg text-left border transition-all duration-150 ${
                      isSelected
                        ? 'bg-zinc-900 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-semibold ${
                        isSelected ? 'text-emerald-400' : 'text-zinc-200'
                      }`}>
                        {arch.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {arch.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. The 4 Macro Knobs */}
          <section className="space-y-4">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
              Macro Tactical Knobs
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Knob 1: Defensive Line */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-medium">Defensive Line</span>
                  <span className="text-emerald-400">{tactics.defensiveLine}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800/60 text-xs font-mono">
                  {(['DEEP', 'BALANCED', 'HIGH'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTactics({ ...tactics, defensiveLine: opt })}
                      className={`py-1.5 rounded transition-all text-center ${
                        tactics.defensiveLine === opt
                          ? 'bg-zinc-800 text-white font-medium shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt === 'HIGH' ? 'High Line' : opt.charAt(0) + opt.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 italic">
                  High Line boosts midfield presence by +10%, but opponent breakaway xG increases.
                </p>
              </div>

              {/* Knob 2: Pressing Intensity */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-medium">Pressing Intensity</span>
                  <span className="text-emerald-400">{tactics.pressingIntensity}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800/60 text-xs font-mono">
                  {(['CONSERVATIVE', 'BALANCED', 'RELENTLESS'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTactics({ ...tactics, pressingIntensity: opt })}
                      className={`py-1.5 rounded transition-all text-center ${
                        tactics.pressingIntensity === opt
                          ? 'bg-zinc-800 text-white font-medium shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt === 'CONSERVATIVE' ? 'Conservative' : opt === 'RELENTLESS' ? 'Relentless' : 'Balanced'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 italic">
                  Relentless increases opponent turnovers in their third, but accelerates squad stamina drain by 1.4x.
                </p>
              </div>

              {/* Knob 3: Build-Up Speed */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-medium">Build-Up Speed</span>
                  <span className="text-emerald-400">
                    {tactics.buildUpSpeed === 'SLOW_PATIENT' ? 'Slow & Patient' : tactics.buildUpSpeed === 'DIRECT_FAST' ? 'Direct & Fast' : 'Balanced'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800/60 text-xs font-mono">
                  {(['SLOW_PATIENT', 'BALANCED', 'DIRECT_FAST'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTactics({ ...tactics, buildUpSpeed: opt })}
                      className={`py-1.5 rounded transition-all text-center ${
                        tactics.buildUpSpeed === opt
                          ? 'bg-zinc-800 text-white font-medium shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt === 'SLOW_PATIENT' ? 'Slow/Patient' : opt === 'DIRECT_FAST' ? 'Direct/Fast' : 'Balanced'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 italic">
                  Direct & Fast accelerates counter-attacks, but increases misplaced pass percentage.
                </p>
              </div>

              {/* Knob 4: Pitch Width */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-medium">Pitch Width</span>
                  <span className="text-emerald-400">
                    {tactics.pitchWidth === 'WIDE' ? 'Wide Flanks' : tactics.pitchWidth === 'NARROW' ? 'Narrow' : 'Balanced'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-800/60 text-xs font-mono">
                  {(['NARROW', 'BALANCED', 'WIDE'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTactics({ ...tactics, pitchWidth: opt })}
                      className={`py-1.5 rounded transition-all text-center ${
                        tactics.pitchWidth === opt
                          ? 'bg-zinc-800 text-white font-medium shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt === 'WIDE' ? 'Wide Flanks' : opt.charAt(0) + opt.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 italic">
                  Wide Flanks stretches opposition fullbacks; Narrow overloads central half-spaces.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Special Role Toggles */}
          <section className="space-y-2.5">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
              Special Tactical Instructions
            </label>

            <div className="space-y-2">
              {/* Inverted Fullbacks */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900/60 transition-colors">
                <input
                  type="checkbox"
                  checked={tactics.roleToggles.invertedFullbacks}
                  onChange={(e) => setTactics({
                    ...tactics,
                    roleToggles: { ...tactics.roleToggles, invertedFullbacks: e.target.checked }
                  })}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
                />
                <div>
                  <div className="text-xs font-mono font-medium text-zinc-200">
                    Inverted Fullbacks
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Fullbacks tuck into central midfield during possession phase (+15% Midfield Strength, -15% Flank Defense).
                  </p>
                </div>
              </label>

              {/* Poacher Focus */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900/60 transition-colors">
                <input
                  type="checkbox"
                  checked={tactics.roleToggles.poacherFocus}
                  onChange={(e) => setTactics({
                    ...tactics,
                    roleToggles: { ...tactics.roleToggles, poacherFocus: e.target.checked }
                  })}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
                />
                <div>
                  <div className="text-xs font-mono font-medium text-zinc-200">
                    Poacher Focus
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Striker foregoes build-up play to focus purely on box xG conversion.
                  </p>
                </div>
              </label>

              {/* Sweeper Keeper */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900/60 transition-colors">
                <input
                  type="checkbox"
                  checked={tactics.roleToggles.sweeperKeeper}
                  onChange={(e) => setTactics({
                    ...tactics,
                    roleToggles: { ...tactics.roleToggles, sweeperKeeper: e.target.checked }
                  })}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
                />
                <div>
                  <div className="text-xs font-mono font-medium text-zinc-200">
                    Sweeper Keeper
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Goalkeeper rushes out to clear through-balls, mitigating High Line counter risks.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* 5. Live Sector Output Preview */}
          <section className="p-4 rounded-lg bg-zinc-900/50 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/60 font-mono">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                Live Sector Output Preview
              </span>
              <span className="text-zinc-500 text-[11px]">Real-time Simulation Weights</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center font-mono">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block uppercase">Midfield Control</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  {sectors.midfield}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  {sectors.midfield >= 88 ? 'Dominant' : sectors.midfield >= 82 ? 'Controlled' : 'Contested'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block uppercase">Attacking Threat</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  {sectors.attacking}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  {sectors.attacking >= 87 ? 'Lethal' : sectors.attacking >= 82 ? 'High' : 'Balanced'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block uppercase">Defensive Stability</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  {sectors.defensive}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  {sectors.defensive >= 84 ? 'Fortress' : sectors.defensive >= 80 ? 'Solid' : 'Exposed'}
                </span>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsTacticsModalOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-mono font-semibold transition-all shadow-md shadow-emerald-500/20"
          >
            Save Tactical System
          </button>
        </div>
      </div>
    </div>
  );
}
