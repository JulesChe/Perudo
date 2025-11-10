import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DieValue } from '../../../core/models/die.model';

/**
 * Composant pour afficher un dé
 */
@Component({
  selector: 'app-die',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './die.component.html',
  styleUrls: ['./die.component.scss']
})
export class DieComponent {
  @Input() value!: DieValue;
  @Input() isVisible: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Retourne les classes CSS pour le dé
   */
  get dieClasses(): string {
    const classes = ['die', `die-${this.size}`];

    if (!this.isVisible) {
      classes.push('die-hidden');
    }

    return classes.join(' ');
  }

  /**
   * Retourne le symbole Unicode pour les points du dé
   */
  get dieSymbol(): string {
    if (!this.isVisible) {
      return '?';
    }

    // Symboles Unicode des dés
    const symbols: Record<DieValue, string> = {
      1: '⚀',
      2: '⚁',
      3: '⚂',
      4: '⚃',
      5: '⚄',
      6: '⚅'
    };

    return symbols[this.value] || '?';
  }

  /**
   * Retourne la couleur du dé (rouge pour les "as")
   */
  get dieColor(): string {
    return this.value === 1 ? 'text-red-500' : 'text-gray-800';
  }
}
