import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Hero Section -->
      <header class="bg-gradient-to-r from-teal-600 to-emerald-600 text-white pb-24 pt-12 px-4 shadow-lg">
        <div class="max-w-5xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl font-bold tracking-tight">StackConnect</h1>
          <p class="mt-4 text-teal-100 text-lg">Multi-Event Management Platform</p>
        </div>
      </header>

      <main class="flex-1 max-w-5xl w-full mx-auto px-4 -mt-12 mb-12">
        <!-- Action Card -->
        <div class="bg-white rounded-xl shadow-md p-6 mb-8 text-center border border-gray-100">
           <button 
             (click)="openCreateModal()"
             class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:-translate-y-1 flex items-center gap-2 mx-auto">
             <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
             </svg>
             Create New Event
           </button>
        </div>

        <!-- Event List -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg class="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Active Events
          </h2>

          @if (dataService.savedEvents().length > 0) {
            <div class="grid gap-6 md:grid-cols-2">
              @for (event of dataService.savedEvents(); track event.id) {
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative group flex flex-col justify-between">
                  
                  <div class="flex justify-between items-start mb-4">
                    <div class="cursor-pointer" [routerLink]="['/event', event.id]">
                      <h3 class="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{{ event.name }}</h3>
                      <p class="text-sm text-gray-500 mt-1">Created {{ event.createdAt | date }}</p>
                    </div>
                    <button (click)="deleteEvent(event.id)" class="text-gray-300 hover:text-red-500 p-1" title="Delete Event">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div class="border-t border-gray-100 pt-4 space-y-3">
                     <p class="text-xs font-semibold text-gray-500 uppercase">Share Links</p>
                     
                     <div class="flex items-center justify-between text-sm">
                       <span class="text-gray-600 flex items-center gap-2">
                         <span class="w-2 h-2 rounded-full bg-teal-500"></span> Admin Desk
                       </span>
                       <button (click)="copyLink(event.id, 'desk')" class="text-teal-600 hover:bg-teal-50 px-2 py-1 rounded text-xs font-medium border border-teal-200">Copy Link</button>
                     </div>

                     <div class="flex items-center justify-between text-sm">
                       <span class="text-gray-600 flex items-center gap-2">
                         <span class="w-2 h-2 rounded-full bg-blue-500"></span> Sales SPOC
                       </span>
                       <button (click)="copyLink(event.id, 'spoc')" class="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium border border-blue-200">Copy Link</button>
                     </div>
                     
                     <div class="flex items-center justify-between text-sm">
                       <span class="text-gray-600 flex items-center gap-2">
                         <span class="w-2 h-2 rounded-full bg-amber-500"></span> Walk-in
                       </span>
                       <button (click)="copyLink(event.id, 'walkin')" class="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded text-xs font-medium border border-amber-200">Copy Link</button>
                     </div>
                  </div>

                  <div class="mt-6 flex justify-end">
                    <a [routerLink]="['/event', event.id]" class="text-teal-600 font-semibold text-sm hover:underline flex items-center gap-1">
                      Open Dashboard 
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div class="mx-auto h-12 w-12 text-gray-400">
                <svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
              <p class="mt-1 text-sm text-gray-500">Create your first event to get started.</p>
            </div>
          }
        </div>
      </main>

      <!-- Create Modal -->
      @if (isCreating()) {
        <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" (click)="isCreating.set(false)"></div>

            <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg class="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">Create New Event</h3>
                    
                    <div class="mt-4 space-y-5">
                      <!-- Step 1: Sheet URL -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Google Sheet URL</label>
                        <div class="mt-1 flex gap-2">
                          <input type="text" [(ngModel)]="newSheetUrl" placeholder="https://docs.google.com/spreadsheets/d/..."
                                 class="block w-full rounded-md border-gray-300 border shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2">
                          <button 
                             (click)="fetchSheets()" 
                             [disabled]="!newSheetUrl || isLoadingSheets()"
                             class="inline-flex justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 whitespace-nowrap">
                             {{ isLoadingSheets() ? 'Loading...' : 'Fetch Sheets' }}
                          </button>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Paste the full URL of your Google Sheet then click Fetch.</p>
                      </div>

                      <!-- Step 2: Select Worksheet -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Event Name (Worksheet Name)</label>
                        @if (availableSheets().length > 0) {
                          <select [(ngModel)]="newEventName"
                                  class="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 bg-white">
                             <option value="" disabled>Select a worksheet...</option>
                             @for(sheet of availableSheets(); track sheet) {
                               <option [value]="sheet">{{ sheet }}</option>
                             }
                          </select>
                        } @else {
                           <input type="text" [(ngModel)]="newEventName" placeholder="e.g. Q3 Summit"
                                  [disabled]="true"
                                  class="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 bg-gray-100 cursor-not-allowed">
                           <p class="mt-1 text-xs text-orange-500" *ngIf="hasAttemptedFetch()">No sheets found. Check URL permission.</p>
                        }
                        <p class="mt-1 text-xs text-gray-500">Select the specific tab to sync with.</p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button type="button" 
                        (click)="saveEvent()"
                        [disabled]="!newEventName || !newSheetUrl || isSavingEvent()"
                        class="inline-flex w-full justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                  {{ isSavingEvent() ? 'Creating...' : 'Create Event' }}
                </button>
                <button type="button" (click)="isCreating.set(false)" class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class LandingPageComponent {
  dataService = inject(DataService);
  isCreating = signal(false);
  isLoadingSheets = signal(false);
  isSavingEvent = signal(false);
  hasAttemptedFetch = signal(false);
  
  newEventName = '';
  newSheetUrl = '';
  availableSheets = signal<string[]>([]);

  openCreateModal() {
    this.newEventName = '';
    this.newSheetUrl = '';
    this.availableSheets.set([]);
    this.hasAttemptedFetch.set(false);
    this.isCreating.set(true);
  }

  async fetchSheets() {
    if (!this.newSheetUrl) return;
    this.isLoadingSheets.set(true);
    this.hasAttemptedFetch.set(true);
    const sheets = await this.dataService.fetchSheetMetadata(this.newSheetUrl);
    this.availableSheets.set(sheets);
    this.isLoadingSheets.set(false);
    if (sheets.length > 0) {
      this.newEventName = sheets[0];
    }
  }

  async saveEvent() {
    if (!this.newEventName || !this.newSheetUrl) return;
    
    this.isSavingEvent.set(true);
    
    try {
      const event = this.dataService.addEvent(this.newEventName, this.newSheetUrl);
      
      // Construct Links
      const baseUrl = window.location.origin + window.location.pathname + '#';
      const deskLink = `${baseUrl}/event/${event.id}/desk`;
      const spocLink = `${baseUrl}/event/${event.id}/spoc`;
      const walkinLink = `${baseUrl}/register/${event.id}`;

      // Log to Master DB with event ID
      await this.dataService.logEventToBackend({
        eventId: event.id,           
        eventName: event.name,
        sheetUrl: event.sheetUrl,
        deskLink,
        spocLink,
        walkinLink,
        createdAt: event.createdAt    
      });

      console.log('✓ Event created and logged to master sheet');
      this.isCreating.set(false);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      this.isSavingEvent.set(false);
    }
  }

  deleteEvent(id: string) {
    if(confirm('Are you sure you want to remove this event?')) {
      this.dataService.removeEvent(id);
    }
  }

  copyLink(id: string, type: 'desk' | 'spoc' | 'walkin') {
    const baseUrl = window.location.origin + window.location.pathname + '#';
    let url = '';
    if (type === 'desk') url = `${baseUrl}/event/${id}/desk`;
    if (type === 'spoc') url = `${baseUrl}/event/${id}/spoc`;
    if (type === 'walkin') url = `${baseUrl}/register/${id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link. Please copy manually: ' + url);
      }
      document.body.removeChild(textArea);
    });
  }
}