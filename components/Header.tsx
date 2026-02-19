
import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, Eye, Bell, Clock, Calendar,
  X, CheckCircle2, AlertCircle, Info, Trash2
} from 'lucide-react';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

interface HeaderProps {
  onOpenSidebar: () => void;
  onPreview?: () => void;
  title?: string;
  isFullScreen?: boolean;
  currentTime?: Date;
  notifications?: Notification[];
  onClearNotifications?: () => void;
  onRemoveNotification?: (id: number) => void;
}

const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onPreview,
  title = "Menu Editor",
  isFullScreen = false,
  currentTime = new Date(),
  notifications = [],
  onClearNotifications,
  onRemoveNotification
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const timeSince = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors">
      <div className="flex items-center">
        <button
          title="Abrir menú"
          onClick={onOpenSidebar}
          className={`${!isFullScreen ? 'lg:hidden' : ''} p-2.5 mr-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors`}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-3 md:space-x-8">
        {/* Clock & Date - Hidden on small mobile */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <div className="flex items-center text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">
            <Clock className="w-4 h-4 mr-2 text-primary-500" />
            {formatClock(currentTime)}
          </div>
          <div className="flex items-center text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
            <Calendar className="w-3 h-3 mr-1.5 opacity-40" />
            {formatDate(currentTime)}
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
          {title === "Menu" && (
            <button
              onClick={onPreview}
              className="hidden md:flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
            >
              <Eye className="w-4 h-4 mr-2 text-gray-400" />
              Previsualizar
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-3 rounded-xl transition-all relative ${showNotifications ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Notificaciones"
            >
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
              )}
            </button>

            {/* Dropdown Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px] shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-5 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500">Notificaciones</h3>
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      onClick={onClearNotifications}
                      className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 tracking-widest flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                        <Bell className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-400">Sin notificaciones nuevas</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group relative">
                          <div className="flex gap-4">
                            <div className={`p-2.5 rounded-xl h-fit ${notif.type === 'success' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' :
                                notif.type === 'info' ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10' :
                                  'bg-red-50 text-red-500 dark:bg-red-500/10'
                              }`}>
                              {notif.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                                notif.type === 'info' ? <Info className="w-4 h-4" /> :
                                  <AlertCircle className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 pr-6">
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">
                                {notif.message}
                              </p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center">
                                <Clock className="w-2.5 h-2.5 mr-1" />
                                {timeSince(notif.timestamp)}
                              </p>
                            </div>
                            <button
                              onClick={() => onRemoveNotification?.(notif.id)}
                              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors p-1"
                              title="Eliminar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 5 && (
                  <div className="p-4 bg-gray-50 dark:bg-black/20 text-center border-t border-gray-50 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fin del historial</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
