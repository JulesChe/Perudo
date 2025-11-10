import { Injectable } from '@angular/core';
import { Die, DieValue, rollDie } from '../models/die.model';
import { Player } from '../models/player.model';

/**
 * Service pour gérer les opérations sur les dés
 */
@Injectable({
  providedIn: 'root'
})
export class DiceService {
  /**
   * Lance tous les dés d'un joueur
   */
  rollPlayerDice(player: Player): Player {
    const newDice = player.dice.map(die => rollDie(die));

    return {
      ...player,
      dice: newDice
    };
  }

  /**
   * Lance les dés de tous les joueurs actifs
   */
  rollAllDice(players: Player[]): Player[] {
    return players.map(player => {
      if (player.isActive) {
        return this.rollPlayerDice(player);
      }
      return player;
    });
  }

  /**
   * Compte le nombre de dés ayant une valeur spécifique parmi tous les joueurs
   * @param players Liste des joueurs
   * @param value Valeur à compter
   * @param countOnesAsWild Si true, les "as" (1) comptent comme jokers
   * @param isPalifico Si true, les règles Palifico s'appliquent (pas de jokers)
   */
  countDiceWithValue(
    players: Player[],
    value: DieValue,
    countOnesAsWild: boolean = true,
    isPalifico: boolean = false
  ): number {
    let count = 0;

    // En mode Palifico, les "as" ne sont pas jokers
    const shouldCountWild = countOnesAsWild && !isPalifico && value !== 1;

    for (const player of players) {
      if (!player.isActive) continue;

      for (const die of player.dice) {
        // Compte les dés avec la valeur exacte
        if (die.value === value) {
          count++;
        }
        // Compte les "as" comme jokers si applicable
        else if (shouldCountWild && die.value === 1) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Récupère tous les dés de tous les joueurs actifs
   */
  getAllDice(players: Player[]): Die[] {
    const allDice: Die[] = [];

    for (const player of players) {
      if (player.isActive) {
        allDice.push(...player.dice);
      }
    }

    return allDice;
  }

  /**
   * Calcule le nombre total de dés encore en jeu
   */
  getTotalDiceCount(players: Player[]): number {
    return players.reduce((total, player) => {
      if (player.isActive) {
        return total + player.dice.length;
      }
      return total;
    }, 0);
  }

  /**
   * Rend les dés d'un joueur visibles (pour affichage)
   */
  showPlayerDice(player: Player): Player {
    const visibleDice = player.dice.map(die => ({
      ...die,
      isVisible: true
    }));

    return {
      ...player,
      dice: visibleDice
    };
  }

  /**
   * Rend les dés d'un joueur invisibles
   */
  hidePlayerDice(player: Player): Player {
    const hiddenDice = player.dice.map(die => ({
      ...die,
      isVisible: false
    }));

    return {
      ...player,
      dice: hiddenDice
    };
  }
}
