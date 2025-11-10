import { DieValue } from './die.model';

/**
 * Représente une enchère dans le jeu Perudo
 */
export interface Bid {
  /** ID du joueur qui a fait l'enchère */
  playerId: string;

  /** Quantité de dés annoncée */
  quantity: number;

  /** Valeur du dé annoncée (1-6) */
  value: DieValue;

  /** Horodatage de l'enchère */
  timestamp: Date;
}

/**
 * Résultat de la validation d'une enchère
 */
export interface BidValidation {
  /** Indique si l'enchère est valide */
  isValid: boolean;

  /** Message d'erreur si l'enchère est invalide */
  reason?: string;
}

/**
 * Crée une nouvelle enchère
 */
export function createBid(
  playerId: string,
  quantity: number,
  value: DieValue
): Bid {
  return {
    playerId,
    quantity,
    value,
    timestamp: new Date()
  };
}

/**
 * Vérifie si une enchère porte sur des "as" (1)
 */
export function isAsBid(bid: Bid): boolean {
  return bid.value === 1;
}

/**
 * Convertit une enchère normale en enchère sur les "as"
 * Règle : diviser la quantité par 2 (arrondi supérieur)
 */
export function convertToAsBid(quantity: number): number {
  return Math.ceil(quantity / 2);
}

/**
 * Convertit une enchère sur les "as" en enchère normale
 * Règle : multiplier par 2 et ajouter 1
 */
export function convertFromAsBid(quantity: number): number {
  return quantity * 2 + 1;
}
