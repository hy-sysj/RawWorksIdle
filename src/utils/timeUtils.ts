export const formatDuration = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

export const formatShortDuration = (seconds: number) => {
  if (seconds >= 60) {
    return formatDuration(seconds);
  }

  return `${Math.max(1, Math.ceil(seconds))}초`;
};