import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameStateService } from '../../../core/services/game-state.service';

/**
 * Page de configuration pour démarrer une partie
 */
@Component({
  selector: 'app-setup-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-page.component.html',
  styleUrls: ['./setup-page.component.scss']
})
export class SetupPageComponent {
  playerNames: string[] = ['', ''];
  minPlayers = 2;
  maxPlayers = 6;
  errorMessage = '';

  constructor(
    private gameState: GameStateService,
    private router: Router
  ) {}

  /**
   * Ajoute un champ pour un nouveau joueur
   */
  addPlayer(): void {
    if (this.playerNames.length < this.maxPlayers) {
      this.playerNames.push('');
      this.errorMessage = '';
    }
  }

  /**
   * Retire un joueur
   */
  removePlayer(index: number): void {
    if (this.playerNames.length > this.minPlayers) {
      this.playerNames.splice(index, 1);
      this.errorMessage = '';
    }
  }

  /**
   * Démarre la partie
   */
  startGame(): void {
    // Validation
    const filledNames = this.playerNames.filter(name => name.trim() !== '');

    if (filledNames.length < this.minPlayers) {
      this.errorMessage = `Vous devez avoir au moins ${this.minPlayers} joueurs`;
      return;
    }

    if (filledNames.length > this.maxPlayers) {
      this.errorMessage = `Vous ne pouvez pas avoir plus de ${this.maxPlayers} joueurs`;
      return;
    }

    // Vérifie les noms en double
    const uniqueNames = new Set(filledNames);
    if (uniqueNames.size !== filledNames.length) {
      this.errorMessage = 'Les noms des joueurs doivent être uniques';
      return;
    }

    // Démarre la partie
    try {
      this.gameState.startGame(filledNames);
      this.router.navigate(['/game']);
    } catch (error) {
      this.errorMessage = 'Erreur lors du démarrage de la partie';
      console.error(error);
    }
  }

  /**
   * Vérifie si le formulaire est valide
   */
  get isFormValid(): boolean {
    const filledNames = this.playerNames.filter(name => name.trim() !== '');
    return filledNames.length >= this.minPlayers &&
           filledNames.length <= this.maxPlayers;
  }

  /**
   * Track by pour *ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }
}
