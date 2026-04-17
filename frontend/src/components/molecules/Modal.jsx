import { CheckCircle2, XCircle, X } from 'lucide-react';
import Button from '../atoms/Button';

export default function Modal({ isOpen, onClose, title, message, type = 'success', onConfirm, confirmText = 'Ya', cancelText = 'Batal' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-8 pt-2 flex flex-col items-center text-center">
          {type === 'success' ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 mb-6">{message}</p>
          {onConfirm ? (
            <div className="flex gap-3 w-full">
              <Button onClick={onClose} className="flex-1 !bg-white !text-gray-700 border border-gray-200 hover:!bg-gray-50 px-0">
                {cancelText}
              </Button>
              <Button onClick={onConfirm} className={`flex-1 px-0 ${type === 'error' ? '!bg-[#EB5757] hover:!bg-[#c24646]' : ''}`}>
                {confirmText}
              </Button>
            </div>
          ) : (
            <Button onClick={onClose} className="w-full">
              Tutup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
