/**
 * Helper to convert API endpoint paths from /_api/endpoint to /api/endpoint
 * This is needed because the endpoints in the app are using /_api/... but Next.js expects /api/...
 */
export function fixApiPath(path: string): string {
  // Convert /_api/* paths to /api/*
  if (path.startsWith('/_api/')) {
    return '/api/' + path.slice(6);
  }
  return path;
}

/**
 * Detects if a known extension is blocking fetch requests
 */
export function isExtensionBlockingFetch(): boolean {
  try {
    // Check if we're in the browser
    if (typeof window === 'undefined') return false;
    
    // Check for error stack traces in recent errors that might indicate a blocking extension
    const extensionId = 'jjfblogammkiefalfpafidabbnamoknm';
    
    // Check if the extension ID appears in any loaded scripts
    const scripts = document.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.includes(extensionId)) {
        console.warn(`Detected extension ${extensionId} that might block fetch requests`);
        return true;
      }
    }
    
    // Check for specific error patterns in window.onerror (if available)
    if (window.onerror && window.onerror.toString().includes(extensionId)) {
      console.warn(`Detected extension ${extensionId} in error handlers`);
      return true;
    }
    
    // Direct detection: Create a known global variable used by the extension
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || 
        (window as any).__CHROME_EXTENSION_HANDLER__ ||
        document.documentElement.getAttribute('data-extension') === extensionId) {
      console.warn('Detected extension handlers that might block fetch');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for blocking extensions:', error);
    return false;
  }
}

/**
 * Fetch wrapper that fixes API paths and handles errors consistently,
 * with fallback for browser extensions that block fetch
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  // If we detect the extension is blocking fetch, immediately throw to trigger fallback
  if (typeof window !== 'undefined' && isExtensionBlockingFetch()) {
    console.warn(`Skipping fetch to ${url} due to detected blocking extension`);
    throw new Error('Fetch blocked by extension');
  }
  
  // Try multiple API paths if the first one fails (supports both Next.js API routes)
  const urlVariants = [url];
  
  // Add alternative URL format if this is a POST endpoint
  if (url.includes('_POST') && options?.method === 'POST') {
    // Try the standard API endpoint without the _POST suffix
    const baseEndpoint = url.replace('_POST', '');
    urlVariants.unshift(baseEndpoint);
  }
  
  let lastError = null;
  
  // Try each URL variant
  for (const variant of urlVariants) {
    try {
      const fixedUrl = fixApiPath(variant);
      console.log(`Attempting fetch to ${fixedUrl}...`);
      
      const response = await fetch(fixedUrl, options);
      
      if (response.ok) {
        try {
          const data = await response.json();
          return data;
        } catch (parseError) {
          console.warn(`Response from ${fixedUrl} not valid JSON, continuing...`);
          lastError = new Error(`Failed to parse JSON from ${fixedUrl}`);
          continue; // Try next URL variant
        }
      } else {
        console.warn(`HTTP error ${response.status} from ${fixedUrl}, continuing...`);
        lastError = new Error(`HTTP error ${response.status} from ${fixedUrl}`);
        continue; // Try next URL variant
      }
    } catch (fetchError) {
      console.warn(`Fetch error for ${variant}:`, fetchError);
      lastError = fetchError;
      // Continue to next URL variant
    }
  }
  
  // If we get here, all URL variants failed
  console.error(`All API endpoints failed for ${url}`, lastError);
  throw lastError || new Error(`Failed to fetch from ${url}`);
}