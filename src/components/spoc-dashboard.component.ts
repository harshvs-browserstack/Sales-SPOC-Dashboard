import { Component, inject, signal, computed, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Viewing As</label>
            <div class="relative">
              <select 
                [ngModel]="selectedSpoc()" 
                (ngModelChange)="selectedSpoc.set($event)"
                class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border text-gray-900">
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
               <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Google Sheet URL</label>
               <input 
                 type="text" 
                 [ngModel]="sheetUrl()" 
                 (ngModelChange)="sheetUrl.set($event)"
                 placeholder="https://docs.google.com/spreadsheets/d/..."
                 class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400">
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
               {{ availableSheets().length > 0 ? 'Refresh' : 'Sync' }}
             </button>
          </div>
          }
        </div>

        <!-- Sheet Pills Selector (Routes) -->
        @if (availableSheets().length > 0) {
          <div class="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Worksheet</label>
            <div class="flex flex-wrap gap-2">
              @for (sheet of availableSheets(); track sheet) {
                <button 
                  (click)="navigateToSheet(sheet)"
                  class="px-4 py-1.5 rounded-full text-sm font-medium transition-all border disabled:opacity-50"
                  [class.bg-blue-600]="currentSheetName() === sheet"
                  [class.text-white]="currentSheetName() === sheet"
                  [class.border-blue-600]="currentSheetName() === sheet"
                  [class.shadow-md]="currentSheetName() === sheet"
                  [class.bg-white]="currentSheetName() !== sheet"
                  [class.text-gray-700]="currentSheetName() !== sheet"
                  [class.border-gray-300]="currentSheetName() !== sheet"
                  [class.hover:bg-gray-50]="currentSheetName() !== sheet">
                  {{ sheet }}
                </button>
              }
            </div>
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
          <div class="flex-1 flex gap-2 w-full items-center">
            <div class="relative w-full sm:max-w-md">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                </div>
                <input 
                type="text" 
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" 
                placeholder="Search by name or company...">
            </div>
            
            <!-- Add Walk-in Button (Icon Only Style) -->
            <button 
                (click)="openWalkIn()"
                class="flex-shrink-0 bg-blue-600 text-white h-[38px] w-[38px] rounded-md hover:bg-blue-700 shadow-sm flex items-center justify-center transition-colors"
                title="Add Walk-in Attendee">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </button>
          </div>
          
          <div class="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
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
                <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
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
                
                <!-- Status Toggle -->
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  @if (selectedSpoc() === 'All') {
                      <!-- Admin: Interactive Toggle -->
                      <button
                        (click)="$event.stopPropagation(); handleAttendanceToggle(attendee.id)"
                        class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors cursor-pointer border"
                        [class.bg-green-100]="attendee.attendance"
                        [class.text-green-800]="attendee.attendance"
                        [class.border-green-200]="attendee.attendance"
                        [class.hover:bg-green-200]="attendee.attendance"
                        [class.bg-gray-100]="!attendee.attendance"
                        [class.text-gray-800]="!attendee.attendance"
                        [class.border-gray-200]="!attendee.attendance"
                        [class.hover:bg-gray-200]="!attendee.attendance">
                        {{ attendee.attendance ? 'Checked In' : 'Registered' }}
                      </button>
                  } @else {
                      <!-- SPOC: Read Only Badge -->
                      <span
                        class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border cursor-default"
                        [class.bg-green-100]="attendee.attendance"
                        [class.text-green-800]="attendee.attendance"
                        [class.border-green-200]="attendee.attendance"
                        [class.bg-gray-100]="!attendee.attendance"
                        [class.text-gray-800]="!attendee.attendance"
                        [class.border-gray-200]="!attendee.attendance">
                        {{ attendee.attendance ? 'Checked In' : 'Registered' }}
                      </span>
                  }
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-sm text-gray-500">
                    <span class="w-3 h-3 rounded-full mr-2 ring-1 ring-inset ring-black/10" 
                          [style.background-color]="getLanyardHex(attendee.lanyardColor)"></span>
                    {{ attendee.lanyardColor }}
                  </div>
                  <!-- Print Status (Only Visible for Admin) -->
                  @if (attendee.printStatus && selectedSpoc() === 'All') {
                    <div class="text-xs text-gray-400 mt-1 ml-5">
                       {{ attendee.printStatus }}
                    </div>
                  }
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
                <!-- Mobile Status Toggle -->
                <div>
                    @if (selectedSpoc() === 'All') {
                        <button 
                            (click)="$event.stopPropagation(); handleAttendanceToggle(attendee.id)"
                            class="px-5 py-3 text-sm font-bold rounded-full border transition-colors shadow-sm min-w-[85px] text-center"
                            [class.bg-green-100]="attendee.attendance"
                            [class.text-green-800]="attendee.attendance"
                            [class.border-green-200]="attendee.attendance"
                            [class.bg-gray-100]="!attendee.attendance"
                            [class.text-gray-800]="!attendee.attendance"
                            [class.border-gray-200]="!attendee.attendance">
                            {{ attendee.attendance ? 'In' : 'Reg' }}
                        </button>
                    } @else {
                        <span 
                            class="px-5 py-3 text-sm font-bold rounded-full border shadow-sm min-w-[85px] text-center inline-block"
                            [class.bg-green-100]="attendee.attendance"
                            [class.text-green-800]="attendee.attendance"
                            [class.border-green-200]="attendee.attendance"
                            [class.bg-gray-100]="!attendee.attendance"
                            [class.text-gray-800]="!attendee.attendance"
                            [class.border-gray-200]="!attendee.attendance">
                            {{ attendee.attendance ? 'In' : 'Reg' }}
                        </span>
                    }
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div class="flex flex-col gap-1">
                   <div class="flex items-center gap-2">
                       <span class="w-2 h-2 rounded-full" [style.background-color]="getLanyardHex(attendee.lanyardColor)"></span>
                       {{ attendee.lanyardColor }}
                   </div>
                   @if (attendee.printStatus && selectedSpoc() === 'All') {
                       <span class="text-xs text-gray-400 pl-4">{{ attendee.printStatus }}</span>
                   }
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
        [availableColors]="uniqueLanyardColors()"
        (updateLanyard)="handleLanyardUpdate(selectedAttendee()!.id, $event)"
        (updateAttendance)="handleAttendanceToggle(selectedAttendee()!.id)"
        (updateNote)="handleNoteUpdate(selectedAttendee()!.id, $event)"
        (close)="closeDetail()" />
    }

    <!-- Walk-in Modal -->
    @if (isWalkInOpen()) {
      <div class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-900/50 transition-opacity backdrop-blur-sm"></div>
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">Add Walk-in Attendee</h3>
                    <div class="mt-4 space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" [(ngModel)]="walkInForm.fullName" 
                               class="block w-full rounded-md border-transparent bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 placeholder-gray-400">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" [(ngModel)]="walkInForm.email" 
                               class="block w-full rounded-md border-transparent bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 placeholder-gray-400">
                      </div>
                      <div>
                         <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                         <input type="text" [(ngModel)]="walkInForm.company" 
                                class="block w-full rounded-md border-transparent bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 placeholder-gray-400">
                      </div>
                      <div>
                         <label class="block text-sm font-medium text-gray-700 mb-1">Contact / Phone (Optional)</label>
                         <input type="text" [(ngModel)]="walkInForm.contact" 
                                class="block w-full rounded-md border-transparent bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 placeholder-gray-400">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button 
                  type="button" 
                  [disabled]="isAddingWalkIn() || !walkInForm.fullName || !walkInForm.email"
                  (click)="submitWalkIn()"
                  class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50">
                  {{ isAddingWalkIn() ? 'Adding...' : 'Add Attendee' }}
                </button>
                <button type="button" (click)="closeWalkIn()" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SpocDashboardComponent {
  dataService: DataService = inject(DataService);
  router: Router = inject(Router);

  // Router Params
  routeSheetName = input<string | undefined>(undefined, { alias: 'sheetName' });
  
  // State
  selectedSpoc = signal<string>('All'); 
  filterStatus = signal<'all' | 'checked-in' | 'pending'>('all');
  searchQuery = signal<string>('');
  
  // UI State
  showToast = signal<boolean>(false);
  
  // Backend Config
  sheetUrl = signal<string>('');
  isSyncing = signal<boolean>(false);
  
  // Sheet Selector State
  availableSheets = this.dataService.availableSheets;
  currentSheetName = this.dataService.sheetName;

  selectedAttendee = signal<Attendee | null>(null);

  // Walk-in State
  isWalkInOpen = signal(false);
  isAddingWalkIn = signal(false);
  walkInForm = { fullName: '', email: '', company: '', contact: '' };

  // Computed Data
  allAttendees = this.dataService.getAttendees();

  uniqueSpocs = computed(() => {
    // Robustly find unique SPOCs from loaded data
    const spocs = new Set<string>();
    this.allAttendees().forEach(a => {
      if (a.spocName && a.spocName !== 'Unassigned' && !a.spocName.includes('#N/A')) {
        spocs.add(a.spocName.trim());
      }
    });
    return Array.from(spocs).sort();
  });

  // Extract unique Lanyard colors from data for the dropdown
  uniqueLanyardColors = computed(() => {
    const colors = new Set<string>();
    this.allAttendees().forEach(a => {
      if (a.lanyardColor && a.lanyardColor.trim()) {
         colors.add(a.lanyardColor.trim());
      }
    });
    // Add default ones if missing to ensure UI isn't broken for empty sheets
    if (colors.size === 0) return ['Green', 'Yellow', 'Crimson Red', 'Charcoal Grey','Red'];
    return Array.from(colors).sort();
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

    // 4. SORTING UPGRADE: Group by Account Name (Company), then Attendee Name
    return list.sort((a, b) => {
      // Primary: Company Name (Account) - A to Z
      // Handle empty companies by putting them at the end or beginning? Standard string sort.
      const companyA = (a.company || '').toLowerCase();
      const companyB = (b.company || '').toLowerCase();
      
      if (companyA < companyB) return -1;
      if (companyA > companyB) return 1;

      // Secondary: Full Name - A to Z
      return a.fullName.localeCompare(b.fullName);
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
    // 1. Load URL from localStorage on startup, or use default placeholder
    const stored = localStorage.getItem('googleSheetUrl');
    this.sheetUrl.set(stored || 'https://docs.google.com/spreadsheets/d/1gtZuWwqtI-oI3njQy5hKxmgIfcnyDiRM5FSOBiHeUeA/edit?gid=1343591051#gid=1343591051');

    // 2. Save URL to localStorage whenever it changes
    effect(() => {
      const url = this.sheetUrl();
      if (url) {
        localStorage.setItem('googleSheetUrl', url);
      }
    });

    // 3. Routing Effect: Trigger load when route param changes
    effect(() => {
      const targetSheet = this.routeSheetName();
      const currentUrl = this.sheetUrl();

      if (targetSheet && currentUrl) {
         // Prevent re-loading if we are already on this sheet and data is loaded?
         // For now, simpler is to just load. The service handles some caching implicitly or could be improved.
         // To avoid infinite loops, we check if it's different from currently loaded.
         if (this.dataService.sheetName() !== targetSheet) {
            // Use untracked if we don't want to re-trigger? No, we want this effect.
            // But we must be careful not to trigger it inside the load function itself.
            // Using setTimeout to break signal dependency cycle if any.
            setTimeout(() => this.selectSheet(targetSheet), 0);
         }
      }
    });
  }

  navigateToSheet(sheet: string) {
    this.router.navigate(['/sheet', sheet]);
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
  
  handleNoteUpdate(id: string, note: string) {
    this.dataService.updateNote(id, note);
    const updated = this.allAttendees().find(a => a.id === id);
    if (updated) this.selectedAttendee.set(updated);
  }

  // --- Walk-in Logic ---
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
    // PASSING SHEET URL TO FIX BUG when adding before sync
    const success = await this.dataService.addWalkInAttendee(this.walkInForm, this.sheetUrl());
    this.isAddingWalkIn.set(false);

    if (success) {
      this.closeWalkIn();
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 3000);
    } else {
      alert('Failed to add attendee. Please check backend connection.');
    }
  }

  async syncData() {
    if (this.sheetUrl()) {
      this.isSyncing.set(true);
      
      // Step 1: Try to fetch metadata (List of Sheets)
      const metaSuccess = await this.dataService.fetchSheetMetadata(this.sheetUrl());
      
      if (metaSuccess) {
         const sheets = this.availableSheets();
         // If we found sheets, we should navigate to the first one if we aren't on one
         if (sheets.length > 0) {
             let target = sheets[0];
             const current = this.routeSheetName() || this.currentSheetName();
             
             if (current && sheets.includes(current)) {
                 target = current;
             }
             
             // If we are already on the target route, force reload, else navigate
             if (this.routeSheetName() === target) {
                await this.selectSheet(target);
             } else {
                this.navigateToSheet(target);
                // Navigation will trigger the effect to load
                this.isSyncing.set(false); 
                return;
             }
         } else {
             await this.performLoad();
         }
      } else {
         // Step 2: Fallback for Legacy Backend
         await this.performLoad();
      }
      
      this.isSyncing.set(false);
    } else {
      alert('Please enter the Google Sheet URL.');
    }
  }

  // Helper to load specific sheet data
  async selectSheet(name: string) {
      // Don't set syncing if called from effect to avoid visual jitter? 
      // Actually yes, show loading state.
      this.isSyncing.set(true);
      const success = await this.dataService.loadFromBackend(this.sheetUrl(), name);
      this.isSyncing.set(false);
      
      if (success) {
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3000);
      }
  }

  // Helper for generic load (no specific sheet name known yet)
  private async performLoad() {
      const success = await this.dataService.loadFromBackend(this.sheetUrl());
      if (success) {
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3000);
      }
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