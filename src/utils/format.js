export function abbreviate(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return (n || 0).toLocaleString();
}

export function pluralize(word, count) {
  if (count === 1) return word;
  const w = word.toLowerCase();
  if (w.endsWith('s') || w.endsWith('x') || w.endsWith('z') || w.endsWith('ch') || w.endsWith('sh')) {
    return word + 'es';
  }
  if (w.endsWith('fe')) return word.slice(0, -2) + 'ves';
  if (w.endsWith('f')) return word.slice(0, -1) + 'ves';
  if (w.endsWith('y') && !'aeiou'.includes(w[w.length - 2])) return word.slice(0, -1) + 'ies';
  return word + 's';
}

export function getEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('water') || n.includes('drink') || n.includes('juice')) return '🥤';
  if (n.includes('rice') || n.includes('beans')) return '🍚';
  if (n.includes('noodle') || n.includes('indomie') || n.includes('pasta')) return '🍜';
  if (n.includes('oil') || n.includes('palm')) return '🫙';
  if (n.includes('soap') || n.includes('detergent')) return '🧴';
  if (n.includes('sugar') || n.includes('salt')) return '🧂';
  if (n.includes('bread') || n.includes('biscuit')) return '🍞';
  if (n.includes('milk') || n.includes('milo') || n.includes('ovaltine')) return '🥛';
  if (n.includes('egg')) return '🥚';
  if (n.includes('fish')) return '🐟';
  if (n.includes('meat') || n.includes('chicken')) return '🍖';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('yam') || n.includes('cassava') || n.includes('plantain')) return '🍠';
  if (n.includes('phone') || n.includes('handset')) return '📱';
  if (n.includes('shoe') || n.includes('sandal')) return '👟';
  if (n.includes('cloth') || n.includes('shirt')) return '👕';
  if (n.includes('fuel') || n.includes('petrol')) return '⛽';
  return '📦';
}
