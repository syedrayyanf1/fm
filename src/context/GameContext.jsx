import React, { createContext, useContext } from 'react';
import { useGameStore } from '../store/useGameStore';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  return <>{children}</>;
}

export const useGame = () => useGameStore();

export default GameContext;
