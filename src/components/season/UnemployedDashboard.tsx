import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ShieldAlert, Briefcase, Building, DollarSign, Award, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { JobVacancy } from '../../types/season';

export default function UnemployedDashboard() {
  const managerProfile = useGameStore(state => state.managerProfile);
  const clubs = useGameStore(state => state.clubs);
  const competitions = useGameStore(state => state.competitions);
  const applyForJob = useGameStore(state => state.applyForJob);

  const [applicationResult, setApplicationResult] = useState<{
    clubId: string;
    status: 'OFFERED' | 'REJECTED';
    message: string;
  } | null>(null);

  // Scan clubs for available vacancies
  const vacancies: JobVacancy[] = React.useMemo(() => {
    return Object.values(clubs)
      .filter(c => c.boardTrust < 70 || c.reputation <= 85)
      .slice(0, 8)
      .map(c => {
        const comp = competitions[c.leagueId];
        return {
          clubId: c.id,
          clubName: c.name,
          leagueId: c.leagueId,
          leagueName: comp?.name || 'Top Flight',
          reputation: c.reputation,
          transferBudget: c.finances.transferBudget,
          wageBudgetWeekly: c.finances.wageBudgetWeekly,
          expectation: c.reputation >= 82 ? 'Qualify for European Football' : 'Mid-table Stability & Rebuild',
          requiredReputation: Math.max(40, c.reputation - 5),
        };
      });
  }, [clubs, competitions]);

  const handleApply = (vacancy: JobVacancy) => {
    const totalTrophies = managerProfile.trophies.length;
    // HireScore = ManagerReputation + (TotalTrophies * 3) - ClubReputation
    const hireScore = managerProfile.reputation + (totalTrophies * 3) - vacancy.reputation;

    if (hireScore >= -10) {
      setApplicationResult({
        clubId: vacancy.clubId,
        status: 'OFFERED',
        message: `Contract Offered! The board of ${vacancy.clubName} is convinced by your vision and silverware credentials.`,
      });
    } else {
      setApplicationResult({
        clubId: vacancy.clubId,
        status: 'REJECTED',
        message: `Application Rejected. The board of ${vacancy.clubName} seeks a manager with a higher profile (Shortfall: ${Math.abs(hireScore + 10)} pts).`,
      });
    }
  };

  const handleAcceptContract = (clubId: string) => {
    applyForJob(clubId);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start p-6 md:p-12">
      <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-300">
        {/* Executive Termination Banner */}
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-rose-200">
                Official Executive Notice: Contract Terminated
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                SACKED
              </span>
            </div>
            <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
              The Board of Directors has terminated your managerial tenure following an irrecoverable collapse in executive confidence. Your managerial reputation has taken a hit (-15 pts), and you are currently unattached.
            </p>
          </div>
        </div>

        {/* Manager Status Card */}
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono uppercase text-zinc-500 font-medium">Active Profile</div>
            <h1 className="text-xl font-bold text-zinc-100 mt-0.5">{managerProfile.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
              <span>
                Reputation: <span className="font-mono text-amber-400 font-semibold">{managerProfile.reputation}/100</span>
              </span>
              <span>•</span>
              <span>
                Career Record: <span className="font-mono text-zinc-200 font-semibold">{managerProfile.careerWins}W / {managerProfile.careerLosses}L</span>
              </span>
              <span>•</span>
              <span>
                Trophies: <span className="font-mono text-cyan-400 font-semibold">{managerProfile.trophies.length} Titles</span>
              </span>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-right">
            <div className="text-[10px] font-mono uppercase text-zinc-400">Status</div>
            <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">OPEN TO OFFERS</div>
          </div>
        </div>

        {/* Application Result Feedback Banner */}
        {applicationResult && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200 ${
              applicationResult.status === 'OFFERED'
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : 'bg-zinc-900/60 border-zinc-700 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3 text-xs">
              {applicationResult.status === 'OFFERED' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{applicationResult.message}</span>
            </div>
            {applicationResult.status === 'OFFERED' && (
              <button
                onClick={() => handleAcceptContract(applicationResult.clubId)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all shrink-0"
              >
                Sign Contract & Take Charge
              </button>
            )}
          </div>
        )}

        {/* Managerial Vacancy Board */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Managerial Vacancy Board • European Head Coach Openings
              </h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono">{vacancies.length} Clubs Hiring</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vacancies.map(v => {
              const hireScore = managerProfile.reputation + (managerProfile.trophies.length * 3) - v.reputation;
              const isEligible = hireScore >= -10;

              return (
                <div
                  key={v.clubId}
                  className="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-zinc-100 text-sm">{v.clubName}</h4>
                        <div className="text-xs text-zinc-400 mt-0.5">{v.leagueName}</div>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                        Rep: {v.reputation}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/60">
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Budget</span>
                        <span className="font-mono text-emerald-400 font-medium">
                          ${(v.transferBudget / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/60">
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Expectation</span>
                        <span className="text-zinc-300 truncate block font-medium">
                          {v.expectation}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-zinc-800/60">
                    <div className="text-[11px] font-mono text-zinc-500">
                      Match Rating:{' '}
                      <span className={isEligible ? 'text-emerald-400' : 'text-zinc-500'}>
                        {hireScore >= 0 ? `+${hireScore}` : `${hireScore}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleApply(v)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-colors flex items-center gap-1"
                    >
                      Submit Application
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
