import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import { learnRf, fetchRfStatus, continueRf } from '@/api/commands';
import { createCode } from '@/api/codes';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { Button } from '@/components/ui/Button';
import { addToast } from '@/components/ui/Toast';
import type { Device } from '@/types';

type Step = 0 | 1 | 2 | 3; // 0=idle, 1=holding, 2=pressing, 3=done

export function RfLearnTab({ device }: { device: Device }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(0);
  const [code, setCode] = useState('');
  const [codeName, setCodeName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [shortCapture, setShortCapture] = useState<{ bytes: number; minBytes: number } | null>(null);
  const [capturedIr, setCapturedIr] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // seconds remaining before "press now"
  const [holdSeconds, setHoldSeconds] = useState(0); // elapsed seconds while holding in step 1

  const rfQuery = useQuery({
    queryKey: ['rf-status'],
    queryFn: fetchRfStatus,
    enabled: isLearning && step < 3,
    refetchInterval: 1000,
    // Never serve a cached status from a previous run — a stale "True" would
    // skip the wizard straight to step 2 while the backend is still sweeping.
    gcTime: 0,
    staleTime: 0,
  });

  const learnMut = useMutation({
    mutationFn: () => learnRf(device.ip, device.mac, device.type),
    onMutate: () => { setIsLearning(true); setStep(1); setShortCapture(null); setCapturedIr(false); },
    onSuccess: data => {
      setIsLearning(false);
      if (data.success === 1) {
        setCode(data.data);
        setStep(3);
      } else if (data.error === 'captured_ir') {
        setCapturedIr(true);
        setStep(0);
      } else if (data.error === 'too_short') {
        setShortCapture({ bytes: data.bytes ?? 0, minBytes: data.min_bytes ?? 30 });
        setStep(0);
      } else {
        addToast('error', data.data || 'RF learn failed');
        setStep(0);
      }
    },
    onError: () => {
      addToast('error', 'RF learn failed');
      setIsLearning(false);
      setStep(0);
    },
  });

  const continueMut = useMutation({
    mutationFn: continueRf,
  });

  useEffect(() => {
    if (rfQuery.data?._rf_sweep_status === 'True' && step === 1) {
      setStep(2);
      continueMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfQuery.data, step]);

  // Count up 1..2..3… while the user holds the button in step 1
  useEffect(() => {
    if (step !== 1) { setHoldSeconds(0); return; }
    setHoldSeconds(1);
    const id = setInterval(() => setHoldSeconds(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [step]);

  // Countdown from 3 → 0 when step 2 activates, then stay at 0 ("press now")
  useEffect(() => {
    if (step !== 2) { setCountdown(null); return; }
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const saveMut = useMutation({
    mutationFn: () => createCode({ CodeType: 'RF', CodeName: codeName, Code: code }),
    onSuccess: () => {
      addToast('success', `Saved "${codeName}"`);
      qc.invalidateQueries({ queryKey: ['codes'] });
      setCode('');
      setCodeName('');
      setStep(0);
    },
    onError: () => addToast('error', 'Failed to save code'),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const step2Desc = step === 2 && countdown !== null && countdown > 0
    ? `🖐 RELEASE the button now! Arming receiver… ${countdown} s`
    : '✅ Now press the button once (a normal short press). Keep remote 10–20 cm from Broadlink.';

  const step1Desc = step === 1
    ? `✊ Keep holding… ${Array.from({ length: Math.min(holdSeconds, 5) }, (_, i) => i + 1).join('..')}${holdSeconds > 5 ? '..' + holdSeconds : ''}`
    : 'Hold the RF button until the frequency is found (3–5 s).';

  const RF_STEPS = [
    { label: 'Hold button', desc: step1Desc },
    { label: 'Release, then press once', desc: step2Desc },
    { label: 'Save code', desc: 'Name and save the captured RF code.' },
  ];

  const statusMsg =
    step === 1 ? `Hold the RF button until frequency is found… ${holdSeconds} s` :
    step === 2 && countdown !== null && countdown > 0
               ? `Frequency found — RELEASE the button! (${countdown} s)` :
    step === 2 ? 'Now press the button once.' :
                 'RF code captured.';

  return (
    <div className="flex flex-col gap-3 p-4">
      {capturedIr && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-red-400">IR signal captured — expected RF</span>
          </div>
          <p className="text-xs text-red-200/80">
            The Broadlink captured an infrared code instead of a 433 MHz RF signal. The most common cause: the button was <strong>held continuously</strong> from step 1 — the receiver needs to see a <strong>new</strong> press to detect the RF packet.
          </p>
          <ul className="flex flex-col gap-1 text-xs text-red-200/80 list-none pl-0">
            <li>• When the frequency is found, <strong>release the button completely</strong></li>
            <li>• Wait for the countdown, then <strong>press it once</strong> (normal short press)</li>
            <li>• Keep the remote 10–20 cm from the Broadlink</li>
          </ul>
        </div>
      )}

      {shortCapture && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-400">Signal too short</span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
              {shortCapture.bytes} / {shortCapture.minBytes} bytes
            </span>
          </div>
          <ul className="flex flex-col gap-1 text-xs text-amber-200/80 list-none pl-0">
            <li>• Move the remote <strong>10–20 cm</strong> from the Broadlink receiver</li>
            <li>• At step 2, press the button <strong>once, firmly</strong> — a full normal press, not a light tap</li>
            <li>• Avoid other RF sources nearby (Wi-Fi routers, microwaves)</li>
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {RF_STEPS.map((s, i) => {
          const done   = step > i + 1;
          const active = step === i + 1;
          return (
            <div key={i} className={`flex gap-2.5 items-start p-2.5 rounded-lg border transition-all
              ${done   ? 'bg-emerald-500/5 border-emerald-500/20'
              : active ? 'bg-violet-500/5 border-violet-500/20'
              :          'border-slate-800 dark:border-slate-200 opacity-40'}`}>
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                ${done   ? 'bg-emerald-500 text-white'
                : active ? 'bg-violet-500 text-white'
                :          'bg-slate-800 dark:bg-slate-200 text-slate-500'}`}>
                {done ? '✓' : i + 1}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200 dark:text-slate-800">{s.label}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {step > 0 && (
        <StatusBanner
          status={step === 3 ? 'success' : 'rf'}
          message={statusMsg}
        />
      )}

      {step === 3 && (
        <>
          <div className="flex gap-2">
            <input readOnly value={code}
              className="flex-1 bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 dark:text-slate-700 outline-none" />
            <button onClick={copy}
              className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
          <div className="flex gap-2 items-center bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-200 rounded-lg px-3 py-2">
            <input
              value={codeName}
              onChange={e => setCodeName(e.target.value)}
              placeholder="e.g. Gate Open"
              className="flex-1 bg-transparent text-xs text-slate-300 dark:text-slate-700 outline-none"
            />
            <Button size="sm" variant="primary" disabled={!codeName || saveMut.isPending} onClick={() => saveMut.mutate()}>
              Save
            </Button>
          </div>
        </>
      )}

      <div className="flex gap-2 flex-wrap">
        {step === 0 && (
          <Button size="lg" variant="rf" className="w-full flex-col justify-center font-bold gap-0.5"
            onClick={() => learnMut.mutate()} disabled={learnMut.isPending}>
            <span>{(shortCapture || capturedIr) ? 'Try Again' : 'Learn RF'}</span>
            {!shortCapture && !capturedIr && (
              <span className="text-xs font-normal opacity-60">Press to start the RF wizard</span>
            )}
          </Button>
        )}
        {step > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setStep(0); setCode(''); setIsLearning(false); setShortCapture(null); setCapturedIr(false); }}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
