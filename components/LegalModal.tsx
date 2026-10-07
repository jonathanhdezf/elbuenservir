import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Cookie, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Scale, 
  Info, 
  MessageCircle,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';

export type LegalDocType = 'privacy' | 'terms' | 'cookies';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'privacy'
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    if (isOpen) {
      setActiveDoc(initialDoc);
    }
  }, [isOpen, initialDoc]);

  if (!isOpen) return null;

  const handleTabChange = (doc: LegalDocType) => {
    soundManager.play('click');
    setActiveDoc(doc);
  };

  const handleClose = () => {
    soundManager.play('click');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
        onClick={handleClose} 
      />

      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-[36px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        
        {/* Top Header */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/70 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25 shrink-0">
              {activeDoc === 'privacy' && <ShieldCheck className="w-6 h-6" />}
              {activeDoc === 'terms' && <FileText className="w-6 h-6" />}
              {activeDoc === 'cookies' && <Cookie className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400 block mb-0.5">
                Centro Legal & Transparencia
              </span>
              <h3 className="font-black text-xl sm:text-2xl text-gray-900 dark:text-white uppercase tracking-tight">
                {activeDoc === 'privacy' && 'Aviso de Privacidad'}
                {activeDoc === 'terms' && 'Términos y Condiciones'}
                {activeDoc === 'cookies' && 'Política de Cookies'}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Cerrar modal"
            aria-label="Cerrar ventana legal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 py-3 bg-gray-100/70 dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => handleTabChange('privacy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeDoc === 'privacy'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25 scale-102'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 border border-gray-200/60 dark:border-gray-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacidad</span>
          </button>

          <button
            onClick={() => handleTabChange('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeDoc === 'terms'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25 scale-102'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 border border-gray-200/60 dark:border-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Términos</span>
          </button>

          <button
            onClick={() => handleTabChange('cookies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeDoc === 'cookies'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25 scale-102'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 border border-gray-200/60 dark:border-gray-700'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Cookies</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-8 text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
          
          {/* Metadata pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs">
            <span className="flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-primary-500" />
              Última actualización: 7 de Octubre de 2026
            </span>
            <span className="font-semibold opacity-90">
              Vigente para el territorio de México (Teziutlán, Puebla)
            </span>
          </div>

          {/* 1. POLÍTICA DE PRIVACIDAD */}
          {activeDoc === 'privacy' && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  1. Identidad y Domicilio del Responsable
                </h4>
                <p>
                  <strong>El Buen Servir</strong>, con domicilio comercial en Mercado Filomeno Mata Local #67, 16 de Septiembre, C.P. 73800, Teziutlán, Puebla, México, es el responsable del tratamiento y protección de sus datos personales, en estricto cumplimiento con la <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</em>.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  2. Datos Personales que Recopilamos
                </h4>
                <p>
                  Para la gestión de su pedido a través de nuestro menú digital y envío a WhatsApp, recopilamos únicamente los datos indispensables:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-gray-600 dark:text-gray-300">
                  <li><strong>Datos de contacto:</strong> Nombre completo y número telefónico a 10 dígitos (utilizado para vincular su pedido en WhatsApp).</li>
                  <li><strong>Datos de entrega (opcional):</strong> Dirección de entrega para pedidos a domicilio o número de mesa para consumo en comedor.</li>
                  <li><strong>Preferencias gastronómicas:</strong> Platillos elegidos, variantes seleccionadas e instrucciones especiales de preparación.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  3. Finalidades del Tratamiento
                </h4>
                <p>
                  Sus datos personales son utilizados para las siguientes finalidades primarias y necesarias:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="font-black text-xs uppercase text-gray-900 dark:text-white mb-1">Finalidades Primarias</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Preparación y despacho de alimentos, cálculo del importe, comunicación directa por WhatsApp y entrega en mesa o domicilio.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="font-black text-xs uppercase text-gray-900 dark:text-white mb-1">Sin Venta a Terceros</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bajo ninguna circunstancia vendemos, alquilamos ni transferimos sus datos personales a agencias de marketing o terceros ajenos.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  4. Ejercicio de Derechos ARCO
                </h4>
                <p>
                  Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse (ARCO)</strong> al uso de sus datos personales. Para ejercer estos derechos, puede escribirnos directamente a nuestro canal de atención por WhatsApp al <strong>+52 231 180 8272</strong> o visitarnos en nuestras instalaciones.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  5. Seguridad de la Información
                </h4>
                <p>
                  El sitio utiliza cifrado seguro SSL/TLS (HTTPS) para proteger cualquier comunicación entre su dispositivo y nuestros servidores. Los datos de sesión y preferencias se guardan de forma aislada en el almacenamiento local de su navegador.
                </p>
              </section>
            </div>
          )}

          {/* 2. TÉRMINOS Y CONDICIONES */}
          {activeDoc === 'terms' && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  1. Aceptación del Servicio
                </h4>
                <p>
                  Al navegar en el menú digital de <strong>El Buen Servir</strong> y utilizar la herramienta de armado de pedidos, el cliente acepta expresamente los presentes Términos y Condiciones. Este servicio tiene como propósito facilitar la consulta de nuestra carta y la generación de órdenes digitales directas.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  2. Precios, Disponibilidad y Variantes
                </h4>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600 dark:text-gray-300">
                  <li>Todos los precios están expresados en pesos mexicanos (MXN) e incluyen los impuestos aplicables.</li>
                  <li>Las variantes de los platillos (chico, grande, opciones con carne/pollo/cerdo) se especifican detalladamente con su precio correspondiente.</li>
                  <li>Debido a que nuestros alimentos se preparan frescos diariamente, la disponibilidad de ciertos platillos o ingredientes de temporada puede variar a lo largo de la jornada.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  3. Mecánica del Pedido vía WhatsApp
                </h4>
                <p>
                  La aplicación genera un mensaje estructurado y listo para enviar a nuestro WhatsApp oficial:
                </p>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300">
                  <p className="font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-500" /> Confirmación del Pedido
                  </p>
                  <p>
                    El pedido se considera confirmado únicamente cuando el equipo de El Buen Servir responde en el chat de WhatsApp validando tiempo estimado de entrega y recepción de la orden en cocina.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  4. Modificaciones y Cancelaciones
                </h4>
                <p>
                  Cualquier ajuste a su pedido (cambio de variante, instrucción especial o cancelación) deberá notificarse de inmediato vía WhatsApp. Una vez que el platillo ha ingresado al proceso de cocción o despacho, no se admitirán cancelaciones totales.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  5. Formas de Pago
                </h4>
                <p>
                  Aceptamos pago en efectivo en mostrador y al repartidor en entrega a domicilio, así como transferencias bancarias directas informadas a través del chat de atención.
                </p>
              </section>
            </div>
          )}

          {/* 3. POLÍTICA DE COOKIES Y ALMACENAMIENTO */}
          {activeDoc === 'cookies' && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  1. ¿Qué son las Cookies y el Almacenamiento Local?
                </h4>
                <p>
                  Las cookies y las herramientas de almacenamiento web (como <code>localStorage</code> y <code>sessionStorage</code>) son pequeños archivos y registros que se guardan en su dispositivo para recordar sus preferencias de navegación y permitir una experiencia fluida y rápida.
                </p>
              </section>

              <section className="space-y-3">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  2. Tecnologías y Cookies Utilizadas en El Buen Servir
                </h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs uppercase text-gray-900 dark:text-white">Cookies y Almacenamiento Esencial</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase">Requerido</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Permiten recordar el modo oscuro/claro seleccionado, el estado del pedido actual y la navegación del menú digital. Sin estas tecnologías, el sitio no puede funcionar adecuadamente.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs uppercase text-gray-900 dark:text-white">Funcionalidad PWA (App Instalable)</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-400 font-bold text-[10px] uppercase">Funcional</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Almacena el registro del Service Worker en su dispositivo para cargar el menú instantáneamente sin consumo excesivo de datos móviles y saber si ya instaló la aplicación.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs uppercase text-gray-900 dark:text-white">Cero Rastreo Publicitario Invasivo</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase">Privado</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <strong>No utilizamos cookies de seguimiento entre sitios ni píxeles publicitarios invasivos</strong>. Su visita a nuestro menú es totalmente privada.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  3. Cómo Administrar o Desactivar las Cookies
                </h4>
                <p>
                  Usted puede configurar o borrar en cualquier momento las cookies y datos locales almacenados desde las opciones de seguridad de su navegador web (Google Chrome, Safari, Mozilla Firefox, Microsoft Edge o navegadores móviles). Tenga en cuenta que al borrarlas, sus preferencias de modo visual o carrito de pedidos se restablecerán.
                </p>
              </section>
            </div>
          )}

          {/* Contact Box */}
          <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-black text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                ¿Tienes dudas sobre nuestras políticas?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estamos a tu disposición en Teziutlán, Puebla o por vía telefónica.
              </p>
            </div>
            <a
              href="https://wa.me/522311808272"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar por WhatsApp</span>
            </a>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60 flex justify-end shrink-0">
          <button
            onClick={handleClose}
            className="py-3.5 px-8 bg-gray-900 dark:bg-primary-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg cursor-pointer"
          >
            Aceptar y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default LegalModal;
