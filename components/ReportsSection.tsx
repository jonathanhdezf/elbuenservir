
import React, { useMemo, useState } from 'react';
import {
    BarChart3, TrendingUp, DollarSign, ShoppingBag,
    Calendar, CreditCard, ChevronDown, Award,
    ArrowUpRight, ArrowDownRight, Users, Bike
} from 'lucide-react';
import { Order, OrderItem, DeliveryDriver, Customer, MenuItem } from '../types';

interface ReportsSectionProps {
    orders: Order[];
    drivers: DeliveryDriver[];
    customers: Customer[];
    menuItems: MenuItem[];
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

const ReportsSection: React.FC<ReportsSectionProps> = ({ orders, drivers, customers, menuItems }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('week');

    // Filter orders based on time range
    const filteredOrders = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        return orders.filter(order => {
            const orderDate = new Date(order.createdAt).getTime();
            switch (timeRange) {
                case 'today': return orderDate >= startOfDay;
                case 'week': return orderDate >= startOfWeek;
                case 'month': return orderDate >= startOfMonth;
                case 'all': return true;
                default: return true;
            }
        });
    }, [orders, timeRange]);

    // KPIs
    const totalSales = useMemo(() => filteredOrders.reduce((acc, order) => acc + (order.total || 0), 0), [filteredOrders]);
    const totalOrders = filteredOrders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Completed vs Cancelled
    const completedOrders = filteredOrders.filter(o => ['delivered', 'ready', 'picked_up'].includes(o.status)).length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Previous Period Comparison (Simple simulation for demo dynamic)
    // In a real app, calculate actual previous period
    const growth = useMemo(() => {
        return {
            sales: Math.random() * 20 - 5, // Random growth between -5% and 15%
            orders: Math.random() * 15 - 2,
        };
    }, [timeRange]); // Recalculate only when time range changes to simulate fetching

    // Top Products
    const topProducts = useMemo(() => {
        const productCounts: Record<string, { name: string, quantity: number, sales: number }> = {};

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (!productCounts[item.id]) {
                    productCounts[item.id] = { name: item.name, quantity: 0, sales: 0 };
                }
                productCounts[item.id].quantity += item.quantity;
                productCounts[item.id].sales += item.price * item.quantity;
            });
        });

        return Object.values(productCounts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [filteredOrders]);

    // Sales by Payment Method
    const salesByMethod = useMemo(() => {
        const counts: Record<string, number> = { efectivo: 0, tarjeta: 0, transferencia: 0 };
        filteredOrders.forEach(o => {
            if (o.paymentMethod && counts[o.paymentMethod] !== undefined) {
                counts[o.paymentMethod]++;
            }
        });
        return counts;
    }, [filteredOrders]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Reporte de Ventas</h2>
                    <p className="text-gray-400 dark:text-gray-500 font-medium text-sm mt-1">
                        Resumen ejecutivo del rendimiento del negocio
                    </p>
                </div>

                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    {(['today', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`
                px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                ${timeRange === range
                                    ? 'bg-gray-900 dark:bg-primary-500 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
                        >
                            {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Histórico'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Ventas Totales"
                    value={`$${totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    color="emerald"
                    trend={growth.sales}
                />
                <KPICard
                    title="Pedidos Totales"
                    value={totalOrders.toString()}
                    icon={ShoppingBag}
                    color="blue"
                    trend={growth.orders}
                />
                <KPICard
                    title="Ticket Promedio"
                    value={`$${averageTicket.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                    icon={TrendingUp}
                    color="purple"
                />
                <KPICard
                    title="Tasa Completado"
                    value={`${completionRate.toFixed(1)}%`}
                    icon={Award}
                    color="amber"
                    subtitle={`${completedOrders} de ${totalOrders}`}
                />
            </div>

            {/* Charts & Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Sales Chart (Simplified Simulation) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Tendencia de Ventas</h4>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Simulated Histogram */}
                    <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                        {[...Array(12)].map((_, i) => {
                            const height = 20 + Math.random() * 80; // Random height 20-100%
                            const isMax = height > 90;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group">
                                    <div
                                        className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-80 relative ${isMax ? 'bg-primary-500' : 'bg-gray-100 dark:bg-gray-700'} h-[var(--bar-height)]`}
                                        style={{ '--bar-height': `${height}%` } as React.CSSProperties}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                            ${(height * 100).toFixed(0)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 dark:border-gray-700 pt-4">
                        <span>Inicio Periodo</span>
                        <span>Fin Periodo</span>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-8">Métodos de Pago</h4>
                    <div className="space-y-6">
                        {Object.entries(salesByMethod).map(([method, count]: [string, number]) => {
                            const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                            return (
                                <div key={method} className="group">
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="capitalize text-gray-600 dark:text-gray-300">{method}</span>
                                        <span className="text-gray-900 dark:text-white">{percentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${method === 'efectivo' ? 'bg-emerald-500' :
                                                method === 'tarjeta' ? 'bg-blue-500' : 'bg-purple-500'
                                                } w-[var(--bar-width)]`}
                                            style={{ '--bar-width': `${percentage}%` } as React.CSSProperties}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-12 bg-primary-50 dark:bg-primary-900/10 p-6 rounded-2xl flex items-center space-x-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-primary-500 shadow-sm">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">Predominante</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white capitalize">
                                {Object.entries(salesByMethod).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0]?.[0] || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                    <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Platillos Estrella</h4>
                    <button className="text-primary-500 text-xs font-black uppercase tracking-widest hover:underline">Ver Menú Completo</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                <th className="text-left py-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Producto</th>
                                <th className="text-center py-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendidos</th>
                                <th className="text-right py-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ingresos</th>
                                <th className="text-right py-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {topProducts.map((product, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-4">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-black text-gray-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                                #{idx + 1}
                                            </span>
                                            <span className="font-bold text-gray-900 dark:text-white">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-gray-600 dark:text-gray-300">
                                        {product.quantity}
                                    </td>
                                    <td className="py-4 px-4 text-right font-black text-gray-900 dark:text-white">
                                        ${product.sales.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">
                                            <ArrowUpRight className="w-3 h-3 mr-1" />
                                            Hot
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {topProducts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">No hay datos suficientes</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Start Helper Components
const KPICard = ({ title, value, icon: Icon, color, trend, subtitle }: any) => {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10',
        blue: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10',
        purple: 'bg-purple-50 text-purple-500 dark:bg-purple-500/10',
        amber: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10',
    }[color as string] || 'bg-gray-50 text-gray-500';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[24px] shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3.5 rounded-2xl ${colorClasses} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-gray-400 dark:text-gray-500 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium">{subtitle}</p>}
            </div>
        </div>
    );
};

export default ReportsSection;
