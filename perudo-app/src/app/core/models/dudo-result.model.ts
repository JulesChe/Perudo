import { Bid } from './bid.model';
import { Die } from './die.model';

/**
 * Représente le résultat d'un challenge "Dudo"
 */
export interface DudoResult {
  /** ID du joueur qui a dit "Dudo" */
  challengerId: string;

  /** ID du joueur dont l'enchère a été contestée */
  challengedPlayerId: string;

  /** L'enchère qui a été contestée */
  challengedBid: Bid;

  /** Nombre réel de dés correspondant à l'enchère */
  actualCount: number;

  /** Indique si le challenge était correct (le challenger gagne) */
  wasCorrect: boolean;

  /** Indique si c'est un Calza (exactement le bon nombre) */
  isCalza: boolean;

  /** ID du joueur qui perd un dé (vide si Calza) */
  loserPlayerId: string | null;

  /** ID du joueur qui gagne un dé (uniquement si Calza) */
  winnerPlayerId: string | null;

  /** Nombre de dés perdus/gagnés (normalement 1) */
  diceChanged: number;

  /** Tous les dés révélés pour affichage */
  allDice: Die[];
}

/**
 * Crée un résultat de Dudo (challenge normal)
 */
export function createDudoResult(
  challengerId: string,
  challengedBid: Bid,
  actualCount: number,
  allDice: Die[]
): DudoResult {
  // Dudo : on parie que l'enchère est fausse (trop élevée)
  // Si l'enchère est fausse (actualCount < quantity), le challenger gagne
  const wasCorrect = actualCount < challengedBid.quantity;

  // Le perdant est celui qui a fait l'enchère si elle est fausse, sinon le challenger
  const loserPlayerId = wasCorrect ? challengedBid.playerId : challengerId;

  return {
    challengerId,
    challengedPlayerId: challengedBid.playerId,
    challengedBid,
    actualCount,
    wasCorrect,
    isCalza: false,
    loserPlayerId,
    winnerPlayerId: null,
    diceChanged: 1,
    allDice
  };
}

/**
 * Crée un résultat de Calza
 */
export function createCalzaResult(
  challengerId: string,
  challengedBid: Bid,
  actualCount: number,
  allDice: Die[]
): DudoResult {
  // Calza : on parie que l'enchère est exactement correcte
  const isExact = actualCount === challengedBid.quantity;

  let loserPlayerId: string | null = null;
  let winnerPlayerId: string | null = null;

  if (isExact) {
    // Calza réussi : le joueur qui a fait l'enchère gagne un dé
    winnerPlayerId = challengedBid.playerId;
  } else {
    // Calza raté : le challenger perd un dé
    loserPlayerId = challengerId;
  }

  return {
    challengerId,
    challengedPlayerId: challengedBid.playerId,
    challengedBid,
    actualCount,
    wasCorrect: isExact,
    isCalza: true,
    loserPlayerId,
    winnerPlayerId,
    diceChanged: 1,
    allDice
  };
}
