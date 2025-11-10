import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'setup',
    pathMatch: 'full'
  },
  {
    path: 'setup',
    loadComponent: () => import('./features/setup/pages/setup-page.component').then(m => m.SetupPageComponent)
  },
  {
    path: 'game',
    loadComponent: () => import('./features/game/pages/game-page.component').then(m => m.GamePageComponent)
  },
  {
    path: '**',
    redirectTo: 'setup'
  }
];
