import { Component, inject } from '@angular/core';
import { SpocDashboardComponent } from './components/spoc-dashboard.component';
import { DataService } from './services/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SpocDashboardComponent, CommonModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Top Navigation Bar -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <h1 class="text-xl font-bold text-gray-900 tracking-tight">Sales<span class="text-blue-600">Intel</span></h1>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500">
             @if (dataService.sheetName()) {
               <span class="hidden sm:inline">Event: <span class="font-medium text-gray-900">{{ dataService.sheetName() }}</span></span>
             } @else {
               <span class="hidden sm:inline italic text-gray-400">No Sheet Loaded</span>
             }
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <app-spoc-dashboard />
      </main>
    </div>
  `
})
export class AppComponent {
  dataService = inject(DataService);
}