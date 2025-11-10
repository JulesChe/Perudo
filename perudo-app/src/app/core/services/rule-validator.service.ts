import { Injectable } from '@angular/core';
import { Bid, BidValidation, isAsBid, convertToAsBid, convertFromAsBid } from '../models/bid.model';
import { DieValue } from '../models/die.model';

/**
 * Service pour valider les règles du jeu Perudo
 */
@Injectable({
  providedIn: 'root'
})
export class RuleValidatorService {
  /**
   * Valide si une nouvelle enchère est valide par rapport à l'enchère précédente
   * @param newBid Nouvelle enchère
   * @param previousBid Enchère précédente (null si première enchère)
   * @param isPalifico Mode Palifico actif (la valeur ne peut pas changer)
   * @param totalDiceCount Nombre total de dés en jeu
   */
  validateBid(
    newBid: Bid,
    previousBid: Bid | null,
    isPalifico: boolean = false,
    totalDiceCount: number
  ): BidValidation {
    // Validations de base
    if (newBid.quantity < 1) {
      return {
        isValid: false,
        reason: 'La quantité doit être au moins 1'
      };
    }

    if (newBid.value < 1 || newBid.value > 6) {
      return {
        isValid: false,
        reason: 'La valeur du dé doit être entre 1 et 6'
      };
    }

    if (newBid.quantity > totalDiceCount) {
      return {
        isValid: false,
        reason: `Il n'y a que ${totalDiceCount} dés en jeu`
      };
    }

    // Première enchère de la manche
    if (!previousBid) {
      return { isValid: true };
    }

    // En mode Palifico, la valeur ne peut pas changer
    if (isPalifico && newBid.value !== previousBid.value) {
      return {
        isValid: false,
        reason: 'En mode Palifico, vous ne pouvez pas changer la valeur du dé'
      };
    }

    // Validation selon les règles de surenchère
    return this.validateBidIncrease(newBid, previousBid);
  }

  /**
   * Valide si l'enchère est supérieure selon les règles du jeu
   */
  private validateBidIncrease(newBid: Bid, previousBid: Bid): BidValidation {
    const newIsAs = isAsBid(newBid);
    const prevIsAs = isAsBid(previousBid);

    // Cas 1: Enchère normale vers enchère normale
    if (!newIsAs && !prevIsAs) {
      return this.validateNormalToNormal(newBid, previousBid);
    }

    // Cas 2: Enchère normale vers enchère sur les "as"
    if (newIsAs && !prevIsAs) {
      return this.validateNormalToAs(newBid, previousBid);
    }

    // Cas 3: Enchère sur les "as" vers enchère normale
    if (!newIsAs && prevIsAs) {
      return this.validateAsToNormal(newBid, previousBid);
    }

    // Cas 4: Enchère sur les "as" vers enchère sur les "as"
    if (newIsAs && prevIsAs) {
      return this.validateAsToAs(newBid, previousBid);
    }

    return { isValid: false, reason: 'Enchère invalide' };
  }

  /**
   * Valide une enchère normale vers une enchère normale
   */
  private validateNormalToNormal(newBid: Bid, previousBid: Bid): BidValidation {
    // Option 1: Augmenter la quantité (même valeur ou valeur inférieure)
    if (newBid.quantity > previousBid.quantity) {
      return { isValid: true };
    }

    // Option 2: Même quantité mais valeur supérieure
    if (newBid.quantity === previousBid.quantity && newBid.value > previousBid.value) {
      return { isValid: true };
    }

    return {
      isValid: false,
      reason: 'Vous devez augmenter la quantité ou la valeur'
    };
  }

  /**
   * Valide une enchère normale vers une enchère sur les "as"
   * Règle: la quantité des "as" doit être >= quantité précédente / 2 (arrondi sup)
   */
  private validateNormalToAs(newBid: Bid, previousBid: Bid): BidValidation {
    const minAsQuantity = convertToAsBid(previousBid.quantity);

    if (newBid.quantity >= minAsQuantity) {
      return { isValid: true };
    }

    return {
      isValid: false,
      reason: `Pour passer aux "as", vous devez annoncer au moins ${minAsQuantity}`
    };
  }

  /**
   * Valide une enchère sur les "as" vers une enchère normale
   * Règle: la quantité doit être >= quantité précédente * 2 + 1
   */
  private validateAsToNormal(newBid: Bid, previousBid: Bid): BidValidation {
    const minNormalQuantity = convertFromAsBid(previousBid.quantity);

    if (newBid.quantity >= minNormalQuantity) {
      return { isValid: true };
    }

    return {
      isValid: false,
      reason: `Pour quitter les "as", vous devez annoncer au moins ${minNormalQuantity}`
    };
  }

  /**
   * Valide une enchère sur les "as" vers une enchère sur les "as"
   */
  private validateAsToAs(newBid: Bid, previousBid: Bid): BidValidation {
    if (newBid.quantity > previousBid.quantity) {
      return { isValid: true };
    }

    return {
      isValid: false,
      reason: 'Vous devez augmenter la quantité des "as"'
    };
  }

  /**
   * Suggère une enchère minimale valide
   */
  suggestMinimumBid(previousBid: Bid | null, isPalifico: boolean): {
    quantity: number;
    value: DieValue;
  }[] {
    if (!previousBid) {
      return [{ quantity: 1, value: 2 }];
    }

    const suggestions: { quantity: number; value: DieValue }[] = [];

    if (isPalifico) {
      // En Palifico, seule la quantité peut augmenter
      suggestions.push({
        quantity: previousBid.quantity + 1,
        value: previousBid.value
      });
    } else {
      const prevIsAs = isAsBid(previousBid);

      if (!prevIsAs) {
        // Augmenter la valeur
        if (previousBid.value < 6) {
          suggestions.push({
            quantity: previousBid.quantity,
            value: (previousBid.value + 1) as DieValue
          });
        }

        // Augmenter la quantité
        suggestions.push({
          quantity: previousBid.quantity + 1,
          value: previousBid.value
        });

        // Passer aux "as"
        suggestions.push({
          quantity: convertToAsBid(previousBid.quantity),
          value: 1
        });
      } else {
        // Augmenter les "as"
        suggestions.push({
          quantity: previousBid.quantity + 1,
          value: 1
        });

        // Quitter les "as"
        suggestions.push({
          quantity: convertFromAsBid(previousBid.quantity),
          value: 2
        });
      }
    }

    return suggestions;
  }
}
