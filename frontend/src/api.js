export const pesos = n => new Intl.NumberFormat('en-PH', {style:'currency',currency:'PHP',maximumFractionDigits:0}).format(n);
export async function api(path, options={}) {
  const response = await fetch('/api'+path, {...options, headers:{'Content-Type':'application/json', ...options.headers}});
  let data;
  try { data = await response.json(); } catch { throw Error('The server is unavailable. Please try again.'); }
  if (!response.ok) throw Error(data.error || 'Request failed.');
  return data;
}
export function remember(access) { try { localStorage.setItem('sweep-access', JSON.stringify(access)); } catch {} }
export const clock = t => { const [h, m] = t.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM'); };