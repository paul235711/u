/**
 * Utility functions for form handling and validation
 */

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

/**
 * Parse API error response and return user-friendly message
 */
export async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    
    // Handle various error response formats
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: ApiError) => e.message).join(', ');
    }
    
    // Fallback to status text
    return response.statusText || 'An unexpected error occurred';
  } catch {
    // If response is not JSON, use status text
    return response.statusText || 'An unexpected error occurred';
  }
}

/**
 * Validate latitude value
 */
export function validateLatitude(lat: string | number): string | null {
  const num = typeof lat === 'string' ? parseFloat(lat) : lat;
  if (isNaN(num)) return 'Latitude must be a valid number';
  if (num < -90 || num > 90) return 'Latitude must be between -90 and 90';
  return null;
}

/**
 * Validate longitude value
 */
export function validateLongitude(lng: string | number): string | null {
  const num = typeof lng === 'string' ? parseFloat(lng) : lng;
  if (isNaN(num)) return 'Longitude must be a valid number';
  if (num < -180 || num > 180) return 'Longitude must be between -180 and 180';
  return null;
}

/**
 * Validate floor number
 */
export function validateFloorNumber(floor: string | number): string | null {
  const num = typeof floor === 'string' ? parseInt(floor) : floor;
  if (isNaN(num)) return 'Floor number must be a valid integer';
  if (num < -10) return 'Floor number cannot be less than -10 (basement limit)';
  if (num > 200) return 'Floor number cannot exceed 200';
  return null;
}

/**
 * Validate name field
 */
export function validateName(name: string, fieldName: string = 'Name'): string | null {
  if (!name || name.trim().length === 0) return `${fieldName} is required`;
  if (name.length < 2) return `${fieldName} must be at least 2 characters`;
  if (name.length > 100) return `${fieldName} must not exceed 100 characters`;
  return null;
}

/**
 * Check if form has unsaved changes
 */
export function hasUnsavedChanges<T extends Record<string, any>>(
  current: T,
  initial: T
): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}
