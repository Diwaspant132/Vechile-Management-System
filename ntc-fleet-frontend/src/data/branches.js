export const NTC_BRANCHES = [
  { id: 'CENTRAL_OFFICE', name: 'Central Office (Bhadrakali)' },
  { id: 'SUNDHARA', name: 'Sundhara Branch' },
  { id: 'JAWALAKHEL', name: 'Jawalakhel Branch' },
  { id: 'CHABAHIL', name: 'Chabahil Branch' },
  { id: 'PATAN', name: 'Patan Branch' },
  { id: 'NAXAL', name: 'Naxal Branch' },
  { id: 'BHAKTAPUR', name: 'Bhaktapur Branch' },
  { id: 'BABARMAHAL', name: 'Babarmahal Branch' },
  { id: 'GONGABU', name: 'Gongabu Branch' },
  { id: 'KALANKI', name: 'Kalanki Branch' },
  { id: 'CHHAUNI', name: 'Chhauni Branch' },
  { id: 'THIMI', name: 'Thimi Branch' },
  { id: 'POKHARA', name: 'Pokhara Branch' }
];

export const branches = NTC_BRANCHES.map(b => ({
  id: b.id,
  name: b.name,
  location: b.name,
  type: b.id === 'CENTRAL_OFFICE' ? 'HEAD_OFFICE' : 'BRANCH'
}));
