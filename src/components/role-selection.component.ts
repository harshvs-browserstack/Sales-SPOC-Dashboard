import { Component, inject, input, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      <!-- Content Container -->
      <div class="w-full max-w-6xl z-10">
        
        <!-- Header -->
        <div class="text-center mb-16">
          <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">{{ eventName() }}</h1>
          <p class="text-lg text-slate-500 font-medium">Select your role to access the dashboard</p>
          
          <a routerLink="/" class="inline-flex items-center gap-2 mt-6 text-teal-600 font-semibold hover:text-teal-700 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Events
          </a>
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4">
          
          <!-- Admin Desk Card -->
          <a [routerLink]="['/event', id(), 'desk']"
             (click)="setAccess()"
             class="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-teal-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center h-full cursor-pointer relative overflow-hidden">
             
             <!-- Icon Circle -->
             <div class="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-teal-100">
               <svg class="w-10 h-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
             </div>
             
             <h3 class="text-2xl font-bold text-slate-900 mb-3">Registration Desk</h3>
             <p class="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
               Fast check-in mode. Access to all attendees and status management.
             </p>
          </a>

          <!-- Sales SPOC Card -->
          <a [routerLink]="['/event', id(), 'spoc']"
             (click)="setAccess()"
             class="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center h-full cursor-pointer relative overflow-hidden">
             
             <!-- Icon Circle -->
             <div class="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-100">
               <svg class="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
             </div>
             
             <h3 class="text-2xl font-bold text-slate-900 mb-3">Sales SPOC</h3>
             <p class="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
               View your assigned attendees, track arrivals, and manage notes.
             </p>
          </a>

          <!-- Walk-in Card -->
          <a [routerLink]="['/register', id()]"
             class="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center h-full cursor-pointer relative overflow-hidden">
             
             <!-- Icon Circle -->
             <div class="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-purple-100">
               <svg class="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
               </svg>
             </div>
             
             <h3 class="text-2xl font-bold text-slate-900 mb-3">Walk-in</h3>
             <p class="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
               Register new attendees instantly on-site for immediate access.
             </p>
          </a>

        </div>
      </div>
    </div>
  `
})
export class RoleSelectionComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);
  
  id = input.required<string>();
  eventName = computed(() => {
    const event = this.dataService.getEventById(this.id());
    return event?.name || 'Event Dashboard';
  });

  async ngOnInit() {
    const eventId = this.id();
    
    // Set access key for this event (user came from landing page or has legitimate access)
    sessionStorage.setItem(`access_${eventId}`, 'authorized');
    
    // Try to get from localStorage first
    let event = this.dataService.getEventById(eventId);
    
    // If not found, fetch from master log
    if (!event) {
      console.log('Event not in localStorage, fetching from master log...');
      event = await this.dataService.getEventFromMasterLog(eventId);
    }
    
    if (!event) {
      console.error('Event not found');
      // If event doesn't exist, we might want to redirect.
      // But keeping user here to see "Event Not Found" or similar is also fine.
    } else {
      console.log('✓ Event loaded:', event.name);
    }
  }

  setAccess() {
    // Maintain access authorization when navigating to role-specific pages
    sessionStorage.setItem(`access_${this.id()}`, 'authorized');
  }
}