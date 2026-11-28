import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ScanBarcode,
  Keyboard,
  CheckCircle,
  AlertCircle,
  Camera,
  RefreshCw,
  ShieldCheck,
  Loader2,
  User,
  Key,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { BrowserMultiFormatReader, BrowserCodeReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Order, Staff, StaffRole } from '../types';
import { extractOrderCodeFromScan, doesOrderCodeMatch } from '../utils/orderVerification';
import { soundManager } from '../utils/soundManager';

interface OrderDeliveryVerificationModalProps {
  isOpen: boolean;
  order: Order | null;
  staff: Staff[];
  onClose: () => void;
  onVerified: (order: Order, deliveredBy: Staff) => void;
}

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Administrador',
  cashier: 'Cajero(a)',
  waiter: 'Mesero(a)',
  cook: 'Cocinero(a)',
  driver: 'Repartidor',
};

export const OrderDeliveryVerificationModal: React.FC<OrderDeliveryVerificationModalProps> = ({
  isOpen,
  order,
  staff,
  onClose,
  onVerified
}) => {
  const [mode, setMode] = useState<'manual' | 'camera'>('manual');
  const [orderInput, setOrderInput] = useState('');
  const [isCodeScannedOk, setIsCodeScannedOk] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [lastScannedPreview, setLastScannedPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastMismatchRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const hasVerifiedRef = useRef(false);
  const credentialsRef = useRef({ staffId: '', password: '' });

  const selectableStaff = React.useMemo(() => {
    const active = staff.filter((s) => s.status === 'active');
    return active.length > 0 ? active : staff;
  }, [staff]);

  useEffect(() => {
    credentialsRef.current = { staffId: selectedStaffId, password: staffPassword };
  }, [selectedStaffId, staffPassword]);

  const stopCamera = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    } catch {
      // ignore stop errors
    }
    try {
      if (videoRef.current) {
        BrowserCodeReader.cleanVideoSource(videoRef.current);
      }
      BrowserCodeReader.releaseAllStreams();
    } catch {
      // ignore cleanup errors
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setMode('manual');
      setOrderInput('');
      setIsCodeScannedOk(false);
      setSelectedStaffId('');
      setStaffPassword('');
      setShowPassword(false);
      setError(null);
      setCameraError(null);
      setLastScannedPreview(null);
      hasVerifiedRef.current = false;
      return;
    }

    setOrderInput('');
    setIsCodeScannedOk(false);
    setSelectedStaffId('');
    setStaffPassword('');
    setShowPassword(false);
    setError(null);
    setCameraError(null);
    setLastScannedPreview(null);
    hasVerifiedRef.current = false;
  }, [isOpen, order?.id]);

  const validateStaffCredentials = (staffId: string, pwd: string): { member: Staff | null; errorMsg: string | null } => {
    if (!staffId) {
      return { member: null, errorMsg: 'Selecciona el usuario que realiza la entrega.' };
    }
    const member = selectableStaff.find((s) => s.id === staffId) || staff.find((s) => s.id === staffId) || null;
    if (!member) {
      return { member: null, errorMsg: 'El usuario seleccionado no es válido.' };
    }
    if (!pwd.trim()) {
      return { member: null, errorMsg: 'Ingresa la clave de quien entrega.' };
    }
    if (member.password && pwd.trim() !== member.password) {
      return { member: null, errorMsg: 'La clave del usuario es incorrecta.' };
    }
    return { member, errorMsg: null };
  };

  useEffect(() => {
    if (!isOpen || mode !== 'camera' || !order) {
      stopCamera();
      return;
    }

    let cancelled = false;
    setCameraError(null);
    setIsStartingCamera(true);

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('CAMERA_UNSUPPORTED');
        }

        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_128,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.ITF,
          BarcodeFormat.CODABAR
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const codeReader = new BrowserMultiFormatReader(hints);

        let deviceList: MediaDeviceInfo[] = [];
        try {
          deviceList = await BrowserCodeReader.listVideoInputDevices();
          if (!cancelled) {
            setDevices(deviceList);
          }
        } catch {
          // Some browsers only expose device labels after permission prompt
        }

        if (cancelled || !videoRef.current) return;

        let targetDeviceId = selectedDeviceId;
        if (!targetDeviceId && deviceList.length > 0) {
          const backCam = deviceList.find((d) =>
            /back|rear|environment|trasera/i.test(d.label)
          );
          targetDeviceId = backCam?.deviceId;
        }

        const handleDecoded = (rawText: string) => {
          if (cancelled || hasVerifiedRef.current) return;
          const extracted = extractOrderCodeFromScan(rawText);
          if (!extracted) return;

          setLastScannedPreview(extracted);
          setOrderInput(extracted);

          if (doesOrderCodeMatch(extracted, order.id)) {
            setIsCodeScannedOk(true);
            const { staffId, password } = credentialsRef.current;
            const credCheck = validateStaffCredentials(staffId, password);

            if (credCheck.member && !credCheck.errorMsg) {
              hasVerifiedRef.current = true;
              setError(null);
              soundManager.play('confirm');
              stopCamera();
              onVerified(order, credCheck.member);
            } else {
              // Code verified; prompt user to complete credentials
              soundManager.play('click');
              stopCamera();
              setMode('manual');
              setError(credCheck.errorMsg || 'Código verificado. Ingresa usuario y clave para entregar.');
            }
          } else {
            setIsCodeScannedOk(false);
            const now = Date.now();
            if (
              lastMismatchRef.current.code !== extracted ||
              now - lastMismatchRef.current.time > 2000
            ) {
              lastMismatchRef.current = { code: extracted, time: now };
              setError(`El código escaneado (${extracted}) no coincide con este pedido.`);
              soundManager.play('error');
            }
          }
        };

        const controls = targetDeviceId
          ? await codeReader.decodeFromVideoDevice(
              targetDeviceId,
              videoRef.current,
              (result) => {
                if (result) handleDecoded(result.getText());
              }
            )
          : await codeReader.decodeFromConstraints(
              {
                video: {
                  facingMode: { ideal: 'environment' },
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }
              },
              videoRef.current,
              (result) => {
                if (result) handleDecoded(result.getText());
              }
            );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setIsStartingCamera(false);

        try {
          const refreshedDevices = await BrowserCodeReader.listVideoInputDevices();
          if (!cancelled) {
            setDevices(refreshedDevices);
          }
        } catch {
          // ignore
        }
      } catch (err: any) {
        if (cancelled) return;
        setIsStartingCamera(false);
        const msg = String(err?.name || err?.message || '');
        if (msg.includes('CAMERA_UNSUPPORTED')) {
          setCameraError('Este navegador no permite acceso a la cámara. Ingresa el número de orden manualmente.');
        } else if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setCameraError('Permiso de cámara denegado. Habilita la cámara en tu navegador o ingresa el número manualmente.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setCameraError('No se detectó una cámara disponible en este dispositivo.');
        } else {
          setCameraError('No se pudo iniciar la cámara. Intenta de nuevo o ingresa el número de orden manualmente.');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, mode, order?.id, selectedDeviceId]);

  if (!isOpen || !order) return null;

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!orderInput.trim()) {
      setError('Ingresa el número de la orden o escanea el código de barras del ticket.');
      soundManager.play('error');
      return;
    }

    if (!doesOrderCodeMatch(orderInput, order.id)) {
      setIsCodeScannedOk(false);
      setError('El número de orden no coincide con el ticket del cliente.');
      soundManager.play('error');
      return;
    }

    const credCheck = validateStaffCredentials(selectedStaffId, staffPassword);
    if (!credCheck.member || credCheck.errorMsg) {
      setError(credCheck.errorMsg || 'Usuario o clave inválidos.');
      soundManager.play('error');
      return;
    }

    hasVerifiedRef.current = true;
    setError(null);
    stopCamera();
    soundManager.play('confirm');
    onVerified(order, credCheck.member);
  };

  const handleSwitchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
    soundManager.play('click');
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a1118] rounded-3xl shadow-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Verificar Entrega
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {order.customerName} · ${order.total.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              aria-label="Cerrar"
              className="min-w-[44px] min-h-[44px] rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 rounded-2xl px-4 py-3">
            Valida el número de orden (manual o con código de barras) e identifica usuario y clave de quien entrega para dejar registro.
          </p>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('manual');
                setError(null);
                soundManager.play('click');
              }}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-white dark:bg-[#2a1c26] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>N.º de Orden</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('camera');
                setError(null);
                setCameraError(null);
                soundManager.play('click');
              }}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'camera'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <ScanBarcode className="w-4 h-4" />
              <span>Escanear Ticket</span>
            </button>
          </div>

          {/* Camera Barcode Scanner */}
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-gray-200 dark:border-white/10">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {isStartingCamera && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 text-white gap-2 p-4 text-center">
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                    <span className="text-xs font-semibold">Activando cámara...</span>
                  </div>
                )}

                {!isStartingCamera && !cameraError && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-[260px] h-28 rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.42)] relative overflow-hidden">
                      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400/90 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    </div>
                    <span className="mt-4 px-3 py-1 rounded-full bg-black/70 text-white text-[11px] font-semibold">
                      Apunta al código de barras o QR del ticket
                    </span>
                  </div>
                )}

                {devices.length > 1 && !cameraError && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    title="Cambiar cámara"
                    className="absolute top-3 right-3 min-h-[38px] px-3 rounded-xl bg-black/65 hover:bg-black/85 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Cambiar</span>
                  </button>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 text-center p-5 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-gray-200 leading-relaxed max-w-xs">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode('manual')}
                      className="px-4 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold cursor-pointer"
                    >
                      Ingresar manualmente
                    </button>
                  </div>
                )}
              </div>

              {lastScannedPreview && (
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-center tabular-nums">
                  Último código leído: <span className="font-bold text-gray-900 dark:text-white">{lastScannedPreview}</span>
                </div>
              )}
            </div>
          )}

          {/* Verification Form: Order Code + Staff Credentials */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* Step 1: Order Code */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="verify-order-input"
                  className="text-xs font-bold text-gray-600 dark:text-gray-300"
                >
                  1. Número de Orden / Folio del Ticket
                </label>
                {isCodeScannedOk && doesOrderCodeMatch(orderInput, order.id) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Escaneado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="verify-order-input"
                  autoFocus={mode === 'manual' && !isCodeScannedOk}
                  type="text"
                  value={orderInput}
                  onChange={(e) => {
                    setOrderInput(e.target.value);
                    setIsCodeScannedOk(false);
                    if (error) setError(null);
                  }}
                  placeholder="Ej. ORD-101 o 101"
                  className="flex-1 min-w-0 min-h-[48px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-emerald-500 rounded-2xl px-4 font-black text-base uppercase tracking-wider text-center outline-none transition-all text-gray-900 dark:text-white"
                />
                {mode === 'manual' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('camera');
                      setError(null);
                      soundManager.play('click');
                    }}
                    title="Abrir cámara para escanear código de barras"
                    aria-label="Abrir cámara para escanear código de barras"
                    className="min-w-[48px] min-h-[48px] rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <ScanBarcode className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Staff User & Password */}
            <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                2. Responsable de la entrega
              </span>

              <div>
                <label
                  htmlFor="delivery-staff-select"
                  className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1.5"
                >
                  Usuario
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="delivery-staff-select"
                    value={selectedStaffId}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full min-h-[46px] bg-white dark:bg-[#110a10] border border-gray-200 dark:border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-9 text-sm font-bold text-gray-900 dark:text-white appearance-none outline-none transition-all cursor-pointer"
                  >
                    <option value="">Seleccionar usuario...</option>
                    {selectableStaff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({ROLE_LABELS[member.role] || member.role})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="delivery-staff-password"
                  className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1.5"
                >
                  Clave
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="delivery-staff-password"
                    type={showPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => {
                      setStaffPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ingresa tu clave"
                    autoComplete="off"
                    className="w-full min-h-[46px] bg-white dark:bg-[#110a10] border border-gray-200 dark:border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-11 text-sm font-bold text-gray-900 dark:text-white outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                    className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center rounded-2xl flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="submit"
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar y Entregar Pedido</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="w-full min-h-[44px] text-gray-500 dark:text-gray-400 font-semibold text-xs hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
