import { Routes } from '@angular/router';
import { SpocDashboardComponent } from './components/spoc-dashboard.component';

export const routes: Routes = [
  { path: 'sheet/:sheetName', component: SpocDashboardComponent },
  { path: '', component: SpocDashboardComponent },
  { path: '**', redirectTo: '' }
];