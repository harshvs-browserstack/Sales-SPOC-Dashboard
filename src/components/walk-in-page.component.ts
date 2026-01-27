import { Component, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-walk-in-page',
  standalone: true,
  imports: [CommonModule, FormsModule],  // REMOVED RouterModule
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="text-4xl mb-3">🚶</div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Walk-in Registration</h1>
          <p class="text-gray-600">{{ eventName() }}</p>
        </div>

        @if (!submitted()) {
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                [(ngModel)]="fullName"
                name="fullName"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="john@company.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                type="text"
                [(ngModel)]="company"
                name="company"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Acme Inc"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                [(ngModel)]="contact"
                name="contact"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+1234567890"
              />
            </div>

            <button
              type="submit"
              [disabled]="submitting() || !fullName().trim() || !email().trim() || !company().trim()"
              class="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition text-lg"
            >
              {{ submitting() ? 'Submitting...' : 'Check In' }}
            </button>
          </form>
        } @else {
          <div class="text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <h2 class="text-2xl font-bold text-green-600 mb-2">Successfully Registered!</h2>
            <p class="text-gray-600 mb-6">You have been checked in. Please collect your badge.</p>
            <button
              (click)="reset()"
              class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
            >
              Register Another Attendee
            </button>
          </div>
        }

        <!-- REMOVED: Back to Role Selection link -->
      </div>
    </div>
  `,
  styles: []
})
export class WalkInPageComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);

  id = input.required<string>();
  
  fullName = signal('');
  email = signal('');
  company = signal('');
  contact = signal('');
  submitted = signal(false);
  submitting = signal(false);
  
  eventName = signal('Event');
  private currentEvent: any = null;

  async ngOnInit() {
    const eventId = this.id();
    
    // Try to get from localStorage first
    let event = this.dataService.getEventById(eventId);
    
    // If not found, fetch from master log
    if (!event) {
      console.log('Event not in localStorage, fetching from master log...');
      event = await this.dataService.getEventFromMasterLog(eventId);
    }
    
    if (!event) {
      console.error('Event not found');
      // Don't redirect - just show error in the current page
      this.eventName.set('Event Not Found');
      alert('Event not found. Please contact the event organizer.');
      return;
    }
    
    this.currentEvent = event;
    this.eventName.set(event.name);
    console.log('✓ Event loaded for walk-in:', event.name);
  }

  async onSubmit() {
    if (!this.fullName().trim() || !this.email().trim() || !this.company().trim()) {
      return;
    }

    if (!this.currentEvent) {
      alert('Event not loaded. Please refresh the page.');
      return;
    }

    this.submitting.set(true);

    const success = await this.dataService.addWalkInAttendee(
      {
        fullName: this.fullName(),
        email: this.email(),
        company: this.company(),
        contact: this.contact()
      },
      this.currentEvent.sheetUrl
    );

    this.submitting.set(false);

    if (success) {
      this.submitted.set(true);
    } else {
      alert('Failed to register. Please try again.');
    }
  }

  reset() {
    this.fullName.set('');
    this.email.set('');
    this.company.set('');
    this.contact.set('');
    this.submitted.set(false);
  }
}
