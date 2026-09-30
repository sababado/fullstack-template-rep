// Messages for backend error codes (the `code` in the API error envelope).
// A code without an entry falls back to the backend's own safe message.
export default {
  unexpected: 'Something went wrong. Try again.',
  codes: {
    NETWORK_ERROR: "Can't reach the server. Check your connection and try again.",
    UNAUTHORIZED: 'Your session has ended. Sign in again.',
    FORBIDDEN: "You don't have permission to do that.",
    VALIDATION_ERROR: 'Some fields need attention.',
    NOTE_NOT_FOUND: 'That note no longer exists.',
    INTERNAL_ERROR: 'Something went wrong on our side. Try again.',
  },
} as const;
