import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl w-full space-y-8">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">Stack Connect Event Manager</h1>
          <p class="mt-2 text-lg text-gray-600">Manage your event attendees and SPOC assignments efficiently.</p>
        </div>

        <!-- Create Event Form -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Create New Event</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
             <input 
                type="text" 
                [ngModel]="newEventName()" 
                (ngModelChange)="newEventName.set($event)" 
                placeholder="Event Name" 
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
             <input 
                type="text" 
                [ngModel]="newSheetUrl()" 
                (ngModelChange)="newSheetUrl.set($event)" 
                placeholder="Google Sheet URL" 
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
             <button 
                (click)="createEvent()" 
                [disabled]="!newEventName() || !newSheetUrl()"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                Create Event
             </button>
          </div>
          <p class="mt-2 text-xs text-gray-500">
            Note: The Google Sheet must be connected to the specific Apps Script backend.
          </p>
        </div>

        <!-- Saved Events List -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">Your Events</h2>
          
          @if (dataService.savedEvents().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (event of dataService.savedEvents(); track event.id) {
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group relative">
                   <div class="flex justify-between items-start">
                     <div class="cursor-pointer flex-1" (click)="openEvent(event.id)">
                       <h3 class="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{{ event.name }}</h3>
                       <p class="text-xs text-gray-500 mt-1 truncate">{{ event.sheetUrl }}</p>
                       <p class="text-xs text-gray-400 mt-2">Created: {{ event.createdAt | date:'mediumDate' }}</p>
                     </div>
                     <button (click)="deleteEvent(event.id)" class="text-gray-400 hover:text-red-500 p-1">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                     </button>
                   </div>
                   <div class="mt-4 flex gap-2">
                     <button (click)="openEvent(event.id)" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                       Open Dashboard &rarr;
                     </button>
                     <a [routerLink]="['/register', event.id]" class="text-sm font-medium text-purple-600 hover:text-purple-800 ml-auto">
                       Walk-in Link
                     </a>
                   </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating a new event above.</p>
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class LandingPageComponent {
  dataService = inject(DataService);
  router = inject(Router);

  newEventName = signal('');
  newSheetUrl = signal('');

  async createEvent() {
    if (!this.newEventName() || !this.newSheetUrl()) return;
    
    // Log to backend master sheet as well if needed, but for now just local + optional master log
    const event = this.dataService.addEvent(this.newEventName(), this.newSheetUrl());
    
    // Attempt to log to master backend (fire and forget)
    this.dataService.logEventToBackend({
      eventId: event.id,
      eventName: event.name,
      sheetUrl: event.sheetUrl,
      deskLink: window.location.origin + '/#/event/' + event.id + '/desk',
      spocLink: window.location.origin + '/#/event/' + event.id + '/spoc',
      walkinLink: window.location.origin + '/#/register/' + event.id,
      createdAt: new Date().toISOString()
    });

    this.newEventName.set('');
    this.newSheetUrl.set('');
  }

  deleteEvent(id: string) {
    if (confirm('Are you sure you want to delete this event from your local list?')) {
      this.dataService.removeEvent(id);
    }
  }

  openEvent(id: string) {
    sessionStorage.setItem('from_landing', 'true');
    this.router.navigate(['/event', id]);
  }
}
