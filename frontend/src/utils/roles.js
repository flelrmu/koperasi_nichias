export const MANAGEMENT_ROLES = [
  'Ketua', 
  'Wakil_Ketua', 
  'Sekretaris', 
  'Bendahara', 
  'Koordinator_Simpan_Pinjam'
];

export const isSekretaris = (role) => role === 'Sekretaris';
export const isBendahara = (role) => role === 'Bendahara';
export const isKoordinatorSP = (role) => role === 'Koordinator_Simpan_Pinjam';
export const isKetuaOrWakil = (role) => ['Ketua', 'Wakil_Ketua'].includes(role);
export const isManagement = (role) => MANAGEMENT_ROLES.includes(role);
