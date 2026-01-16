import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Attendee } from '../services/data.service';
import { AttendeeDetailComponent } from './attendee-detail.component';

@Component({
  selector: 'app-spoc-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AttendeeDetailComponent],
  template: `
    <div class="space-y-6 relative">
      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div class="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
             <div class="bg-green-500 rounded-full p-1">
               <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <div>
               <p class="font-medium text-sm">Sync Complete</p>
               <p class="text-xs text-gray-400">Data successfully loaded from {{ dataService.sheetName() }}</p>
             </div>
             <button (click)="showToast.set(false)" class="ml-2 text-gray-500 hover:text-white">
               <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
        </div>
      }

      <!-- Control Bar: SPOC Selector & Sync -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Viewing As</label>
          <div class="relative">
            <select 
              [ngModel]="selectedSpoc()" 
              (ngModelChange)="selectedSpoc.set($event)"
              class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-50 border">
              <option value="All">All SPOCs (Admin View)</option>
              @for (spoc of uniqueSpocs(); track spoc) {
                <option [value]="spoc">{{ spoc }}</option>
              }
            </select>
          </div>
        </div>

        @if (selectedSpoc() === 'All') {
        <div class="flex items-end gap-2 w-full md:w-auto">
           <div class="w-full md:w-96">
             <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Google Sheet URL (Browser Link)</label>
             <input 
               type="text" 
               [ngModel]="sheetUrl()" 
               (ngModelChange)="sheetUrl.set($event)"
               placeholder="https://docs.google.com/spreadsheets/d/..."
               class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
           </div>
           <button 
             (click)="syncData()"
             [disabled]="isSyncing()"
             class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 min-w-[100px] justify-center">
             @if (isSyncing()) {
               <svg class="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
             } @else {
               <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             }
             Sync
           </button>
        </div>
        }
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Total Leads</p>
          <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats().total }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
          <p class="text-sm font-medium text-green-600">Checked In</p>
          <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats().checkedIn }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Pending</p>
          <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats().pending }}</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p class="text-sm font-medium text-gray-500">Turnout Rate</p>
          <p class="mt-1 text-2xl font-bold text-blue-600">{{ stats().rate }}%</p>
        </div>
      </div>

      <!-- Main List Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- Filters -->
        <div class="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div class="relative w-full sm:w-96">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              placeholder="Search by name or company...">
          </div>
          
          <div class="flex gap-2 w-full sm:w-auto">
            <button 
              (click)="filterStatus.set('all')"
              class="flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors border"
              [class.bg-blue-50]="filterStatus() === 'all'"
              [class.text-blue-700]="filterStatus() === 'all'"
              [class.border-blue-200]="filterStatus() === 'all'"
              [class.bg-white]="filterStatus() !== 'all'"
              [class.text-gray-700]="filterStatus() !== 'all'"
              [class.border-gray-300]="filterStatus() !== 'all'">
              All
            </button>
            <button 
              (click)="filterStatus.set('checked-in')"
              class="flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors border"
              [class.bg-green-50]="filterStatus() === 'checked-in'"
              [class.text-green-700]="filterStatus() === 'checked-in'"
              [class.border-green-200]="filterStatus() === 'checked-in'"
              [class.bg-white]="filterStatus() !== 'checked-in'"
              [class.text-gray-700]="filterStatus() !== 'checked-in'"
              [class.border-gray-300]="filterStatus() !== 'checked-in'">
              Checked In
            </button>
            <button 
              (click)="filterStatus.set('pending')"
              class="flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors border"
              [class.bg-gray-100]="filterStatus() === 'pending'"
              [class.text-gray-800]="filterStatus() === 'pending'"
              [class.border-gray-300]="filterStatus() === 'pending'"
              [class.bg-white]="filterStatus() !== 'pending'"
              [class.text-gray-500]="filterStatus() !== 'pending'">
              Pending
            </button>
          </div>
        </div>

        <!-- Table View (Hidden on mobile, block on md) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lanyard</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in Time</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (attendee of filteredAttendees(); track attendee.id) {
              <tr class="hover:bg-gray-50 cursor-pointer transition-colors" (click)="openDetail(attendee)">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {{ attendee.firstName.charAt(0) }}{{ attendee.lastName.charAt(0) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ attendee.fullName }}</div>
                      <div class="text-sm text-gray-500">{{ attendee.company }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  @if (attendee.attendance) {
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Checked In
                    </span>
                  } @else {
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Registered
                    </span>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-sm text-gray-500">
                    <span class="w-3 h-3 rounded-full mr-2 ring-1 ring-inset ring-black/10" 
                          [style.background-color]="getLanyardHex(attendee.lanyardColor)"></span>
                    {{ attendee.lanyardColor }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ attendee.checkInTime ? (attendee.checkInTime | date:'shortTime') : '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <span class="text-blue-600 hover:text-blue-900">View</span>
                </td>
              </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    No attendees found matching your criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View (Block on mobile, hidden on md) -->
        <div class="md:hidden divide-y divide-gray-200">
          @for (attendee of filteredAttendees(); track attendee.id) {
            <div class="p-4 active:bg-gray-50" (click)="openDetail(attendee)">
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                      {{ attendee.firstName.charAt(0) }}{{ attendee.lastName.charAt(0) }}
                  </div>
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">{{ attendee.fullName }}</h3>
                    <p class="text-xs text-gray-500">{{ attendee.company }}</p>
                  </div>
                </div>
                <div>
                   @if (attendee.attendance) {
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      In
                    </span>
                  }
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div class="flex items-center gap-2">
                   <span class="w-2 h-2 rounded-full" [style.background-color]="getLanyardHex(attendee.lanyardColor)"></span>
                   {{ attendee.lanyardColor }}
                </div>
                @if (attendee.checkInTime) {
                  <div>{{ attendee.checkInTime | date:'shortTime' }}</div>
                }
              </div>
            </div>
          } @empty {
            <div class="p-8 text-center text-gray-500 text-sm">
              No attendees found.
            </div>
          }
        </div>
      </div>
      
      <!-- Footer Info -->
      <div class="text-center text-xs text-gray-400 pb-8">
        Synced from Google Sheets CSV. Last updated just now.
      </div>
    </div>

    <!-- Detail Modal -->
    @if (selectedAttendee()) {
      <app-attendee-detail 
        [attendee]="selectedAttendee()!"
        [isAdmin]="selectedSpoc() === 'All'"
        (updateLanyard)="handleLanyardUpdate(selectedAttendee()!.id, $event)"
        (updateAttendance)="handleAttendanceToggle(selectedAttendee()!.id)"
        (close)="closeDetail()" />
    }
  `
})
export class SpocDashboardComponent {
  dataService = inject(DataService);
  
  // State
  // FIX: Default to 'All' so users see data immediately if their SPOC isn't found
  selectedSpoc = signal<string>('All'); 
  filterStatus = signal<'all' | 'checked-in' | 'pending'>('all');
  searchQuery = signal<string>('');
  
  // UI State
  showToast = signal<boolean>(false);
  
  // Backend Config
  sheetUrl = signal<string>('');
  isSyncing = signal<boolean>(false);

  selectedAttendee = signal<Attendee | null>(null);

  // Computed Data
  allAttendees = this.dataService.getAttendees();

  uniqueSpocs = computed(() => {
    // Robustly find unique SPOCs from loaded data
    const spocs = new Set<string>();
    this.allAttendees().forEach(a => {
      // FIX: Filter out #N/A and other garbage from the selector list
      if (a.spocName && a.spocName !== 'Unassigned' && !a.spocName.includes('#N/A')) {
        spocs.add(a.spocName.trim());
      }
    });
    return Array.from(spocs).sort();
  });

  filteredAttendees = computed(() => {
    let list = this.allAttendees();

    // 1. Filter by SPOC
    if (this.selectedSpoc() !== 'All') {
      list = list.filter(a => a.spocName === this.selectedSpoc());
    }

    // 2. Filter by Status
    if (this.filterStatus() === 'checked-in') {
      list = list.filter(a => a.attendance);
    } else if (this.filterStatus() === 'pending') {
      list = list.filter(a => !a.attendance);
    }

    // 3. Search
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(a => 
        a.fullName.toLowerCase().includes(q) || 
        a.company.toLowerCase().includes(q)
      );
    }

    // 4. Sort: Check-in time desc, then Name
    return list.sort((a, b) => {
      // Primary Sort: Check-in Time (Newest First) if both present
      if (a.attendance && b.attendance) {
        if (a.checkInTime && b.checkInTime) {
          return b.checkInTime.getTime() - a.checkInTime.getTime();
        }
      }
      
      // Secondary Sort: Attendance status group
      if (a.attendance !== b.attendance) {
        return a.attendance ? -1 : 1;
      }
      
      // Tertiary Sort: Name
      // STRICT NULL CHECKS to prevent crashes
      const nameA = String(a.fullName || '').toLowerCase();
      const nameB = String(b.fullName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
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

  constructor() {
    // 1. Load URL from localStorage on startup
    const stored = localStorage.getItem('googleSheetUrl');
    if (stored) {
      this.sheetUrl.set(stored);
    }

    // 2. Save URL to localStorage whenever it changes
    effect(() => {
      const url = this.sheetUrl();
      if (url) {
        localStorage.setItem('googleSheetUrl', url);
      }
    });
  }

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
    this.dataService.toggleAttendance(id);
    const updated = this.allAttendees().find(a => a.id === id);
    if (updated) this.selectedAttendee.set(updated);
  }

  async syncData() {
    if (this.sheetUrl()) {
      this.isSyncing.set(true);
      const success = await this.dataService.loadFromBackend(this.sheetUrl());
      this.isSyncing.set(false);
      
      if (success) {
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3000);
      }
    } else {
      alert('Please enter the Google Sheet URL.');
    }
  }

  getLanyardHex(color: string): string {
    const c = color?.toLowerCase() || '';
    if (c.includes('green')) return '#16a34a';
    if (c.includes('yellow')) return '#ca8a04';
    if (c.includes('red') || c.includes('crimson')) return '#dc2626';
    if (c.includes('grey') || c.includes('gray')) return '#4b5563';
    return '#9ca3af';
  }
}