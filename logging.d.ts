/**
 * Logs an error to the console and shows a notification toast.
 * @param {string} message - The error message.
 * @param {any} [error] - The optional error object.
 */
declare function showError(message: string, error?: any): void;

/**
 * Shows an informational notification toast.
 * @param {string} message - The message to display.
 * @param {any} [details] - Optional additional details.
 */
declare function showInfo(message: string, details?: any): void;
