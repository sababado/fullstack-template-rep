export default {
  title: 'Notes',
  subtitle: 'Private to you.',
  count: '{count, plural, =0 {No notes} one {# note} other {# notes}}',
  loading: 'Loading notes',
  loadFailed: "Couldn't load your notes",
  retry: 'Try again',
  empty: {
    title: 'No notes yet',
    description: 'Notes you add appear here.',
  },
  form: {
    heading: 'New note',
    titleLabel: 'Title',
    bodyLabel: 'Details',
    limit: 'Up to {max, number} characters.',
    submit: 'Add note',
    saved: 'Note added',
  },
  item: {
    updated: 'Updated {date, date, medium}',
    delete: 'Delete “{title}”',
  },
} as const;
