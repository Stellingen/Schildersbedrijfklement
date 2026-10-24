const serviceKeys = ['binnen', 'buiten', 'latex', 'stuc', 'behang', 'plinten', 'advies'];

export function nextServiceSelection(selected, changedKey, checked) {
  const selection = new Set(selected.filter(key => serviceKeys.includes(key)));
  if (!serviceKeys.includes(changedKey)) return serviceKeys.filter(key => selection.has(key));
  if (checked) selection.add(changedKey);
  else selection.delete(changedKey);
  if (checked && changedKey === 'advies') return ['advies'];
  if (checked) selection.delete('advies');
  if (selection.has('advies')) return ['advies'];
  return serviceKeys.filter(key => selection.has(key));
}
