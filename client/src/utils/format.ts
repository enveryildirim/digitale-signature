/** "Az önce", "5 dk önce" or clock time for older timestamps */
export const formatLastSeen = (isoStr?: string | null): string => {
  if (!isoStr) return 'Bilinmiyor';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Seconds → "45 sn" / "2 dk 10 sn" */
export const formatDuration = (sec?: number): string => {
  if (!sec) return '0 sn';
  const mins = Math.floor(sec / 60);
  const remaining = sec % 60;
  if (mins === 0) return `${sec} sn`;
  return remaining > 0 ? `${mins} dk ${remaining} sn` : `${mins} dk`;
};
