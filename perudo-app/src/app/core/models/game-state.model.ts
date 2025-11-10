import { Player } from './player.model';
import { Bid } from './bid.model';
import { DudoResult } from './dudo-result.model';

/**
 * Phase actuelle du jeu
 */
export enum GamePhase {
  /** Configuration initiale du jeu */
  SETUP = 'SETUP',

  /** Les joueurs lancent leurs dés */
  ROLLING = 'ROLLING',

  /** Phase d'enchères */
  BIDDING = 'BIDDING',

  /** Un joueur a dit "Dudo" - révélation des dés */
  DUDO_CHALLENGE = 'DUDO_CHALLENGE',

  /** Fin de manche - affichage des résultats */
  ROUND_END = 'ROUND_END',

  /** Jeu terminé - un joueur a gagné */
  GAME_OVER = 'GAME_OVER'
}

/**
 * Configuration du jeu
 */
export interface GameConfig {
  /** Nombre minimum de joueurs */
  minPlayers: number;

  /** Nombre maximum de joueurs */
  maxPlayers: number;

  /** Nombre de dés de départ par joueur */
  startingDicePerPlayer: number;

  /** Activer le mode Palifico */
  enablePalifico: boolean;
}

/**
 * État complet du jeu Perudo
 */
export interface GameState {
  /** Identifiant unique de la partie */
  id: string;

  /** Phase actuelle du jeu */
  phase: GamePhase;

  /** Liste de tous les joueurs */
  players: Player[];

  /** Index du joueur actuel dans le tableau players */
  currentPlayerIndex: number;

  /** Enchère actuelle (null si première enchère de la manche) */
  currentBid: Bid | null;

  /** Historique de toutes les enchères de la manche */
  bidHistory: Bid[];

  /** Numéro de la manche actuelle */
  roundNumber: number;

  /** Indique si la manche actuelle est en mode Palifico */
  isPalifico: boolean;

  /** Résultat du dernier Dudo (pour affichage) */
  lastDudoResult?: DudoResult;

  /** Configuration du jeu */
  config: GameConfig;
}

/**
 * Configuration par défaut du jeu
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  minPlayers: 2,
  maxPlayers: 6,
  startingDicePerPlayer: 5,
  enablePalifico: true
};

/**
 * Crée un nouvel état de jeu initial
 */
export function createInitialGameState(players: Player[]): GameState {
  return {
    id: `game-${Date.now()}`,
    phase: GamePhase.ROLLING,
    players,
    currentPlayerIndex: 0,
    currentBid: null,
    bidHistory: [],
    roundNumber: 1,
    isPalifico: false,
    config: DEFAULT_GAME_CONFIG
  };
}
