import moment from 'moment';

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatNumberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatDate(date) {
  return moment(date).format('DD MMM YYYY HH:mm:ss');
}

export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function jsonToPrettyString(obj) {
  return JSON.stringify(obj, null, 2);
}

export function formatCommandList(commands) {
  const sorted = commands.sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map(cmd => {
    const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
    return `!${cmd.name}${aliases} - ${cmd.description}`;
  }).join('\n');
}
