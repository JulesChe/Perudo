import { Injectable } from '@angular/core';
import {
  GameState,
  GamePhase,
  createInitialGameState
} from '../models/game-state.model';
import { Player, removeDieFromPlayer, addDieToPlayer, isPlayerInPalifico, createPlayer } from '../models/player.model';
import { Bid, createBid, BidValidation } from '../models/bid.model';
import { DudoResult, createDudoResult, createCalzaResult } from '../models/dudo-result.model';
import { DieValue } from '../models/die.model';
import { DiceService } from './dice.service';
import { RuleValidatorService } from './rule-validator.service';

/**
 * Service principal pour la logique du jeu Perudo
 */
@Injectable({
  providedIn: 'root'
})
export class GameEngineService {
  constructor(
    private diceService: DiceService,
    private ruleValidator: RuleValidatorService
  ) {}

  /**
   * Démarre une nouvelle partie
   */
  startNewGame(playerNames: string[]): GameState {
    const players: Player[] = playerNames.map((name, index) =>
      createPlayer(
        `player-${index}`,
        name,
        index,
        5 // 5 dés de départ
      )
    );

    const initialState = createInitialGameState(players);
    return this.startNewRound(initialState);
  }

  /**
   * Démarre une nouvelle manche (lance les dés)
   */
  startNewRound(state: GameState): GameState {
    console.log('[StartNewRound] Joueurs AVANT rollAllDice:', state.players.map(p => ({ name: p.name, diceCount: p.dice.length })));

    // Lance les dés de tous les joueurs
    const playersWithRolledDice = this.diceService.rollAllDice(state.players);

    console.log('[StartNewRound] Joueurs APRÈS rollAllDice:', playersWithRolledDice.map(p => ({ name: p.name, diceCount: p.dice.length })));

    // Vérifie si un joueur est en mode Palifico
    const hasPalificoPlayer = state.config.enablePalifico &&
      playersWithRolledDice.some(p => isPlayerInPalifico(p));

    return {
      ...state,
      phase: GamePhase.BIDDING,
      players: playersWithRolledDice,
      currentBid: null,
      bidHistory: [],
      isPalifico: hasPalificoPlayer,
      lastDudoResult: undefined
    };
  }

  /**
   * Valide une enchère
   */
  validateBid(state: GameState, quantity: number, value: DieValue): BidValidation {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const newBid = createBid(currentPlayer.id, quantity, value);
    const totalDice = this.diceService.getTotalDiceCount(state.players);

    return this.ruleValidator.validateBid(
      newBid,
      state.currentBid,
      state.isPalifico,
      totalDice
    );
  }

  /**
   * Place une enchère
   */
  placeBid(state: GameState, quantity: number, value: DieValue): GameState {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const newBid = createBid(currentPlayer.id, quantity, value);

    // Validation
    const validation = this.validateBid(state, quantity, value);
    if (!validation.isValid) {
      throw new Error(validation.reason || 'Enchère invalide');
    }

    // Ajoute l'enchère à l'historique
    const newBidHistory = [...state.bidHistory, newBid];

    // Passe au joueur suivant
    const nextPlayerIndex = this.getNextPlayerIndex(state);

    return {
      ...state,
      currentBid: newBid,
      bidHistory: newBidHistory,
      currentPlayerIndex: nextPlayerIndex,
      players: this.updateCurrentTurn(state.players, nextPlayerIndex)
    };
  }

  /**
   * Appelle "Dudo" (challenge que l'enchère est fausse)
   */
  callDudo(state: GameState): GameState {
    if (!state.currentBid) {
      throw new Error('Impossible de dire "Dudo" sans enchère');
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    const challengedBid = state.currentBid;

    // Compte les dés correspondant à l'enchère
    const actualCount = this.diceService.countDiceWithValue(
      state.players,
      challengedBid.value,
      true, // Les "as" comptent comme jokers
      state.isPalifico // Sauf en mode Palifico
    );

    // Crée le résultat du Dudo (sans détection automatique de Calza)
    const allDice = this.diceService.getAllDice(state.players);
    const dudoResult = createDudoResult(
      currentPlayer.id,
      challengedBid,
      actualCount,
      allDice
    );

    // Met à jour les joueurs : le perdant perd un dé
    const updatedPlayers = state.players.map(player => {
      if (player.id === dudoResult.loserPlayerId) {
        return removeDieFromPlayer(player);
      }
      return player;
    });

    // Le prochain joueur est celui qui a perdu
    const nextPlayerIndex = updatedPlayers.findIndex(p => p.id === dudoResult.loserPlayerId);

    return {
      ...state,
      phase: GamePhase.DUDO_CHALLENGE,
      players: updatedPlayers,
      lastDudoResult: dudoResult,
      currentPlayerIndex: nextPlayerIndex
    };
  }

  /**
   * Appelle "Calza" (pari que l'enchère est exactement correcte)
   */
  callCalza(state: GameState): GameState {
    if (!state.currentBid) {
      throw new Error('Impossible de dire "Calza" sans enchère');
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    const challengedBid = state.currentBid;

    // Compte les dés correspondant à l'enchère
    const actualCount = this.diceService.countDiceWithValue(
      state.players,
      challengedBid.value,
      true, // Les "as" comptent comme jokers
      state.isPalifico // Sauf en mode Palifico
    );

    // Crée le résultat du Calza
    const allDice = this.diceService.getAllDice(state.players);
    const calzaResult = createCalzaResult(
      currentPlayer.id,
      challengedBid,
      actualCount,
      allDice
    );

    // Met à jour les joueurs selon le résultat
    console.log('[Calza] Résultat:', {
      isExact: calzaResult.wasCorrect,
      winnerPlayerId: calzaResult.winnerPlayerId,
      loserPlayerId: calzaResult.loserPlayerId,
      actualCount: calzaResult.actualCount,
      challengedQuantity: challengedBid.quantity
    });

    const updatedPlayers = state.players.map(player => {
      if (calzaResult.winnerPlayerId && player.id === calzaResult.winnerPlayerId) {
        // Calza réussi : le joueur qui a fait l'enchère gagne un dé (max 5)
        console.log('[Calza] Joueur gagne un dé:', player.name, 'Dés avant:', player.dice.length);
        const updatedPlayer = addDieToPlayer(player, state.config.startingDicePerPlayer);
        console.log('[Calza] Dés après:', updatedPlayer.dice.length);
        return updatedPlayer;
      } else if (calzaResult.loserPlayerId && player.id === calzaResult.loserPlayerId) {
        // Calza raté : le challenger perd un dé
        console.log('[Calza] Joueur perd un dé:', player.name, 'Dés avant:', player.dice.length);
        const updatedPlayer = removeDieFromPlayer(player);
        console.log('[Calza] Dés après:', updatedPlayer.dice.length);
        return updatedPlayer;
      }
      return player;
    });

    console.log('[Calza] Joueurs après mise à jour:', updatedPlayers.map(p => ({ name: p.name, diceCount: p.dice.length })));

    // Détermine le prochain joueur
    // Si Calza réussi : celui qui a gagné le dé commence
    // Si Calza raté : celui qui a perdu (le challenger) commence
    const nextPlayerId = calzaResult.winnerPlayerId || calzaResult.loserPlayerId;
    const nextPlayerIndex = updatedPlayers.findIndex(p => p.id === nextPlayerId);

    return {
      ...state,
      phase: GamePhase.DUDO_CHALLENGE,
      players: updatedPlayers,
      lastDudoResult: calzaResult,
      currentPlayerIndex: nextPlayerIndex
    };
  }

  /**
   * Termine la manche et vérifie les conditions de victoire
   */
  endRound(state: GameState): GameState {
    const activePlayers = state.players.filter(p => p.isActive);

    // Vérifie si un joueur a gagné
    if (activePlayers.length === 1) {
      return {
        ...state,
        phase: GamePhase.GAME_OVER
      };
    }

    // Continue le jeu
    return {
      ...state,
      phase: GamePhase.ROUND_END,
      roundNumber: state.roundNumber + 1
    };
  }

  /**
   * Récupère l'index du prochain joueur actif
   */
  private getNextPlayerIndex(state: GameState): number {
    let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

    // Saute les joueurs éliminés
    while (!state.players[nextIndex].isActive) {
      nextIndex = (nextIndex + 1) % state.players.length;
    }

    return nextIndex;
  }

  /**
   * Met à jour le flag isCurrentTurn des joueurs
   */
  private updateCurrentTurn(players: Player[], currentPlayerIndex: number): Player[] {
    return players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === currentPlayerIndex
    }));
  }

  /**
   * Récupère le joueur actuel
   */
  getCurrentPlayer(state: GameState): Player {
    return state.players[state.currentPlayerIndex];
  }

  /**
   * Récupère les joueurs actifs (non éliminés)
   */
  getActivePlayers(state: GameState): Player[] {
    return state.players.filter(p => p.isActive);
  }

  /**
   * Récupère le gagnant (s'il y en a un)
   */
  getWinner(state: GameState): Player | null {
    const activePlayers = this.getActivePlayers(state);
    return activePlayers.length === 1 ? activePlayers[0] : null;
  }
}
