import React from 'react';
import { useGameStore } from './store/useGameStore';
import Header from './components/Header';
import Navbar from './components/Navbar';
import CalendarView from './views/CalendarView';
import SquadTacticsView from './views/SquadTacticsView';
import TransfersView from './views/TransfersView';
import ClubTabView from './components/club/ClubTabView';
import CompetitionsView from './views/CompetitionsView';
import MatchReportModal from './components/MatchReportModal';
import MatchModal from './components/match/MatchModal';
import SimulationProgressHUD from './components/calendar/SimulationProgressHUD';
import InterruptModal from './components/calendar/InterruptModal';
import JumpToDateModal from './components/calendar/JumpToDateModal';
import ApproachModal from './components/transfers/ApproachModal';
import TransferModal from './components/transfers/TransferModal';
import ScoutAssignmentModal from './components/transfers/ScoutAssignmentModal';
import MutinyAlertModal from './components/transfers/MutinyAlertModal';
import YouthIntakeModal from './components/season/YouthIntakeModal';
import AwardsGalaModal from './components/season/AwardsGalaModal';
import TrophyCabinetView from './components/season/TrophyCabinetView';
import SeasonSummaryModal from './components/season/SeasonSummaryModal';
import UnemployedDashboard from './components/season/UnemployedDashboard';
import Toast from './components/Toast';

export default function App() {
  const activeTab = useGameStore(state => state.activeTab);
  const isUnemployed = useGameStore(state => state.managerProfile?.isUnemployed);
  const loadDataPack = useGameStore(state => state.loadDataPack);

  // Hydrate master database on app startup
  React.useEffect(() => {
    fetch('/data/gameData.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && data.clubs && data.players) {
          loadDataPack(data);
        }
      })
      .catch(err => {
        // Fall back gracefully to built-in seed
        console.info('[DataPack] Using pre-bundled initial seed data.', err.message);
      });
  }, [loadDataPack]);

  if (isUnemployed) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
        <UnemployedDashboard />
        <TrophyCabinetView />
        <Toast />
      </div>
    );
  }

  const renderActiveView = () => {
    const tab = (activeTab || 'calendar').toLowerCase();
    switch (tab) {
      case 'calendar':
        return <CalendarView />;
      case 'squad':
        return <SquadTacticsView />;
      case 'transfers':
        return <TransfersView />;
      case 'club':
        return <ClubTabView />;
      case 'tables':
        return <CompetitionsView />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white pb-24 md:pb-10">
      {/* 1. Sleek Top Bar with Discreet Financial Ticker */}
      <Header />

      {/* 2. Sleek Segmented Tab Bar ([Calendar] [Squad] [Transfers] [Club] [Tables]) */}
      <Navbar />

      {/* 3. Main Obsidian Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {renderActiveView()}
      </main>

      {/* Discreet Quiet Footer */}
      <footer className="border-t border-white/[0.04] py-4 px-4 sm:px-6 text-center text-xs font-mono text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>FC Barcelona Management</span>
            <span>•</span>
            <span>LaLiga EA Sports</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Obsidian Surface v26.4</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500/80"></span>
            <span className="text-zinc-400">Tactical Precision & Linear Architecture</span>
          </div>
        </div>
      </footer>

      {/* Modals & Notifications */}
      <SimulationProgressHUD />
      <InterruptModal />
      <JumpToDateModal />
      <ApproachModal />
      <TransferModal />
      <ScoutAssignmentModal />
      <MutinyAlertModal />
      <MatchModal />
      <MatchReportModal />
      <YouthIntakeModal />
      <AwardsGalaModal />
      <TrophyCabinetView />
      <SeasonSummaryModal />
      <Toast />
    </div>
  );
}

