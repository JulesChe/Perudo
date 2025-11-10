import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameState, GamePhase } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { Bid } from '../models/bid.model';
import { DudoResult } from '../models/dudo-result.model';
import { DieValue } from '../models/die.model';
import { GameEngineService } from './game-engine.service';

/**
 * Service de gestion d'état du jeu utilisant RxJS
 */
@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  // État privé
  private gameState$ = new BehaviorSubject<GameState | null>(null);

  // Observables publics
  public readonly state$: Observable<GameState | null> = this.gameState$.asObservable();

  public readonly currentPlayer$: Observable<Player | null> = this.state$.pipe(
    map(state => state ? this.gameEngine.getCurrentPlayer(state) : null)
  );

  public readonly activePlayers$: Observable<Player[]> = this.state$.pipe(
    map(state => state ? this.gameEngine.getActivePlayers(state) : [])
  );

  public readonly currentBid$: Observable<Bid | null> = this.state$.pipe(
    map(state => state?.currentBid || null)
  );

  public readonly isPalifico$: Observable<boolean> = this.state$.pipe(
    map(state => state?.isPalifico || false)
  );

  public readonly phase$: Observable<GamePhase | null> = this.state$.pipe(
    map(state => state?.phase || null)
  );

  public readonly lastDudoResult$: Observable<DudoResult | null> = this.state$.pipe(
    map(state => state?.lastDudoResult || null)
  );

  constructor(private gameEngine: GameEngineService) {}

  /**
   * Récupère l'état actuel (synchrone)
   */
  getCurrentState(): GameState | null {
    return this.gameState$.value;
  }

  /**
   * Démarre une nouvelle partie
   */
  startGame(playerNames: string[]): void {
    const newState = this.gameEngine.startNewGame(playerNames);
    this.updateState(newState);
  }

  /**
   * Place une enchère
   */
  placeBid(quantity: number, value: DieValue): void {
    const currentState = this.getCurrentState();
    if (!currentState) {
      throw new Error('Aucune partie en cours');
    }

    if (currentState.phase !== GamePhase.BIDDING) {
      throw new Error('Impossible d\'enchérir dans cette phase');
    }

    const newState = this.gameEngine.placeBid(currentState, quantity, value);
    this.updateState(newState);
  }

  /**
   * Appelle "Dudo"
   */
  callDudo(): void {
    const currentState = this.getCurrentState();
    if (!currentState) {
      throw new Error('Aucune partie en cours');
    }

    if (currentState.phase !== GamePhase.BIDDING) {
      throw new Error('Impossible de dire "Dudo" dans cette phase');
    }

    const newState = this.gameEngine.callDudo(currentState);
    this.updateState(newState);
  }

  /**
   * Appelle "Calza"
   */
  callCalza(): void {
    const currentState = this.getCurrentState();
    if (!currentState) {
      throw new Error('Aucune partie en cours');
    }

    if (currentState.phase !== GamePhase.BIDDING) {
      throw new Error('Impossible de dire "Calza" dans cette phase');
    }

    const newState = this.gameEngine.callCalza(currentState);
    this.updateState(newState);
  }

  /**
   * Continue vers la prochaine manche après un Dudo
   */
  continueToNextRound(): void {
    const currentState = this.getCurrentState();
    if (!currentState) {
      throw new Error('Aucune partie en cours');
    }

    // Termine la manche actuelle
    const stateAfterRound = this.gameEngine.endRound(currentState);

    // Si le jeu n'est pas terminé, démarre une nouvelle manche
    if (stateAfterRound.phase !== GamePhase.GAME_OVER) {
      const newState = this.gameEngine.startNewRound(stateAfterRound);
      this.updateState(newState);
    } else {
      this.updateState(stateAfterRound);
    }
  }

  /**
   * Réinitialise le jeu
   */
  resetGame(): void {
    this.gameState$.next(null);
  }

  /**
   * Valide une enchère avant de la placer
   */
  validateBid(quantity: number, value: DieValue): { isValid: boolean; reason?: string } {
    const currentState = this.getCurrentState();
    if (!currentState) {
      return { isValid: false, reason: 'Aucune partie en cours' };
    }

    return this.gameEngine.validateBid(currentState, quantity, value);
  }

  /**
   * Récupère le gagnant (si la partie est terminée)
   */
  getWinner(): Player | null {
    const currentState = this.getCurrentState();
    if (!currentState || currentState.phase !== GamePhase.GAME_OVER) {
      return null;
    }

    return this.gameEngine.getWinner(currentState);
  }

  /**
   * Met à jour l'état et notifie les observateurs
   */
  private updateState(newState: GameState): void {
    this.gameState$.next(newState);
  }

  /**
   * Vérifie si une partie est en cours
   */
  isGameActive(): boolean {
    return this.getCurrentState() !== null;
  }

  /**
   * Récupère le nombre total de dés en jeu
   */
  getTotalDiceCount(): number {
    const state = this.getCurrentState();
    if (!state) return 0;

    return state.players.reduce((total, player) => {
      return player.isActive ? total + player.dice.length : total;
    }, 0);
  }
}
