export const formatTimeFromUTC = (dateStr) => {
  if (!dateStr) return '-';
  
  // Convert value to string just in case
  let str = String(dateStr);
  
  // PostgreSQL TIMESTAMP without timezone usually comes in format "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS.SSS"
  // If it does not end with 'Z', the browser will treat it as local time instead of UTC.
  // This forces the browser to interpret the time as UTC, which it then correctly converts to the user's local timezone.
  let utcStr = str;
  if (!utcStr.endsWith('Z')) {
    // If it's space-separated, replace with T for strict ISO parsing
    utcStr = utcStr.replace(' ', 'T');
    utcStr += 'Z';
  }

  const dateObj = new Date(utcStr);
  
  // Check if invalid date
  if (isNaN(dateObj.getTime())) {
    return dateStr; // Return original if parsing fails
  }
  
  return dateObj.toLocaleString();
};
