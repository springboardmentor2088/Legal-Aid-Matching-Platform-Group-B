/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} - Formatted relative time string
 */
export const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
        const years = Math.floor(diffInDays / 365);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
};

/**
 * Format a timestamp to a readable date string
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} - Formatted date string (e.g., "Jan 9, 2026")
 */
export const formatDate = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Format a timestamp to a readable date and time string
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} - Formatted date and time string (e.g., "Jan 9, 2026 at 5:17 PM")
 */
export const formatDateTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};
