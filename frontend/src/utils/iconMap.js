import { 
  Wallet, 
  CreditCard, 
  Calendar, 
  FileText, 
  Info, 
  ShieldCheck,
  DollarSign,
  Users,
  Settings,
  BookOpen,
  Scale,
  Landmark,
  Banknote,
  PiggyBank,
  ClipboardList,
  HandCoins
} from 'lucide-react';





export const iconMap = {
  Wallet,
  CreditCard,
  Calendar,
  FileText,
  Info,
  ShieldCheck,
  DollarSign,
  Users,
  Settings,
  BookOpen,
  Scale,
  Landmark,
  Banknote,
  PiggyBank,
  ClipboardList,
  HandCoins,
};





export const getIconComponent = (iconName) => {
  return iconMap[iconName] || FileText;
};




export const availableIcons = Object.keys(iconMap);




export const iconColorPresets = [
  { label: 'Biru', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Indigo', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Hijau', color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Oranye', color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Merah', color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Ungu', color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Teal', color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'Amber', color: 'text-amber-600', bg: 'bg-amber-50' },
];
