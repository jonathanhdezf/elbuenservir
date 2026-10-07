import React from 'react';
import { X, Smartphone, Download, Share, PlusSquare, MoreVertical, CheckCircle2 } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIos: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose, isIos }) => {
  if (!isOpen) return null;

  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat/i.test(ua);

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tighter">
                Instalar Aplicación
              </h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                El Buen Servir en tu inicio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed">
            Instala nuestra aplicación web en tu dispositivo para abrir el menú con un solo toque y pedir más rápido sin ocupar espacio de memoria.
          </p>

          {isInApp ? (
            /* In-App Browser (WhatsApp, Instagram, Facebook) */
            <div className="space-y-3.5 bg-amber-50 dark:bg-amber-950/40 p-4.5 rounded-2xl border border-amber-200 dark:border-amber-800/60">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <span>⚠️ Abierto dentro de WhatsApp / Red Social:</span>
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                El navegador interno de WhatsApp bloquea la instalación de aplicaciones. Para instalarla:
              </p>

              <div className="space-y-3 text-xs font-bold text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Toca los</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-black">
                      <MoreVertical className="w-3.5 h-3.5" /> 3 puntos
                    </span>
                    <span>o el icono de Compartir arriba a la derecha.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Selecciona</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-black">
                      Abrir en Chrome
                    </span>
                    <span>o Safari.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <span>¡Desde allí el botón instalará la app en un toque!</span>
                </div>
              </div>
            </div>
          ) : isIos ? (
            /* iOS Safari Instructions */
            <div className="space-y-3.5 bg-gray-50 dark:bg-gray-800/70 p-4.5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-2">
                <span>Instrucciones para iPhone / iPad:</span>
              </p>

              <div className="space-y-3 text-xs font-bold text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Toca el botón</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 font-black">
                      <Share className="w-3.5 h-3.5 text-blue-500" /> Compartir
                    </span>
                    <span>en la barra inferior de Safari.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Desliza hacia abajo y pulsa</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 font-black">
                      <PlusSquare className="w-3.5 h-3.5 text-primary-500" /> Agregar a inicio
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Confirma tocando</span>
                    <span className="px-2 py-0.5 rounded-md bg-primary-500 text-white font-black">Agregar</span>
                    <span>arriba a la derecha.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Desktop / Chrome Instructions */
            <div className="space-y-3.5 bg-gray-50 dark:bg-gray-800/70 p-4.5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-2">
                <span>Cómo instalar desde tu navegador:</span>
              </p>

              <div className="space-y-3 text-xs font-bold text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Pulsa el menú del navegador</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-black">
                      <MoreVertical className="w-3.5 h-3.5" /> (3 puntos)
                    </span>
                    <span>o el icono de la barra de direcciones.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Selecciona</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-500 text-white font-black">
                      <Download className="w-3.5 h-3.5" /> Instalar aplicación
                    </span>
                    <span>o "Agregar a pantalla principal".</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <span>¡Listo! Se creará un acceso directo en tus aplicaciones.</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>No consume espacio de almacenamiento ni requiere descargas de tiendas.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-900 dark:bg-primary-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
