export function formatStatus(status) {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').toUpperCase();
}

export function formatDuration(duration) {
  if (!duration || duration === 0) return 'N/A';
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function getStatusClass(status) {
  if (!status) return 'unknown';
  const statusLower = status.toLowerCase();
  if (statusLower === 'success') return 'success';
  if (statusLower === 'failure') return 'failure';
  if (statusLower === 'failed') return 'failure';
  if (statusLower === 'unstable') return 'warning';
  if (statusLower === 'aborted') return 'warning';
  if (statusLower === 'in_progress') return 'in-progress';
  if (statusLower === 'in progress') return 'in-progress';
  return 'unknown';
}
