
// Simple debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Truncate function
  export function truncate(text, maxLength) {
      if (!text || typeof text !== 'string' || text.length <= maxLength) {
           return text || ''; // Handle null/undefined/non-string input
      }
      return text.substr(0, maxLength) + '…';
  }