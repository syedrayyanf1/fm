import React, { useState } from 'react';
import { Player, Club } from '../../types/game';
import SafePlayerPhoto from '../common/SafePlayerPhoto';
import { DollarSign, Check, X, Shield, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';

export interface IncomingTransferOffer {
  id: string;
  playerId: string;
  playerName: string;
  buyingClubId: string;
  buyingClubName: string;
  feeOffered: number;
  date: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  counterFee?: number;
}

interface IncomingOffersPanelProps {
  offers: IncomingTransferOffer[];
  players: Record<string, Player>;
  clubs: Record<string, Club>;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onCounter: (offerId: string, counterFee: number) => void;
}

export default function IncomingOffersPanel({
  offers,
  players,
  clubs,
  onAccept,
  onReject,
  onCounter,
}: IncomingOffersPanelProps) {
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState<number>(50);

  const pendingOffers = offers.filter(o => o.status === 'PENDING' || o.status === 'COUNTERED');

  const startCounter = (offer: IncomingTransferOffer) => {
    setCounteringOfferId(offer.id);
    setCounterAmount(Math.round((offer.feeOffered * 1.25) / 1e6));
  };

  const submitCounter = (offerId: string) => {
    onCounter(offerId, counterAmount * 1_000_000);
    setCounteringOfferId(null);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-sans">
            Incoming Transfer Bids
          </h3>
          <p className="text-zinc-400 text-xs">
            Review official bids received from rival clubs for your squad members.
          </p>
        </div>
        <div className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
          <span className="text-amber-400 font-bold tabular-nums">{pendingOffers.length}</span> Active Bids
        </div>
      </div>

      {pendingOffers.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 border border-zinc-800">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="text-zinc-300 font-semibold text-sm">No Pending Offers</div>
          <p className="text-zinc-500 max-w-sm mx-auto text-xs">
            Transfer list players from your squad or use the "Offer to Clubs" action in the Market Search to attract bids.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {pendingOffers.map(offer => {
            const player = players[offer.playerId];
            const buyingClub = clubs[offer.buyingClubId];
            const feeM = (offer.feeOffered / 1e6).toFixed(1);
            const valM = player ? (player.marketValue / 1e6).toFixed(1) : '—';
            const isCountering = counteringOfferId === offer.id;

            return (
              <div
                key={offer.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 shadow-lg hover:border-zinc-700/80 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Player & Buyer Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {player && (
                      <SafePlayerPhoto
                        photoUrl={player.photoUrl}
                        name={player.name}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-700/80 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm truncate font-sans">
                          {offer.playerName}
                        </span>
                        {player && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {player.primaryPosition} • {player.age}y
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-400 flex items-center gap-1.5 text-xs">
                        <span>Bid from:</span>
                        <span className="text-amber-400 font-semibold">
                          {offer.buyingClubName}
                        </span>
                        {buyingClub && (
                          <span className="text-zinc-500 text-[10px]">
                            (Rep {buyingClub.reputation})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div className="flex items-center gap-4 bg-zinc-900/80 px-3.5 py-2 rounded-lg border border-zinc-800/60 self-stretch sm:self-auto justify-between sm:justify-end">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">OFFERED</span>
                      <span className="text-emerald-400 font-bold text-sm tabular-nums">
                        €{feeM}M
                      </span>
                    </div>
                    <div className="h-6 w-px bg-zinc-800" />
                    <div>
                      <span className="text-zinc-500 text-[10px] block">EST. VALUE</span>
                      <span className="text-zinc-300 font-semibold tabular-nums">
                        €{valM}M
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counter Input Drawer if active */}
                {isCountering && (
                  <div className="p-3 bg-zinc-900/90 rounded-lg border border-amber-500/40 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="font-semibold text-amber-400">Demand Counter Fee:</span>
                      <span className="font-bold text-emerald-400 tabular-nums text-sm">
                        €{counterAmount}M
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={Math.max(5, Math.round(offer.feeOffered / 1e6))}
                        max={Math.round((offer.feeOffered * 2.5) / 1e6)}
                        value={counterAmount}
                        onChange={e => setCounterAmount(Number(e.target.value))}
                        className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                      <button
                        onClick={() => submitCounter(offer.id)}
                        className="px-3 py-1 bg-amber-500 text-zinc-950 rounded font-bold hover:bg-amber-400 transition text-xs"
                      >
                        Send Counter
                      </button>
                      <button
                        onClick={() => setCounteringOfferId(null)}
                        className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded hover:text-zinc-200 transition text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!isCountering && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900 gap-2">
                    <div className="text-zinc-500 text-[10px]">
                      Received on: {offer.date}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAccept(offer.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Offer</span>
                      </button>
                      <button
                        onClick={() => startCounter(offer)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold border border-zinc-700/60 transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Counter</span>
                      </button>
                      <button
                        onClick={() => onReject(offer.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 border border-zinc-800 transition flex items-center gap-1"
                        title="Reject Bid"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
