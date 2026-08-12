import { CheckCircle2, XCircle, X, AlertTriangle } from 'lucide-react';
import Button from '../atoms/Button';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success', 
  onConfirm, 
  confirmText = 'Ya', 
  cancelText = 'Batal',
  children,
  maxWidth = 'max-w-sm',
  showConfirm = true
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {}
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200`}>
        
        {children ? (
          <>
            {}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
              <h3 className="font-bold text-[#004A9C] text-lg">{title}</h3>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Tutup Modal"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 w-full bg-slate-50/50">
              {children}
            </div>

            {showConfirm && (
              <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3 justify-end items-center">
                 {!onConfirm ? (
                   <Button onClick={onClose} className="!bg-white !text-gray-700 border border-gray-200 hover:!bg-gray-50">
                     {cancelText === 'Batal' ? 'Tutup' : cancelText}
                   </Button>
                 ) : null}
              </div>
            )}
          </>
        ) : (
          
           <>
            <div className="flex justify-end p-2 shrink-0">
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-8 pt-2 flex flex-col items-center text-center overflow-y-auto">
              {type === 'success' ? (
                <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              ) : type === 'error' ? (
                <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
              ) : type === 'warning' ? (
                <div className="w-20 h-20 bg-[#F2994A]/10 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner">
                  <AlertTriangle className="text-[#F2994A]" size={40} strokeWidth={2.5} />
                </div>
              ) : null}
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm font-medium text-gray-500 mb-8">{message}</p>
              
              {onConfirm ? (
                <div className="flex gap-3 w-full">
                  <Button onClick={onClose} className="flex-1 !px-4 !bg-white !text-gray-700 border border-gray-200 hover:!bg-gray-50 shadow-sm">
                    {cancelText}
                  </Button>
                  <Button onClick={onConfirm} className={`flex-1 !px-4 shadow-md ${type === 'error' ? '!bg-[#EB5757] hover:!bg-[#c24646] shadow-[#EB5757]/20' : type === 'warning' ? '!bg-[#F2994A] hover:!bg-[#e0893f] shadow-[#F2994A]/20' : 'shadow-[#004A9C]/20'}`}>
                    {confirmText}
                  </Button>
                </div>
              ) : (
                <Button onClick={onClose} className="w-full">
                  {cancelText === 'Batal' ? 'Tutup' : cancelText}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
