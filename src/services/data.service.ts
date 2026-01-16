import { Injectable, signal } from '@angular/core';

export interface Attendee {
  id: string; // Internal UUID
  email: string; // Key for DB sync
  fullName: string;
  firstName: string;
  lastName: string;
  contact: string;
  company: string;
  segment: string;
  lanyardColor: string;
  attendance: boolean;
  spocName: string;
  spocEmail: string;
  checkInTime: Date | null;
  printStatus: string;
  leadIntel?: string; // New Field for Column Q
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Main data store
  private rawAttendees = signal<Attendee[]>([]);
  public sheetName = signal<string>(''); // Default empty to show "No Sheet Loaded" initially
  
  // Configuration
  // REPLACE THIS STRING WITH YOUR ACTUAL DEPLOYED APPS SCRIPT WEB APP URL
  private readonly HARDCODED_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBS8U7puIVXH6OJm3U8DcuDTRcyjCaQjgCvBW2Y1HxgW_yfYdrUgBTmXT00_bInAd_/exec'; 
  
  private currentSheetUrl = signal<string>(''); 

  getAttendees() {
    return this.rawAttendees.asReadonly();
  }
  
  // --- WRITE OPERATIONS ---

  updateLanyardColor(id: string, newColor: string) {
    const attendee = this.rawAttendees().find(a => a.id === id);
    if (!attendee) return;

    // 1. Optimistic UI Update (Instant)
    this.rawAttendees.update(attendees =>
      attendees.map(a => a.id === id ? { ...a, lanyardColor: newColor } : a)
    );

    // 2. Background Sync
    this.syncChangeToBackend({
      email: attendee.email,
      lanyardColor: newColor
    });
  }

  toggleAttendance(id: string) {
    const attendee = this.rawAttendees().find(a => a.id === id);
    if (!attendee) return;

    const newStatus = !attendee.attendance;
    const newTime = newStatus ? new Date() : null;

    // 1. Optimistic UI Update
    this.rawAttendees.update(attendees =>
      attendees.map(a => a.id === id ? { 
        ...a, 
        attendance: newStatus,
        checkInTime: newTime
      } : a)
    );

    // 2. Background Sync
    this.syncChangeToBackend({
      email: attendee.email,
      attendance: newStatus
    });
  }

  // --- NETWORKING ---

  private async syncChangeToBackend(payload: any) {
    const sheet = this.currentSheetUrl();

    if (!this.HARDCODED_SCRIPT_URL || !sheet) {
      console.warn('Backend not configured properly. Change is local only.');
      return;
    }

    try {
      await fetch(`${this.HARDCODED_SCRIPT_URL}?action=update&sheetUrl=${encodeURIComponent(sheet)}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      console.log('Synced to sheet successfully');
    } catch (err) {
      console.error('Failed to sync change to sheet:', err);
    }
  }

  async loadFromBackend(sheetUrl: string): Promise<boolean> {
    this.currentSheetUrl.set(sheetUrl);

    if (!this.HARDCODED_SCRIPT_URL || !sheetUrl) {
      alert('Configuration Error: Script URL is missing in code.');
      return false;
    }

    try {
      const response = await fetch(`${this.HARDCODED_SCRIPT_URL}?action=read&sheetUrl=${encodeURIComponent(sheetUrl)}`);
      const json = await response.json();
      
      console.log('Raw Backend Response:', json); // Debug log

      if (json.sheetName) {
        this.sheetName.set(json.sheetName);
      } else {
        this.sheetName.set('Unknown Sheet');
      }

      if (json.attendees) {
        this.parseJsonData(json.attendees);
        return true;
      } else if (json.error) {
        alert('Google Script Error: ' + json.error);
        return false;
      }
      return false;
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to connect to backend. Check console.');
      return false;
    }
  }
  
  private cleanString(val: any): string {
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    if (s === '#N/A' || s === '#REF!' || s.toLowerCase() === 'nan') return '';
    return s;
  }

  private parseJsonData(rows: any[]) {
    const parsedData: Attendee[] = rows.map(row => {
      // HELPER: Robustly find a value using multiple possible keys (camelCase or Raw Header)
      const get = (...candidates: string[]) => {
        for (const key of candidates) {
          if (row[key] !== undefined && row[key] !== null) return row[key];
          
          const lowerKey = key.toLowerCase().trim();
          const found = Object.keys(row).find(k => k.toLowerCase().trim() === lowerKey);
          
          if (found && row[found] !== undefined && row[found] !== null) return row[found];
        }
        return undefined;
      };

      // 1. Robust Date Parsing
      const checkInTimeRaw = get('checkInTime', 'Check-in Time', 'check_in_time', 'time');
      let checkInDate: Date | null = null;
      
      if (checkInTimeRaw && this.cleanString(checkInTimeRaw)) {
        const dStr = String(checkInTimeRaw).trim();
        const ddmmyyyy = dStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/);
        
        if (ddmmyyyy) {
          const day = parseInt(ddmmyyyy[1], 10);
          const month = parseInt(ddmmyyyy[2], 10);
          const year = parseInt(ddmmyyyy[3], 10);
          const timeStr = ddmmyyyy[4] || '';
          
          if (day > 12) {
             const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}${timeStr.replace(/,/g, '')}`;
             const d = new Date(isoDate);
             if (!isNaN(d.getTime())) checkInDate = d;
          } else {
             const d = new Date(dStr);
             if (!isNaN(d.getTime())) checkInDate = d;
          }
        } else {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) checkInDate = d;
        }
      }

      // 2. Robust Name Parsing
      let fName = this.cleanString(get('firstName', 'First Name', 'firstname'));
      let lName = this.cleanString(get('lastName', 'Last Name', 'lastname'));
      let full = this.cleanString(get('fullName', 'Full Name', 'fullname', 'Name'));

      if (!full && (fName || lName)) full = `${fName} ${lName}`.trim();
      if (full && !fName) {
         const parts = full.split(' ');
         fName = parts[0];
         lName = parts.slice(1).join(' ');
      }
      if (!full) full = 'Unknown Attendee';

      // 3. Fallback Lookups for other fields
      let spocVal = this.cleanString(get('spocName', 'SPOC of the day', 'spoc', 'Account owner', 'Owner', 'SPOC'));
      if (!spocVal) spocVal = 'Unassigned';

      // Robust Attendance: Check for 'Status', 'Registration Status'
      const attendanceVal = get('attendance', 'Attendance', 'Status', 'Registration Status');
      const attendanceBool = attendanceVal === true || attendanceVal === 'TRUE' || String(attendanceVal).toLowerCase() === 'true' || String(attendanceVal).toLowerCase() === 'checked in';

      return {
        id: crypto.randomUUID(),
        fullName: full,
        firstName: fName,
        lastName: lName,
        email: this.cleanString(get('email', 'Email', 'E-mail')),
        contact: this.cleanString(get('contact', 'Contact', 'Phone', 'Mobile')),
        company: this.cleanString(get('company', 'Company', 'Organization')),
        segment: this.cleanString(get('segment', 'Segment', 'Industry')),
        lanyardColor: this.cleanString(get('lanyardColor', 'Colour of the Lanyard', 'Color of the Lanyard', 'Lanyard', 'Lanyard Color')),
        attendance: attendanceBool,
        spocName: spocVal,
        spocEmail: this.cleanString(get('spocEmail', 'SPoC email', 'spoc_email')),
        printStatus: this.cleanString(get('printStatus', 'Print Status')),
        checkInTime: checkInDate,
        leadIntel: this.cleanString(get('leadIntel', 'Lead Intel', 'talking points', 'Intel', 'Notes'))
      };
    });

    this.rawAttendees.set(parsedData);
  }
}