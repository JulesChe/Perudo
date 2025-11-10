import { Die, createDie } from './die.model';

/**
 * Représente un joueur dans le jeu Perudo
 */
export interface Player {
  /** Identifiant unique du joueur */
  id: string;

  /** Nom du joueur */
  name: string;

  /** Liste des dés du joueur */
  dice: Die[];

  /** Indique si le joueur est encore actif (non éliminé) */
  isActive: boolean;

  /** Indique si c'est le tour du joueur */
  isCurrentTurn: boolean;

  /** Position du joueur à la table (ordre de jeu) */
  position: number;

  /** URL optionnelle de l'avatar du joueur */
  avatar?: string;
}

/**
 * Crée un nouveau joueur avec un nombre spécifique de dés
 */
export function createPlayer(
  id: string,
  name: string,
  position: number,
  numberOfDice: number = 5
): Player {
  const dice: Die[] = [];
  for (let i = 0; i < numberOfDice; i++) {
    dice.push(createDie(`${id}-die-${i}`));
  }

  return {
    id,
    name,
    dice,
    isActive: true,
    isCurrentTurn: position === 0,
    position,
    avatar: undefined
  };
}

/**
 * Retire un dé au joueur (quand il perd un Dudo)
 */
export function removeDieFromPlayer(player: Player): Player {
  if (player.dice.length === 0) {
    return { ...player, isActive: false };
  }

  const newDice = player.dice.slice(0, -1);

  return {
    ...player,
    dice: newDice,
    isActive: newDice.length > 0
  };
}

/**
 * Ajoute un dé au joueur (quand il gagne un Calza)
 * Maximum 5 dés
 */
export function addDieToPlayer(player: Player, maxDice: number = 5): Player {
  if (player.dice.length >= maxDice) {
    return player;
  }

  const newDie = createDie(`${player.id}-die-${Date.now()}`);
  const newDice = [...player.dice, newDie];

  return {
    ...player,
    dice: newDice
  };
}

/**
 * Vérifie si le joueur est en mode Palifico (un seul dé)
 */
export function isPlayerInPalifico(player: Player): boolean {
  return player.isActive && player.dice.length === 1;
}
