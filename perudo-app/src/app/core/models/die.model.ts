/**
 * Représente les valeurs possibles d'un dé (1-6)
 */
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Représente un dé individuel dans le jeu
 */
export interface Die {
  /** Identifiant unique du dé */
  id: string;

  /** Valeur actuelle du dé (1-6) */
  value: DieValue;

  /** Indique si le dé est visible pour le joueur actuel */
  isVisible: boolean;
}

/**
 * Crée un nouveau dé avec une valeur aléatoire
 */
export function createDie(id: string, value?: DieValue): Die {
  return {
    id,
    value: value ?? randomDieValue(),
    isVisible: false
  };
}

/**
 * Génère une valeur aléatoire de dé (1-6)
 */
export function randomDieValue(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue;
}

/**
 * Lance un dé et retourne une nouvelle instance avec une valeur aléatoire
 */
export function rollDie(die: Die): Die {
  return {
    ...die,
    value: randomDieValue()
  };
}
