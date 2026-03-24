document.addEventListener('DOMContentLoaded', () => {
    /**
     * Log the 404 error for debugging
     * This helps identify broken internal links via the console
     */
    const path = window.location.pathname;
    console.warn(`404 Error: User attempted to access non-existent path: ${path}`);
});