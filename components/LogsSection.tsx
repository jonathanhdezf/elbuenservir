
import React, { useState } from 'react';
import {
    History,
    Search,
    Download,
    Trash2,
    Info,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Shield,
    Clock,
    Calendar,
    User
} from 'lucide-react';
import { SiteLog } from '../types';

interface LogsSectionProps {
    logs: SiteLog[];
    onClearLogs: () => void;
}

const TYPE_CONFIG = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Info' },
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Exito' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Aviso' },
    error: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', label: 'Error' },
    critical: { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Crítico' },
};

const LogsSection: React.FC<LogsSectionProps> = ({ logs, onClearLogs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<SiteLog['type'] | 'all'>('all');

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || log.type === filterType;

        return matchesSearch && matchesType;
    });

    const exportLogs = () => {
        const csv = [
            ['ID', 'Fecha', 'Usuario', 'Acción', 'Detalles', 'Tipo'].join(','),
            ...logs.map(log => [
                log.id,
                log.timestamp,
                log.user,
                log.action,
                `"${log.details.replace(/"/g, '""')}"`,
                log.type
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-elbuenservir-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none flex items-center gap-4">
                        <History className="w-10 h-10 text-primary-500" />
                        Logs del Sistema
                    </h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2 ml-14">Registro auditor de todos los movimientos</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportLogs}
                        className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-500 hover:border-primary-500 rounded-3xl transition-all shadow-sm"
                        title="Exportar logs a CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { if (confirm('¿Seguro que deseas limpiar todos los registros?')) onClearLogs(); }}
                        className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-500 rounded-3xl transition-all shadow-sm"
                        title="Limpiar registros"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters & Tools */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative group flex-1 w-full lg:w-auto">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="BUSCAR EN REGISTROS (Usuario, Acción, Detalles...)"
                        className="w-full pl-14 pr-6 py-5 bg-white dark:bg-gray-800 rounded-[32px] border-2 border-transparent focus:border-primary-500 outline-none shadow-sm transition-all text-sm font-bold placeholder:text-gray-300 uppercase tracking-wide"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap active:scale-95 ${filterType === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                    >
                        Todos
                    </button>
                    {(Object.entries(TYPE_CONFIG) as [SiteLog['type'], typeof TYPE_CONFIG.info][]).map(([type, cfg]) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap active:scale-95 flex items-center gap-2 ${filterType === type ? `${cfg.bg} ${cfg.color} border-current shadow-lg` : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                        >
                            <cfg.icon className="w-4 h-4" />
                            {cfg.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Table/List */}
            <div className="bg-white dark:bg-gray-800 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Timestamp</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Tipo</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Usuario</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Acción</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Detalles</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filteredLogs.map((log) => {
                                const date = new Date(log.timestamp);
                                const tCfg = TYPE_CONFIG[log.type];
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mt-0.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tCfg.bg} ${tCfg.color}`}>
                                                <tCfg.icon className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{tCfg.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-black text-gray-900 dark:text-white uppercase truncate max-w-[150px]">{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{log.action}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm font-medium">{log.details}</p>
                                        </td>
                                        <td className="px-10 py-6 text-right" title={log.id}>
                                            <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest group-hover:text-primary-400 transition-colors">#{log.id.slice(-6)}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-10 py-32 text-center">
                                        <div className="max-w-xs mx-auto flex flex-col items-center">
                                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[32px] flex items-center justify-center mb-6">
                                                <History className="w-10 h-10 text-gray-200 dark:text-gray-700" />
                                            </div>
                                            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No se encontraron registros</p>
                                            <p className="text-[10px] text-gray-300 dark:text-gray-500 font-medium mt-2">Intenta ajustar los filtros de búsqueda o categoría.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LogsSection;
