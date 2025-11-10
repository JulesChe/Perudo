import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GameStateService } from '../../../core/services/game-state.service';
import { GameState, GamePhase } from '../../../core/models/game-state.model';
import { Player } from '../../../core/models/player.model';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { DieComponent } from '../../../shared/components/die/die.component';
import { FormsModule } from '@angular/forms';
import { DieValue } from '../../../core/models/die.model';

/**
 * Page principale du jeu
 */
@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [CommonModule, PlayerCardComponent, DieComponent, FormsModule],
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.scss']
})
export class GamePageComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  currentPlayer: Player | null = null;
  activePlayers: Player[] = [];

  // Contrôles d'enchère
  bidQuantity: number = 1;
  bidValue: DieValue = 2;

  // Phases du jeu
  GamePhase = GamePhase;

  private destroy$ = new Subject<void>();

  constructor(
    public gameStateService: GameStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirige vers setup si pas de partie en cours
    if (!this.gameStateService.isGameActive()) {
      this.router.navigate(['/setup']);
      return;
    }

    // Souscrit aux changements d'état
    this.gameStateService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.gameState = state;
      });

    this.gameStateService.currentPlayer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(player => {
        this.currentPlayer = player;
      });

    this.gameStateService.activePlayers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(players => {
        this.activePlayers = players;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Place une enchère
   */
  placeBid(): void {
    try {
      this.gameStateService.placeBid(this.bidQuantity, this.bidValue);
      this.suggestNextBid();
    } catch (error: any) {
      alert(error.message);
    }
  }

  /**
   * Appelle "Dudo"
   */
  callDudo(): void {
    if (confirm('Êtes-vous sûr de vouloir dire "DUDO" ?')) {
      try {
        this.gameStateService.callDudo();
      } catch (error: any) {
        alert(error.message);
      }
    }
  }

  /**
   * Appelle "Calza" (pari que l'enchère est exactement correcte)
   */
  callCalza(): void {
    if (confirm('Êtes-vous sûr de vouloir dire "CALZA" ? Vous pariez que l\'enchère est exactement correcte.')) {
      try {
        this.gameStateService.callCalza();
      } catch (error: any) {
        alert(error.message);
      }
    }
  }

  /**
   * Continue vers la prochaine manche
   */
  continueGame(): void {
    this.gameStateService.continueToNextRound();
    this.suggestNextBid();
  }

  /**
   * Retour au menu
   */
  backToMenu(): void {
    if (confirm('Êtes-vous sûr de vouloir quitter la partie ?')) {
      this.gameStateService.resetGame();
      this.router.navigate(['/setup']);
    }
  }

  /**
   * Nouvelle partie
   */
  newGame(): void {
    this.gameStateService.resetGame();
    this.router.navigate(['/setup']);
  }

  /**
   * Suggère la prochaine enchère minimale
   */
  private suggestNextBid(): void {
    if (!this.gameState?.currentBid) {
      this.bidQuantity = 1;
      this.bidValue = 2;
    } else {
      const currentBid = this.gameState.currentBid;
      if (currentBid.value === 1) {
        // Si enchère sur les "as", suggère de doubler + 1
        this.bidQuantity = currentBid.quantity * 2 + 1;
        this.bidValue = 2;
      } else if (currentBid.value < 6) {
        // Augmente la valeur
        this.bidQuantity = currentBid.quantity;
        this.bidValue = (currentBid.value + 1) as DieValue;
      } else {
        // Augmente la quantité
        this.bidQuantity = currentBid.quantity + 1;
        this.bidValue = currentBid.value;
      }
    }
  }

  /**
   * Vérifie si l'enchère actuelle est valide
   */
  get isBidValid(): boolean {
    if (!this.gameState) return false;
    const validation = this.gameStateService.validateBid(this.bidQuantity, this.bidValue);
    return validation.isValid;
  }

  /**
   * Récupère le gagnant
   */
  get winner(): Player | null {
    return this.gameStateService.getWinner();
  }

  /**
   * Récupère les dés du joueur actuel (avec visibilité)
   */
  get currentPlayerDice() {
    if (!this.currentPlayer) return [];
    return this.currentPlayer.dice.map(die => ({
      ...die,
      isVisible: true
    }));
  }

  /**
   * Récupère les autres joueurs
   */
  get otherPlayers(): Player[] {
    if (!this.currentPlayer) return this.activePlayers;
    return this.activePlayers.filter(p => p.id !== this.currentPlayer!.id);
  }

  /**
   * Valeurs possibles pour les dés
   */
  get dieValues(): DieValue[] {
    return [1, 2, 3, 4, 5, 6];
  }

  /**
   * Récupère le message de phase
   */
  get phaseMessage(): string {
    if (!this.gameState) return '';

    switch (this.gameState.phase) {
      case GamePhase.ROLLING:
        return 'Lancement des dés...';
      case GamePhase.BIDDING:
        return this.gameState.isPalifico ? '⚠️ Mode PALIFICO actif !' : 'Phase d\'enchères';
      case GamePhase.DUDO_CHALLENGE:
        return 'Révélation des dés !';
      case GamePhase.ROUND_END:
        return 'Fin de manche';
      case GamePhase.GAME_OVER:
        return 'Partie terminée !';
      default:
        return '';
    }
  }
}
