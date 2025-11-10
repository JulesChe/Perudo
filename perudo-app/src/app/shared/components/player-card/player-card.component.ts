import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../../core/models/player.model';
import { DieComponent } from '../die/die.component';

/**
 * Composant pour afficher la carte d'un joueur
 */
@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule, DieComponent],
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss']
})
export class PlayerCardComponent {
  @Input() player!: Player;
  @Input() showDice: boolean = false;
  @Input() isCompact: boolean = false;

  /**
   * Retourne les classes CSS pour la carte
   */
  get cardClasses(): string {
    const classes = ['player-card'];

    if (this.player.isCurrentTurn) {
      classes.push('player-card-active');
    }

    if (!this.player.isActive) {
      classes.push('player-card-eliminated');
    }

    if (this.isCompact) {
      classes.push('player-card-compact');
    }

    return classes.join(' ');
  }

  /**
   * Retourne le badge de statut du joueur
   */
  get statusBadge(): string {
    if (!this.player.isActive) {
      return 'Éliminé';
    }

    if (this.player.isCurrentTurn) {
      return 'Son tour';
    }

    return '';
  }

  /**
   * Retourne l'indicateur Palifico
   */
  get isPalifico(): boolean {
    return this.player.isActive && this.player.dice.length === 1;
  }
}
