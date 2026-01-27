import { Component, inject, signal, computed, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService, Attendee } from '../services/data.service';
import { AttendeeDetailComponent } from './attendee-detail.component';

@Component({
  selector: 'app-spoc-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AttendeeDetailComponent, RouterModule],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <!-- Top Navigation Bar -->
      <header class="border-b border-gray-200 sticky top-0 z-10 shadow-sm transition-colors"
              [class.bg-teal-600]="mode() === 'admin'"
              [class.bg-blue-600]="mode() === 'spoc'">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-4">
             <a [routerLink]="['/event', eventId()]" class="text-white/80 hover:text-white">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
             </a>
             <div class="flex flex-col">
               <h1 class="text-lg font-bold text-white leading-tight">{{ dataService.sheetName() || 'Loading...' }}</h1>
               <span class="text-xs text-white/80 font-medium uppercase tracking-wide">
                 {{ mode() === 'admin' ? 'Registration Desk' : 'SPOC Dashboard' }}
               </span>
             </div>
          </div>
          
          <div class="flex items-center gap-3">
             <button 
               (click)="syncData()"
               [disabled]="isSyncing()"
               class="bg-white/10 text-white hover:bg-white/20 p-2 rounded-full shadow-sm transition-colors disabled:opacity-50"
               title="Refresh Data">
               @if (isSyncing()) {
                 <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                   <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               } @else {
                 <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               }
             </button>
          </div>
        </div>
      </header>

      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <!-- Controls -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
          
          <!-- Search -->
          <div class="relative w-full">
             <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             <input 
               type="text" 
               [ngModel]="searchQuery()"
               (ngModelChange)="searchQuery.set($event)"
               class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 sm:text-sm" 
               [class.focus:ring-teal-500]="mode() === 'admin'"
               [class.focus:border-teal-500]="mode() === 'admin'"
               [class.focus:ring-blue-500]="mode() === 'spoc'"
               [class.focus:border-blue-500]="mode() === 'spoc'"
               placeholder="Search by name, company, or email...">
          </div>

          <!-- Filters Row -->
          <div class="flex flex-col md:flex-row gap-3 items-center justify-between">
             
             <!-- SPOC Dropdown -->
             <div class="w-full md:w-auto">
               <select 
                 [ngModel]="selectedSpoc()" 
                 (ngModelChange)="selectedSpoc.set($event)"
                 class="block w-full md:w-64 pl-3 pr-8 py-2.5 text-base border-gray-300 focus:outline-none sm:text-sm rounded-lg bg-white border text-gray-900 shadow-sm"
                 [class.focus:ring-teal-500]="mode() === 'admin'"
                 [class.focus:border-teal-500]="mode() === 'admin'"
                 [class.focus:ring-blue-500]="mode() === 'spoc'"
                 [class.focus:border-blue-500]="mode() === 'spoc'">
                 <option value="All">All SPOCs</option>
                 @for (spoc of uniqueSpocs(); track spoc) {
                   <option [value]="spoc">{{ spoc }}</option>
                 }
               </select>
             </div>

             <!-- Filter Buttons (Responsive Tabs) -->
             <div class="w-full md:w-auto flex gap-2 overflow-x-auto pb-1 md:pb-0">
               <button (click)="filterStatus.set('all')" 
                 class="flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap" 
                 [class.bg-blue-50]="filterStatus() === 'all' && mode() === 'spoc'" 
                 [class.text-blue-700]="filterStatus() === 'all' && mode() === 'spoc'"
                 [class.border-blue-200]="filterStatus() === 'all' && mode() === 'spoc'"
                 [class.bg-teal-50]="filterStatus() === 'all' && mode() === 'admin'" 
                 [class.text-teal-700]="filterStatus() === 'all' && mode() === 'admin'"
                 [class.border-teal-200]="filterStatus() === 'all' && mode() === 'admin'"
                 [class.bg-white]="filterStatus() !== 'all'"
                 [class.text-gray-600]="filterStatus() !== 'all'"
                 [class.border-gray-300]="filterStatus() !== 'all'"
                 [class.hover:bg-gray-50]="filterStatus() !== 'all'">All</button>
               
               <button (click)="filterStatus.set('checked-in')" 
                 class="flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap" 
                 [class.bg-green-50]="filterStatus() === 'checked-in'" 
                 [class.text-green-700]="filterStatus() === 'checked-in'"
                 [class.border-green-200]="filterStatus() === 'checked-in'"
                 [class.bg-white]="filterStatus() !== 'checked-in'"
                 [class.text-gray-600]="filterStatus() !== 'checked-in'"
                 [class.border-gray-300]="filterStatus() !== 'checked-in'"
                 [class.hover:bg-gray-50]="filterStatus() !== 'checked-in'">
                 {{ mode() === 'admin' ? 'Checked In' : 'Checked In' }}
               </button>
               
               <button (click)="filterStatus.set('pending')" 
                 class="flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap" 
                 [class.bg-white]="filterStatus() !== 'pending'" 
                 [class.text-gray-600]="filterStatus() !== 'pending'"
                 [class.border-gray-300]="filterStatus() !== 'pending'"
                 [class.bg-gray-100]="filterStatus() === 'pending'" 
                 [class.text-gray-700]="filterStatus() === 'pending'"
                 [class.border-gray-300]="filterStatus() === 'pending'"
                 [class.hover:bg-gray-50]="filterStatus() !== 'pending'">
                 {{ mode() === 'admin' ? 'Pending' : 'Pending' }}
               </button>
             </div>

             <!-- Add Walk-in (Admin Only) -->
             @if (mode() === 'admin') {
               <button 
                  (click)="openWalkIn()"
                  class="w-full md:w-auto text-white px-6 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 text-sm font-bold transition-colors bg-teal-600 hover:bg-teal-700 uppercase tracking-wide">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Walk-in
               </button>
             }
          </div>
        </div>

        <!-- Stats - Only show for SPOC -->
        @if (mode() === 'spoc') {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p class="text-xs font-semibold text-gray-500 uppercase">Total</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats().total }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
              <p class="text-xs font-semibold text-green-600 uppercase">Checked In</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats().checkedIn }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p class="text-xs font-semibold text-gray-500 uppercase">Pending</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats().pending }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p class="text-xs font-semibold uppercase text-blue-600">Rate</p>
              <p class="mt-1 text-2xl font-bold text-blue-600">{{ stats().rate }}%</p>
            </div>
          </div>
        }

        <!-- DESKTOP TABLE VIEW (Hidden on Mobile) -->
        <div class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee</th>
                  
                  <!-- SPOC Mode: Status Column is 2nd -->
                  @if (mode() === 'spoc') {
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
                  }

                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lanyard</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in Time</th>
                  
                  <!-- Admin Mode: Status Column is last (to the right) -->
                  @if (mode() === 'admin') {
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  }

                  <!-- SPOC Mode: Details Column -->
                  @if (mode() === 'spoc') {
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  }
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (group of groupedAttendees(); track group.name) {
                  <!-- Group Header for SPOC -->
                  @if (mode() === 'spoc' && groupedAttendees().length > 1) {
                    <tr class="bg-gray-50/80 border-b border-gray-200">
                      <td [attr.colspan]="5" class="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {{ group.name }}
                      </td>
                    </tr>
                  }

                  @for (attendee of group.items; track attendee.id) {
                    <tr class="transition-colors border-b border-gray-100 last:border-0 hover:bg-gray-50" 
                        [class.bg-green-50]="attendee.attendance"
                        [class.cursor-pointer]="mode() === 'spoc'"
                        (click)="mode() === 'spoc' ? openDetail(attendee) : null">
                      
                      <!-- Attendee Name -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                               [class.bg-teal-500]="mode() === 'admin'"
                               [class.bg-blue-500]="mode() === 'spoc'">
                            {{ attendee.firstName.charAt(0) }}{{ attendee.lastName.charAt(0) }}
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-bold text-gray-900">{{ attendee.fullName }}</div>
                            <div class="text-sm text-gray-500">{{ attendee.company }}</div>
                            @if (attendee.segment === 'Walk-in') {
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                                Walk-in
                              </span>
                            }
                          </div>
                        </div>
                      </td>
                      
                      <!-- SPOC Status Badge -->
                      @if (mode() === 'spoc') {
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                              [class.bg-green-100]="attendee.attendance"
                              [class.text-green-800]="attendee.attendance"
                              [class.bg-gray-100]="!attendee.attendance"
                              [class.text-gray-800]="!attendee.attendance">
                              {{ attendee.attendance ? 'Checked In' : 'Pending' }}
                            </span>
                        </td>
                      }

                      <!-- Lanyard -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center text-sm text-gray-900 font-medium">
                          <span class="w-3 h-3 rounded-full mr-2 ring-1 ring-inset ring-black/10" 
                                [style.background-color]="getLanyardHex(attendee.lanyardColor)"></span>
                          {{ attendee.lanyardColor }}
                        </div>
                        @if (attendee.printStatus && mode() === 'admin') {
                          <div class="text-xs text-gray-400 mt-1">
                            {{ attendee.printStatus }}
                          </div>
                        }
                      </td>

                      <!-- Check-in Time -->
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ attendee.checkInTime ? (attendee.checkInTime | date:'shortTime') : '-' }}
                      </td>
                      
                      <!-- Admin Status Toggle (Right Aligned) -->
                      @if (mode() === 'admin') {
                        <td class="px-6 py-4 whitespace-nowrap text-right">
                            <div class="flex justify-end items-center">
                              <button (click)="handleAttendanceToggle(attendee.id)" 
                                      class="relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
                                      [class.bg-teal-600]="attendee.attendance"
                                      [class.bg-gray-200]="!attendee.attendance">
                                <span class="sr-only">Use setting</span>
                                <span aria-hidden="true" 
                                      class="pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-[1px]"
                                      [class.translate-x-6]="attendee.attendance"
                                      [class.translate-x-0]="!attendee.attendance"></span>
                              </button>
                            </div>
                        </td>
                      }

                      <!-- SPOC Details Link -->
                      @if (mode() === 'spoc') {
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button class="font-medium hover:underline text-blue-600">Details</button>
                        </td>
                      }
                    </tr>
                  }
                } @empty {
                  <tr>
                    <td [attr.colspan]="5" class="px-6 py-12 text-center text-gray-500">
                      No attendees found.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- MOBILE GROUPED CARD VIEW (Visible on Mobile) -->
        <div class="md:hidden space-y-6">
          @for (group of groupedAttendees(); track group.name) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <!-- Items in Group -->
               @for (attendee of group.items; track attendee.id; let last = $last) {
                  <div class="relative p-4 flex items-center justify-between group transition-colors hover:bg-gray-50"
                       [class.border-b]="!last"
                       [class.border-gray-100]="!last"
                       [class.cursor-pointer]="mode() === 'spoc'"
                       (click)="mode() === 'spoc' ? openDetail(attendee) : null">
                       
                       <!-- Left Side -->
                       <div class="flex items-center gap-3 min-w-0">
                          <!-- Avatar -->
                          <div class="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                               [class.bg-teal-500]="mode() === 'admin'"
                               [class.bg-blue-600]="mode() === 'spoc'">
                            {{ attendee.firstName.charAt(0) }}{{ attendee.lastName.charAt(0) }}
                          </div>
                          
                          <!-- Info -->
                          <div class="min-w-0">
                             <h4 class="text-sm font-bold text-gray-900 truncate leading-tight">{{ attendee.fullName }}</h4>
                             <p class="text-xs text-gray-500 font-medium truncate mt-0.5">{{ attendee.company }}</p>
                             <p class="text-xs text-gray-400 mt-0.5 truncate">{{ attendee.lanyardColor }}</p>
                          </div>
                       </div>

                       <!-- Right Side -->
                       <div class="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                          @if (mode() === 'admin') {
                              <button (click)="$event.stopPropagation(); handleAttendanceToggle(attendee.id)"
                                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
                                      [class.bg-teal-600]="attendee.attendance"
                                      [class.bg-gray-200]="!attendee.attendance">
                                 <span class="sr-only">Use setting</span>
                                 <span aria-hidden="true" 
                                       class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                                       [class.translate-x-5]="attendee.attendance"
                                       [class.translate-x-0]="!attendee.attendance"></span>
                              </button>
                          } @else {
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                                    [class.bg-green-100]="attendee.attendance"
                                    [class.text-green-800]="attendee.attendance"
                                    [class.bg-gray-100]="!attendee.attendance"
                                    [class.text-gray-600]="!attendee.attendance">
                                {{ attendee.attendance ? 'In' : 'Pending' }}
                              </span>
                          }
                          
                          <span class="text-xs text-gray-400 font-medium">
                            {{ attendee.checkInTime ? (attendee.checkInTime | date:'shortTime') : '' }}
                          </span>
                       </div>
                  </div>
               }
            </div>
          } @empty {
            <div class="text-center py-12 text-gray-500">
               No attendees found.
            </div>
          }
        </div>

      </main>

      <!-- Detail Modal -->
      @if (selectedAttendee()) {
        <app-attendee-detail 
          [attendee]="selectedAttendee()!"
          [isAdmin]="mode() === 'admin'"
          [availableColors]="uniqueLanyardColors()"
          (updateLanyard)="handleLanyardUpdate(selectedAttendee()!.id, $event)"
          (updateAttendance)="handleAttendanceToggle(selectedAttendee()!.id)"
          (updateNote)="handleNoteUpdate(selectedAttendee()!.id, $event)"
          (close)="closeDetail()" />
      }

      <!-- Walk-in Modal -->
      @if (isWalkInOpen()) {
        <div class="relative z-50" role="dialog" aria-modal="true">
          <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"></div>
          <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4">
              <div class="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:w-full sm:max-w-lg">
                <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-4">Add Walk-in Attendee</h3>
                  <div class="space-y-4">
                    <input type="text" [(ngModel)]="walkInForm.fullName" placeholder="Full Name" class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-opacity-50 sm:text-sm p-2 border" [class.focus:ring-teal-500]="mode() === 'admin'" [class.focus:ring-blue-500]="mode() === 'spoc'">
                    <input type="email" [(ngModel)]="walkInForm.email" placeholder="Email Address" class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-opacity-50 sm:text-sm p-2 border" [class.focus:ring-teal-500]="mode() === 'admin'" [class.focus:ring-blue-500]="mode() === 'spoc'">
                    <input type="text" [(ngModel)]="walkInForm.company" placeholder="Company" class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-opacity-50 sm:text-sm p-2 border" [class.focus:ring-teal-500]="mode() === 'admin'" [class.focus:ring-blue-500]="mode() === 'spoc'">
                    <input type="text" [(ngModel)]="walkInForm.contact" placeholder="Phone (Optional)" class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-opacity-50 sm:text-sm p-2 border" [class.focus:ring-teal-500]="mode() === 'admin'" [class.focus:ring-blue-500]="mode() === 'spoc'">
                  </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button (click)="submitWalkIn()" 
                          [disabled]="isAddingWalkIn() || !walkInForm.fullName" 
                          class="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50"
                          [class.bg-teal-600]="mode() === 'admin'"
                          [class.hover:bg-teal-500]="mode() === 'admin'"
                          [class.bg-blue-600]="mode() === 'spoc'"
                          [class.hover:bg-blue-500]="mode() === 'spoc'">
                    {{ isAddingWalkIn() ? 'Adding...' : 'Add Attendee' }}
                  </button>
                  <button (click)="closeWalkIn()" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SpocDashboardComponent implements OnInit {
  dataService = inject(DataService);
  router = inject(Router);

  // Inputs mapped from Route Data/Params
  mode = input.required<'admin' | 'spoc'>(); 
  eventId = input.required<string>({ alias: 'id' });
  
  // State
  selectedSpoc = signal<string>('All'); 
  filterStatus = signal<'all' | 'checked-in' | 'pending'>('all');
  searchQuery = signal<string>('');
  
  isSyncing = signal<boolean>(false);
  
  selectedAttendee = signal<Attendee | null>(null);

  // Walk-in State
  isWalkInOpen = signal(false);
  isAddingWalkIn = signal(false);
  walkInForm = { fullName: '', email: '', company: '', contact: '' };

  allAttendees = this.dataService.getAttendees();

  async ngOnInit() {
    await this.initializeDashboard();
  }

  async initializeDashboard() {
    const eventId = this.eventId();
    
    // Try to get from localStorage first
    let event = this.dataService.getEventById(eventId);
    
    // If not found, fetch from master log
    if (!event) {
      console.log('Event not in localStorage, fetching from master log...');
      this.isSyncing.set(true);
      event = await this.dataService.getEventFromMasterLog(eventId);
      this.isSyncing.set(false);
    }
    
    if (!event) {
      console.error('Event not found');
      alert('Event not found. Please check the URL or create the event first.');
      this.router.navigate(['/']);
      return;
    }

    console.log('✓ Event loaded:', event.name);

    // Load event data
    this.isSyncing.set(true);
    await this.dataService.loadFromBackend(event.sheetUrl, event.name);
    this.isSyncing.set(false);
  }

  async syncData() {
    const event = this.dataService.getEventById(this.eventId());
    if (event) {
      this.isSyncing.set(true);
      await this.dataService.loadFromBackend(event.sheetUrl, event.name);
      this.isSyncing.set(false);
    }
  }

  uniqueSpocs = computed(() => {
    const spocs = new Set<string>();
    this.allAttendees().forEach(a => {
      if (a.spocName && a.spocName !== 'Unassigned' && !a.spocName.includes('#N/A')) {
        spocs.add(a.spocName.trim());
      }
    });
    return Array.from(spocs).sort();
  });

  uniqueLanyardColors = computed(() => {
    const colors = new Set<string>();
    this.allAttendees().forEach(a => {
      if (a.lanyardColor && a.lanyardColor.trim()) {
         colors.add(a.lanyardColor.trim());
      }
    });
    if (colors.size === 0) return ['Green', 'Yellow', 'Crimson Red', 'Charcoal Grey','Red'];
    return Array.from(colors).sort();
  });

  filteredAttendees = computed(() => {
    let list = this.allAttendees();

    // 1. Filter by SPOC 
    if (this.selectedSpoc() !== 'All') {
      list = list.filter(a => a.spocName === this.selectedSpoc());
    }

    if (this.filterStatus() === 'checked-in') {
      list = list.filter(a => a.attendance);
    } else if (this.filterStatus() === 'pending') {
      list = list.filter(a => !a.attendance);
    }

    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(a => 
        a.fullName.toLowerCase().includes(q) || 
        a.company.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const companyA = (a.company || '').toLowerCase();
      const companyB = (b.company || '').toLowerCase();
      if (companyA < companyB) return -1;
      if (companyA > companyB) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
  });

  // Grouped attendees for Table View
  groupedAttendees = computed(() => {
    const list = this.filteredAttendees();
    const groups = new Map<string, Attendee[]>();
    
    list.forEach(a => {
      const key = a.company || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    
    return Array.from(groups.entries()).map(([name, items]) => ({ name, items }));
  });

  stats = computed(() => {
    const list = this.filteredAttendees();
    const total = list.length;
    const checkedIn = list.filter(a => a.attendance).length;
    return {
      total,
      checkedIn,
      pending: total - checkedIn,
      rate: total > 0 ? Math.round((checkedIn / total) * 100) : 0
    };
  });

  openDetail(attendee: Attendee) {
    this.selectedAttendee.set(attendee);
  }

  closeDetail() {
    this.selectedAttendee.set(null);
  }
  
  handleLanyardUpdate(id: string, color: string) {
    this.dataService.updateLanyardColor(id, color);
    const updated = this.allAttendees().find(a => a.id === id);
    if (updated) this.selectedAttendee.set(updated);
  }

  handleAttendanceToggle(id: string) {
    if (this.mode() === 'spoc') return; 

    this.dataService.toggleAttendance(id);
    const updated = this.allAttendees().find(a => a.id === id);
    
    // Fix: Only update selectedAttendee if the modal is currently open for this user.
    // This prevents the modal from opening when toggling from the list view.
    if (updated && this.selectedAttendee()?.id === id) {
        this.selectedAttendee.set(updated);
    }
  }
  
  handleNoteUpdate(id: string, note: string) {
    this.dataService.updateNote(id, note);
    const updated = this.allAttendees().find(a => a.id === id);
    if (updated) this.selectedAttendee.set(updated);
  }

  openWalkIn() {
    this.walkInForm = { fullName: '', email: '', company: '', contact: '' };
    this.isWalkInOpen.set(true);
  }

  closeWalkIn() {
    this.isWalkInOpen.set(false);
  }

  async submitWalkIn() {
    if (!this.walkInForm.fullName || !this.walkInForm.email) return;
    this.isAddingWalkIn.set(true);
    // Use the event's sheet URL
    const event = this.dataService.getEventById(this.eventId());
    if (event) {
        await this.dataService.addWalkInAttendee(this.walkInForm, event.sheetUrl);
    }
    this.isAddingWalkIn.set(false);
    this.closeWalkIn();
  }

  getLanyardHex(color: string): string {
    const c = color?.toLowerCase() || '';
    if (c.includes('green')) return '#16a34a';
    if (c.includes('yellow') || c.includes('gold')) return '#ca8a04';
    if (c.includes('red') || c.includes('crimson')) return '#dc2626';
    if (c.includes('blue')) return '#2563eb';
    if (c.includes('purple') || c.includes('violet')) return '#9333ea';
    if (c.includes('orange')) return '#ea580c';
    if (c.includes('grey') || c.includes('gray')) return '#4b5563';
    return '#9ca3af';
  }
}