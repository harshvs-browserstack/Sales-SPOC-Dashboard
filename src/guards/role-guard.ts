import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  
  // Check if there's a passkey in sessionStorage
  const eventId = route.paramMap.get('id');
  const accessKey = sessionStorage.getItem(`access_${eventId}`);
  
  // If no access key, redirect to Role Selection page (which sets the key)
  if (!accessKey || accessKey !== 'authorized') {
    const selectionUrl = `/event/${eventId}`;
    router.navigate([selectionUrl]);
    return false;
  }
  
  return true;
};

export const walkinGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const eventId = route.paramMap.get('id');
  
  // Always allow walk-in access
  // We might want to clear access or just let it be. 
  // Clearing it ensures if they navigate back they have to re-select role.
  sessionStorage.removeItem(`access_${eventId}`);
  
  return true;
};