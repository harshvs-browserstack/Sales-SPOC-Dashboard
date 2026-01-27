import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page.component';
import { RoleSelectionComponent } from './components/role-selection.component';
import { SpocDashboardComponent } from './components/spoc-dashboard.component';
import { WalkInPageComponent } from './components/walk-in-page.component';
import { roleGuard, walkinGuard } from './guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent
  },
  {
    path: 'event/:id',
    component: RoleSelectionComponent
    // No guard here, this is the entry point where we set access
  },
  {
    path: 'event/:id/desk',
    component: SpocDashboardComponent,
    data: { mode: 'admin' },
    canActivate: [roleGuard]
  },
  {
    path: 'event/:id/spoc',
    component: SpocDashboardComponent,
    data: { mode: 'spoc' },
    canActivate: [roleGuard]
  },
  // DIFFERENT URL STRUCTURE FOR WALK-IN
  {
    path: 'register/:id',  // Different path entirely
    component: WalkInPageComponent,
    canActivate: [walkinGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];