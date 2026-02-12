import { Component, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-walk-in-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="text-4xl mb-3">🚶</div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Walk-in Registration</h1>
          <p class="text-gray-600">{{ eventName() }}</p>
        </div>

        @if (errorMessage()) {
          <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm" role="alert">
            <div class="flex items-center gap-2 text-red-700">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="font-bold">Registration Error</p>
            </div>
            <p class="text-sm text-red-600 mt-1 ml-7">{{ errorMessage() }}</p>
          </div>
        }

        @if (!submitted()) {
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                [(ngModel)]="fullName"
                name="fullName"
                required
                (input)="errorMessage.set('')"
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
                (input)="errorMessage.set('')"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="john@company.com"
              />
              <p class="text-xs text-gray-500 mt-1">Please use your corporate email address.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                type="text"
                [(ngModel)]="company"
                name="company"
                required
                (input)="errorMessage.set('')"
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
                (input)="errorMessage.set('')"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
              <p class="text-xs text-gray-500 mt-1">Please include country code (e.g. +1, +91)</p>
            </div>

            <button
              type="submit"
              [disabled]="submitting() || !fullName().trim() || !email().trim() || !company().trim()"
              class="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition text-lg"
            >
              {{ submitting() ? 'Submitting...' : 'Register' }}
            </button>
          </form>
        } @else {
          <div class="text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <h2 class="text-2xl font-bold text-green-600 mb-2">Successfully Registered!</h2>
            <p class="text-gray-600 mb-6">You have been registered. Please collect your badge.</p>
            <button
              (click)="reset()"
              class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
            >
              Register Another Attendee
            </button>
          </div>
        }
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
  errorMessage = signal('');

  eventName = signal('Event');
  private currentEvent: any = null;

  async ngOnInit() {
    const eventId = this.id();

    let event = this.dataService.getEventById(eventId);

    if (!event) {
      console.log('Event not in localStorage, fetching from master log...');
      event = await this.dataService.getEventFromMasterLog(eventId);
    }

    if (!event) {
      console.error('Event not found');
      this.eventName.set('Event Not Found');
      this.errorMessage.set('Event not found. Please contact the event organizer.');
      return;
    }

    this.currentEvent = event;
    this.eventName.set(event.name);
    this.dataService.sheetName.set(event.name);
    console.log('✓ Event loaded for walk-in:', event.name);
  }

  async onSubmit() {
    this.errorMessage.set('');

    if (!this.fullName().trim() || !this.email().trim() || !this.company().trim()) {
      return;
    }

    const emailInput = this.email().trim();
    const contactInput = this.contact().trim();

    // 1. Valid Email Format Check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailInput)) {
      this.errorMessage.set("Please enter a valid email address.");
      return;
    }

    // 2. Corporate Email Validation
    const emailLower = emailInput.toLowerCase();
    const isPersonalOrEdu = 
      emailLower.includes('@gmail.') || 
      emailLower.includes('@yahoo.') || 
      emailLower.includes('@zoho.') || 
      emailLower.includes('.edu') || 
      emailLower.endsWith('.edu');

    if (isPersonalOrEdu) {
      this.errorMessage.set("Please enter your corporate email ID. Personal accounts are not accepted.");
      return;
    }

    // 3. Contact Number Validation (If provided)
    if (contactInput) {
      // Must start with +, followed by 7-15 digits (allowing for spaces/dashes/parens)
      // Strips non-digit chars to check length, but ensures it starts with +
      const hasCountryCode = contactInput.startsWith('+');
      const digitCount = contactInput.replace(/[^0-9]/g, '').length;
      
      // International standards usually 7 to 15 digits
      const isValidLength = digitCount >= 7 && digitCount <= 15;
      // Allow +, space, -, (, ) and numbers
      const isValidChars = /^\+[0-9\s\-\(\).]+$/.test(contactInput);

      if (!hasCountryCode || !isValidLength || !isValidChars) {
        this.errorMessage.set("Please enter a valid international phone number starting with a country code (e.g. +1 ...).");
        return;
      }
    }

    if (!this.currentEvent) {
      this.errorMessage.set('Event not loaded. Please refresh the page.');
      return;
    }

    this.submitting.set(true);

    const success = await this.dataService.addWalkInAttendee(
      {
        fullName: this.fullName(),
        email: emailInput,
        company: this.company(),
        contact: contactInput
      },
      this.currentEvent.sheetUrl,
      {
        name: this.currentEvent.defaultSpocName,
        email: this.currentEvent.defaultSpocEmail,
        slack: this.currentEvent.defaultSpocSlack
      }
    );
    this.submitting.set(false);

    if (success) {
      this.submitted.set(true);
    } else {
      this.errorMessage.set('Failed to register. Please check your connection and try again.');
    }
  }

  reset() {
    this.fullName.set('');
    this.email.set('');
    this.company.set('');
    this.contact.set('');
    this.errorMessage.set('');
    this.submitted.set(false);
  }
}