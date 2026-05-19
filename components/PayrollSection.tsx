
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Plus, 
  History, 
  CreditCard, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Wallet,
  Receipt,
  Download,
  X,
  Smartphone
} from 'lucide-react';
import { Staff, PayrollEntry, Loan, PayrollPeriod, StaffRole } from '../types';

interface PayrollSectionProps {
  staff: Staff[];
  payrollEntries: PayrollEntry[];
  setPayrollEntries: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
  loans: Loan[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
}

export const PayrollSection: React.FC<PayrollSectionProps> = ({
  staff,
  payrollEntries,
  setPayrollEntries,
  loans,
  setLoans
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'loans' | 'history'>('current');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for new entry
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [period, setPeriod] = useState<PayrollPeriod>('semanal');
  const [baseSalary, setBaseSalary] = useState('');
  const [bonuses, setBonuses] = useState('');
  const [deductions, setDeductions] = useState('');
  const [notes, setNotes] = useState('');

  // Form states for new loan
  const [loanStaffId, setLoanStaffId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanInstallment, setLoanInstallment] = useState('');
  const [loanReason, setLoanReason] = useState('');

  const stats = useMemo(() => {
    const totalPaid = payrollEntries.filter(e => e.status === 'paid').reduce((acc, curr) => acc + curr.netPay, 0);
    const pendingPaid = payrollEntries.filter(e => e.status === 'pending').reduce((acc, curr) => acc + curr.netPay, 0);
    const activeLoans = loans.filter(l => l.status === 'active').reduce((acc, curr) => acc + curr.remainingBalance, 0);
    return { totalPaid, pendingPaid, activeLoans };
  }, [payrollEntries, loans]);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const staffMember = staff.find(s => s.id === selectedStaffId);
    if (!staffMember) return;

    const activeLoan = loans.find(l => l.staffId === staffMember.id && l.status === 'active');
    const loanDed = activeLoan ? Math.min(activeLoan.monthlyInstallment, activeLoan.remainingBalance) : 0;

    const base = parseFloat(baseSalary) || 0;
    const bon = parseFloat(bonuses) || 0;
    const ded = parseFloat(deductions) || 0;
    const net = base + bon - ded - loanDed;

    const newEntry: PayrollEntry = {
      id: `pay-${Date.now()}`,
      staffId: staffMember.id,
      staffName: staffMember.name,
      staffRole: staffMember.role,
      period,
      baseSalary: base,
      bonuses: bon,
      deductions: ded,
      loanDeduction: loanDed,
      netPay: net,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes
    };

    setPayrollEntries(prev => [newEntry, ...prev]);
    setIsAddingEntry(false);
    resetEntryForm();
  };

  const handleMarkAsPaid = (entryId: string) => {
    const entry = payrollEntries.find(e => e.id === entryId);
    if (!entry) return;

    setPayrollEntries(prev => prev.map(e => 
      e.id === entryId ? { ...e, status: 'paid', paidAt: new Date().toISOString() } : e
    ));

    // Deduct from loan balance if there was a loan deduction
    if (entry.loanDeduction > 0) {
      setLoans(prev => prev.map(l => {
        if (l.staffId === entry.staffId && l.status === 'active') {
          const newBalance = l.remainingBalance - entry.loanDeduction;
          return {
            ...l,
            remainingBalance: newBalance,
            status: newBalance <= 0 ? 'paid' : 'active',
            payments: [...l.payments, {
              id: `lp-${Date.now()}`,
              amount: entry.loanDeduction,
              paidAt: new Date().toISOString(),
              payrollId: entry.id
            }]
          };
        }
        return l;
      }));
    }
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const staffMember = staff.find(s => s.id === loanStaffId);
    if (!staffMember) return;

    const amount = parseFloat(loanAmount) || 0;
    const installment = parseFloat(loanInstallment) || 0;

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      staffId: staffMember.id,
      staffName: staffMember.name,
      amount,
      remainingBalance: amount,
      monthlyInstallment: installment,
      reason: loanReason,
      status: 'active',
      createdAt: new Date().toISOString(),
      payments: []
    };

    setLoans(prev => [newLoan, ...prev]);
    setIsAddingLoan(false);
    resetLoanForm();
  };

  const resetEntryForm = () => {
    setSelectedStaffId('');
    setBaseSalary('');
    setBonuses('');
    setDeductions('');
    setNotes('');
  };

  const resetLoanForm = () => {
    setLoanStaffId('');
    setLoanAmount('');
    setLoanInstallment('');
    setLoanReason('');
  };

  const filteredEntries = payrollEntries.filter(e => 
    e.staffName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoans = loans.filter(l => 
    l.staffName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Gestión de Nóminas</h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Control de pagos, bonos y préstamos</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pagado</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">${stats.totalPaid.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center text-amber-500">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Préstamos Activos</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">${stats.activeLoans.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-gray-800 p-4 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex bg-gray-50 dark:bg-gray-900 p-2 rounded-3xl w-full md:w-auto">
            {[
              { id: 'current', label: 'Nómina Actual', icon: DollarSign },
              { id: 'loans', label: 'Préstamos', icon: CreditCard },
              { id: 'history', label: 'Historial', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm scale-105' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
            <button
              onClick={() => activeTab === 'loans' ? setIsAddingLoan(true) : setIsAddingEntry(true)}
              title={activeTab === 'loans' ? "Nuevo Préstamo" : "Nuevo Pago"}
              className="p-4 bg-primary-500 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'current' && (
            <div className="bg-white dark:bg-gray-800 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Empleado</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Periodo</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sueldo Base</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deducción Préstamo</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pago Neto</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {filteredEntries.filter(e => e.status === 'pending').map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-500 font-bold">
                              {entry.staffName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{entry.staffName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{entry.staffRole}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-[9px] font-black uppercase text-gray-500">{entry.period}</span>
                        </td>
                        <td className="px-8 py-6 font-black text-sm text-gray-900 dark:text-white">${entry.baseSalary.toFixed(2)}</td>
                        <td className="px-8 py-6 font-black text-sm text-red-500">-${entry.loanDeduction.toFixed(2)}</td>
                        <td className="px-8 py-6 font-black text-lg text-emerald-500">${entry.netPay.toFixed(2)}</td>
                        <td className="px-8 py-6">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Pendiente
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => handleMarkAsPaid(entry.id)}
                            className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            Pagar Ahora
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEntries.filter(e => e.status === 'pending').length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Receipt className="w-10 h-10" />
                          </div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase">No hay pagos pendientes</p>
                          <p className="text-xs text-gray-400 mt-1">Todas las nóminas actuales han sido procesadas.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLoans.map(loan => (
                <div key={loan.id} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 group hover:shadow-xl transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
                  
                  <div className="flex justify-between items-start relative">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{loan.staffName}</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Préstamo Activo</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${loan.status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {loan.status === 'active' ? 'En Curso' : 'Pagado'}
                    </div>
                  </div>

                  <div className="space-y-4 relative">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">${loan.remainingBalance.toFixed(2)}</p>
                    </div>
                    
                    <div className="w-full bg-gray-100 dark:bg-gray-900 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-1000" 
                        ref={(el) => { if (el) el.style.width = `${((loan.amount - loan.remainingBalance) / loan.amount) * 100}%`; }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Monto Inicial</p>
                        <p className="text-sm font-black dark:text-white">${loan.amount.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Cuota de Pago</p>
                        <p className="text-sm font-black text-primary-500">${loan.monthlyInstallment.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Motivo</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-bold leading-relaxed">{loan.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredLoans.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-[48px] border-2 border-dashed border-gray-100 dark:border-gray-700">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Wallet className="w-10 h-10" />
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase">Sin préstamos activos</p>
                  <p className="text-xs text-gray-400 mt-1">No hay registros de préstamos por cobrar.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white dark:bg-gray-800 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Fecha</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Empleado</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Monto Pagado</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deducciones</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {filteredEntries.filter(e => e.status === 'paid').map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{new Date(entry.paidAt!).toLocaleDateString()}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(entry.paidAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{entry.staffName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{entry.staffRole}</p>
                        </td>
                        <td className="px-8 py-6 font-black text-sm text-emerald-500">${entry.netPay.toFixed(2)}</td>
                        <td className="px-8 py-6 font-black text-sm text-gray-500">${(entry.deductions + entry.loanDeduction).toFixed(2)}</td>
                        <td className="px-8 py-6">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" /> Pagado
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            title="Descargar Comprobante"
                            className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-400 rounded-xl hover:text-primary-500 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEntries.filter(e => e.status === 'paid').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <History className="w-10 h-10" />
                          </div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase">Historial vacío</p>
                          <p className="text-xs text-gray-400 mt-1">No se han registrado pagos aún.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Payroll Entry */}
      {isAddingEntry && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAddingEntry(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Nuevo Pago</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Periodo Actual</p>
              </div>
              <button onClick={() => setIsAddingEntry(false)} title="Cerrar" className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateEntry} className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label htmlFor="payroll-staff" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Empleado</label>
                <select
                  id="payroll-staff"
                  title="Seleccionar empleado"
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                >
                  <option value="">Seleccionar empleado...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="payroll-period" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Periodo</label>
                  <select
                    id="payroll-period"
                    title="Seleccionar periodo"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PayrollPeriod)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Sueldo Base ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Bonos ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bonuses}
                    onChange={(e) => setBonuses(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Deducciones ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-bold text-sm outline-none transition-all h-24 resize-none"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-primary-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Generar Recibo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Loan */}
      {isAddingLoan && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAddingLoan(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Nuevo Préstamo</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Registro de crédito</p>
              </div>
              <button onClick={() => setIsAddingLoan(false)} title="Cerrar" className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateLoan} className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label htmlFor="loan-staff" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Empleado</label>
                <select
                  id="loan-staff"
                  title="Seleccionar empleado"
                  required
                  value={loanStaffId}
                  onChange={(e) => setLoanStaffId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                >
                  <option value="">Seleccionar empleado...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Monto Total ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Cuota de Pago ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={loanInstallment}
                    onChange={(e) => setLoanInstallment(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-black text-sm outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Motivo del Préstamo</label>
                <textarea
                  required
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl px-6 py-4 font-bold text-sm outline-none transition-all h-32 resize-none"
                  placeholder="Detalles del por qué se otorga el préstamo..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-amber-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Registrar Préstamo
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
