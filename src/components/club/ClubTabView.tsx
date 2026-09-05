import React from 'react';
import { 
  Building2, 
  Dumbbell, 
  HeartPulse, 
  GraduationCap, 
  ShoppingBag,
  Landmark,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import BoardObjectivesCard from './BoardObjectivesCard';
import FfpMonitorCard from './FfpMonitorCard';
import EconomicLeverModal from './EconomicLeverModal';
import FacilityCard from './FacilityCard';

export default function ClubTabView() {
  const club = useGameStore(state => state.clubs[state.userClubId]);

  if (!club) return null;

  const facilities = club.facilities || {
    stadiumCapacity: 99354,
    stadiumExecutiveBoxes: 80,
    stadiumAtmosphereLevel: 4,
    commercialMegastoreLevel: 3,
    trainingGroundLevel: 4,
    medicalCenterLevel: 3,
    youthAcademyLevel: 5,
  };

  const treasuryBalance = (club.finances.balance / 1e6).toFixed(1);
  const transferBudget = (club.finances.transferBudget / 1e6).toFixed(1);
  const weeklyWage = (club.finances.wageBudgetWeekly / 1e3).toFixed(0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. View Title & Executive Treasury Snapshot */}
      <div className="hairline-card p-4 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Executive Dashboard</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-emerald-400">Institutional Governance</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight mt-0.5">
            Club Infrastructure & Financial Governance
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="p-2 px-3 rounded-md bg-zinc-950/80 border border-white/[0.06] flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-zinc-400" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Treasury</span>
              <span className="font-semibold text-emerald-400 tabular-nums">${treasuryBalance}M</span>
            </div>
          </div>

          <div className="p-2 px-3 rounded-md bg-zinc-950/80 border border-white/[0.06] flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Transfer Kitty</span>
              <span className="font-semibold text-zinc-200 tabular-nums">${transferBudget}M</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Row: Executive Snapshot & Board Trust */}
      <section>
        <BoardObjectivesCard />
      </section>

      {/* 3. Middle Section: Financial Fair Play & Laporta Levers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FfpMonitorCard />
        <EconomicLeverModal />
      </section>

      {/* 4. Bottom Section: Modular Infrastructure & Facilities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-zinc-100 tracking-tight">
              Institutional Infrastructure & Facilities
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Level 1–5 capital upgrades permanently elevate squad development, matchday revenue, and fitness resilience.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            5 Active Facilities
          </span>
        </div>

        {/* 5-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* 1. Stadium & VIP Hospitality */}
          <FacilityCard
            name="Stadium & VIP Hospitality"
            facilityKey="stadiumAtmosphereLevel"
            level={facilities.stadiumAtmosphereLevel || 4}
            stats={[
              `Capacity: ${(facilities.stadiumCapacity || 99354).toLocaleString()}`,
              `VIP: ${facilities.stadiumExecutiveBoxes || 80} Suites`,
              '+6% Home Adv.',
            ]}
            perk="Generates $1.8M per home match; maximizes intimidation factor against visiting opponents."
            upgradeActionLabel="Expand VIP Capacity"
            icon={Building2}
          />

          {/* 2. Training Ground & Tactical Analytics */}
          <FacilityCard
            name="Training Ground & Tactical Analytics"
            facilityKey="trainingGroundLevel"
            level={facilities.trainingGroundLevel || 4}
            stats={[
              'Level 4/5',
              'AI Tactical Suite',
              '+40% Retrain Speed',
            ]}
            perk="Positional retraining speed +40%; tactical familiarity accelerates 2x across all formations."
            upgradeActionLabel="Upgrade to Elite Hub"
            icon={Dumbbell}
          />

          {/* 3. Medical & Sports Science Center */}
          <FacilityCard
            name="Medical & Sports Science Center"
            facilityKey="medicalCenterLevel"
            level={facilities.medicalCenterLevel || 3}
            stats={[
              'Level 3/5',
              'Cryo Recovery Hub',
              '-25% Soft Tissue Inj.',
            ]}
            perk="Soft-tissue injuries cut by 25%; player fatigue decay buffered after double-match weeks."
            upgradeActionLabel="Upgrade Medical Hub"
            icon={HeartPulse}
          />

          {/* 4. Youth Academy (La Masia / Elite Center) */}
          <FacilityCard
            name="Youth Academy (La Masia)"
            facilityKey="youthAcademyLevel"
            level={facilities.youthAcademyLevel || 5}
            stats={[
              'Level 5/5',
              'World Class',
              '15% Wonderkid Roll',
            ]}
            perk="Guaranteed high-floor intake + 15% annual roll for a Generational Wonderkid on March 25th."
            upgradeActionLabel="Upgrade Academy"
            icon={GraduationCap}
          />

          {/* 5. Commercial Megastore & Merchandising */}
          <FacilityCard
            name="Commercial Megastore"
            facilityKey="commercialMegastoreLevel"
            level={facilities.commercialMegastoreLevel || 3}
            stats={[
              'Level 3/5',
              'Global Logistics',
              '$420k/wk Merch',
            ]}
            perk="Converts squad Popularity into $420,000/week global merchandise and kit licensing revenue."
            upgradeActionLabel="Expand Global Logistics"
            icon={ShoppingBag}
          />
        </div>
      </section>
    </div>
  );
}
