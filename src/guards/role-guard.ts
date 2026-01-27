import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const eventId = route.paramMap.get('id');
  
  // Check if accessed from role selection (has access key) OR from landing page
  const accessKey = sessionStorage.getItem(`access_${eventId}`);
  const fromLanding = sessionStorage.getItem('from_landing');
  
  // Allow access if coming from landing or role selection
  if (accessKey === 'authorized' || fromLanding === 'true') {
    // Clear the from_landing flag
    sessionStorage.removeItem('from_landing');
    // Set access for navigation within the app
    sessionStorage.setItem(`access_${eventId}`, 'authorized');
    return true;
  }
  
  // If no access, allow direct link access anyway (remove this restriction for shared links)
  // Just set the access key and allow
  sessionStorage.setItem(`access_${eventId}`, 'authorized');
  return true;
};

export const walkinGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const eventId = route.paramMap.get('id');
  
  // Always allow walk-in access
  // Clear any existing access keys to prevent navigation
  sessionStorage.removeItem(`access_${eventId}`);
  
  return true;
};
