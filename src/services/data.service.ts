import { Injectable, signal } from '@angular/core';

export interface Attendee {
  id: string;
  email: string;
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
  spocSlack?: string;
  checkInTime: Date | null;
  printStatus: string;
  leadIntel?: string;
  notes?: string;
  title?: string;
}

export interface SavedEvent {
  id: string;
  name: string;
  sheetUrl: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private rawAttendees = signal<Attendee[]>([]);
  public sheetName = signal('');
  public availableSheets = signal<string[]>([]);
  public savedEvents = signal<SavedEvent[]>([]);
  
  private readonly HARDCODED_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxCsdkPGi3-rxDTWAJIHfK6O70GaPSmJmlqLYTlX8jxFE7MqOS7koul0uSKTynDXKOa/exec';
  private currentSheetUrl = signal('');

  constructor() {
    this.loadEventsFromStorage();
  }

  // --- EVENT MANAGEMENT ---
  
  private loadEventsFromStorage() {
    const data = localStorage.getItem('stack_connect_events');
    if (data) {
      try {
        this.savedEvents.set(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse saved events');
      }
    }
  }

  addEvent(name: string, sheetUrl: string) {
    const newEvent: SavedEvent = {
      id: crypto.randomUUID(),
      name,
      sheetUrl,
      createdAt: Date.now()
    };
    this.savedEvents.update(prev => [newEvent, ...prev]);
    this.persistEvents();
    return newEvent;
  }

  removeEvent(id: string) {
    this.savedEvents.update(prev => prev.filter(e => e.id !== id));
    this.persistEvents();
  }

  getEventById(id: string): SavedEvent | undefined {
    return this.savedEvents().find(e => e.id === id);
  }

  private persistEvents() {
    localStorage.setItem('stack_connect_events', JSON.stringify(this.savedEvents()));
  }

  // --- NEW: Get event from master log ---
  async getEventFromMasterLog(eventId: string): Promise<SavedEvent | null> {
    if (!this.HARDCODED_SCRIPT_URL) return null;
    
    try {
      const response = await fetch(`${this.HARDCODED_SCRIPT_URL}?action=get_event&eventId=${eventId}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.event) {
        const event: SavedEvent = {
          id: data.event.id,
          name: data.event.name,
          sheetUrl: data.event.sheetUrl,
          createdAt: typeof data.event.createdAt === 'string' 
            ? new Date(data.event.createdAt).getTime() 
            : data.event.createdAt
        };
        
        // Store in localStorage for future use
        const existing = this.savedEvents().find(e => e.id === event.id);
        if (!existing) {
          this.savedEvents.update(prev => [event, ...prev]);
          this.persistEvents();
        }
        
        return event;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch event from master log:', error);
      return null;
    }
  }

  // --- NEW: Helper to load event data ---
  async loadEventData(sheetUrl: string, sheetName: string): Promise<boolean> {
    return await this.loadFromBackend(sheetUrl, sheetName);
  }

  // --- MASTER LOGGING ---
  
  async logEventToBackend(eventData: any) {
    if (!this.HARDCODED_SCRIPT_URL) return;
    try {
      const response = await fetch(this.HARDCODED_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'log_event',
          eventId: eventData.eventId,
          eventName: eventData.eventName,
          sheetUrl: eventData.sheetUrl,
          deskLink: eventData.deskLink,
          spocLink: eventData.spocLink,
          walkinLink: eventData.walkinLink,
          createdAt: eventData.createdAt
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        console.log('✓ Event logged to master sheet');
      } else {
        console.error('Master log error:', result.error);
      }
    } catch (e) {
      console.error('Failed to log event to master sheet', e);
    }
  }

  getAttendees() {
    return this.rawAttendees.asReadonly();
  }

  // --- WRITE OPERATIONS ---
  
  updateLanyardColor(id: string, newColor: string) {
    const attendee = this.rawAttendees().find(a => a.id === id);
    if (!attendee) return;

    this.rawAttendees.update(attendees =>
      attendees.map(a => a.id === id ? { ...a, lanyardColor: newColor } : a)
    );

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

    this.rawAttendees.update(attendees =>
      attendees.map(a => a.id === id ? {
        ...a,
        attendance: newStatus,
        checkInTime: newTime
      } : a)
    );

    this.syncChangeToBackend({
      email: attendee.email,
      attendance: newStatus
    });
  }

  updateNote(id: string, note: string) {
    const attendee = this.rawAttendees().find(a => a.id === id);
    if (!attendee) return;

    this.rawAttendees.update(attendees =>
      attendees.map(a => a.id === id ? { ...a, notes: note } : a)
    );

    this.syncChangeToBackend({
      email: attendee.email,
      notes: note
    });
  }

  async addWalkInAttendee(
    data: { fullName: string; email: string; company: string; contact?: string }, 
    sheetUrlOverride?: string
  ): Promise<boolean> {
    const sheet = sheetUrlOverride || this.currentSheetUrl();
    const sheetName = this.sheetName();
    
    if (!this.HARDCODED_SCRIPT_URL || !sheet) {
      console.error('Missing configuration: Script URL or Sheet URL');
      return false;
    }

    const newId = crypto.randomUUID();
    const nameParts = data.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const newAttendee: Attendee = {
      id: newId,
      fullName: data.fullName,
      email: data.email,
      company: data.company,
      contact: data.contact || '',
      firstName: firstName,
      lastName: lastName,
      attendance: true,
      checkInTime: new Date(),
      segment: 'Walk-in',
      spocName: 'Walk-in',
      spocEmail: '',
      lanyardColor: 'Yellow',
      printStatus: '',
      leadIntel: '',
      notes: ''
    };

    if (this.currentSheetUrl() === sheet) {
      this.rawAttendees.update(prev => [newAttendee, ...prev]);
    }

    try {
      const params = new URLSearchParams({
        action: 'add',
        sheetUrl: sheet
      });

      if (sheetName) params.append('sheetName', sheetName);

      const payload = {
        ...data,
        firstName,
        lastName,
        lanyardColor: 'Yellow'
      };

      const response = await fetch(`${this.HARDCODED_SCRIPT_URL}?${params.toString()}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const res = await response.json();

      if (this.currentSheetUrl() === sheet) {
        if (res.status === 'success' && res.updatedFields) {
          this.rawAttendees.update(attendees =>
            attendees.map(a => a.id === newId ? { ...a, ...res.updatedFields } : a)
          );
        } else if (res.status === 'success' && res.spoc) {
          this.rawAttendees.update(attendees =>
            attendees.map(a => a.id === newId ? { ...a, spocName: res.spoc } : a)
          );
        }
      }

      return res.status === 'success';
    } catch (err) {
      console.error('Failed to add walk-in:', err);
      return false;
    }
  }

  // --- NETWORKING ---
  
  private async syncChangeToBackend(payload: any) {
    const sheet = this.currentSheetUrl();
    const sheetName = this.sheetName();
    
    if (!this.HARDCODED_SCRIPT_URL || !sheet) {
      console.warn('Backend not configured properly. Change is local only.');
      return;
    }

    try {
      const params = new URLSearchParams({
        action: 'update',
        sheetUrl: sheet
      });
      if (sheetName) params.append('sheetName', sheetName);

      await fetch(`${this.HARDCODED_SCRIPT_URL}?${params.toString()}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      console.log('Synced to sheet successfully');
    } catch (err) {
      console.error('Failed to sync change to sheet:', err);
    }
  }

  async loadFromBackend(sheetUrl: string, sheetName?: string): Promise<boolean> {
    this.currentSheetUrl.set(sheetUrl);
    if (sheetName) this.sheetName.set(sheetName);
    
    if (!this.HARDCODED_SCRIPT_URL || !sheetUrl) {
      alert('Configuration Error: Script URL is missing in code.');
      return false;
    }

    try {
      const params = new URLSearchParams({
        action: 'read',
        sheetUrl: sheetUrl
      });
      if (sheetName) params.append('sheetName', sheetName);

      const response = await fetch(`${this.HARDCODED_SCRIPT_URL}?${params.toString()}`);
      const json = await response.json();

      if (json.sheetName) {
        this.sheetName.set(json.sheetName);
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

  async fetchSheetMetadata(sheetUrl: string): Promise<string[]> {
    if (!this.HARDCODED_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${this.HARDCODED_SCRIPT_URL}?action=metadata&sheetUrl=${encodeURIComponent(sheetUrl)}`);
      const json = await response.json();
      if (json.status === 'success' && Array.isArray(json.sheets)) {
        return json.sheets;
      }
      return [];
    } catch (e) {
      console.error('Failed to fetch metadata', e);
      return [];
    }
  }

  // --- DATA PARSING ---
  
  private cleanString(val: any): string {
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    if (s === '#N/A' || s === '#REF!' || s.toLowerCase() === 'nan') return '';
    return s;
  }

  private parseJsonData(rows: any[]) {
    const parsedData: Attendee[] = rows.map(row => {
      const get = (...candidates: string[]) => {
        for (const key of candidates) {
          if (row[key] !== undefined && row[key] !== null) return row[key];
          const lowerKey = key.toLowerCase().trim();
          const found = Object.keys(row).find(k => k.toLowerCase().trim() === lowerKey);
          if (found && row[found] !== undefined && row[found] !== null) return row[found];
        }
        return undefined;
      };

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

      let spocVal = this.cleanString(get('spocName', 'SPOC of the day', 'spocOfTheDay'));
      if (!spocVal) spocVal = 'Unassigned';

      const attendanceVal = get('attendance', 'Attendance', 'Status', 'Registration Status');
      const attendanceBool = attendanceVal === true || 
                             attendanceVal === 'TRUE' || 
                             String(attendanceVal).toLowerCase() === 'true' || 
                             String(attendanceVal).toLowerCase() === 'checked in';

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
        spocSlack: this.cleanString(get('spocSlack', 'SPoC slack', 'spoc_slack')),
        printStatus: this.cleanString(get('printStatus', 'Print Status')),
        checkInTime: checkInDate,
        leadIntel: this.cleanString(get('leadIntel', 'Account Intel', 'Lead Intel', 'talking points', 'Intel')),
        notes: this.cleanString(get('notes', 'Note', 'Notes', 'Comment', 'Comments', 'Feedback'))
      };
    });

    this.rawAttendees.set(parsedData);
  }
}