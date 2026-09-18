/**
 * Formats an ISO string, timestamp, or Date object strictly to "DD-MM-YYYY" (e.g., 25-09-2026).
 * Handles null, undefined, or invalid date values safely.
 *
 * @param {string|number|Date} dateInput
 * @returns {string} Formatted date string in DD-MM-YYYY format
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Formats an ISO string, timestamp, or Date object strictly to "DD-MM-YYYY HH:mm".
 *
 * @param {string|number|Date} dateInput
 * @returns {string} Formatted date & time string in DD-MM-YYYY HH:mm format
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Checks whether a given registration deadline has passed compared to current time.
 *
 * @param {string|number|Date} deadline
 * @returns {boolean} True if deadline is in the past
 */
export const isDeadlinePassed = (deadline) => {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  return new Date() > d;
};
