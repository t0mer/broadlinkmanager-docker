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

  const rfQuery = useQuery({
    queryKey: ['rf-status'],
    queryFn: fetchRfStatus,
    enabled: isLearning && step < 3,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (rfQuery.data?._rf_sweep_status === 'True' && step === 1) {
      setStep(2);
    }
  }, [rfQuery.data, step]);

  const learnMut = useMutation({
    mutationFn: () => learnRf(device.ip, device.mac, device.type),
    onMutate: () => { setIsLearning(true); setStep(1); },
    onSuccess: data => {
      setIsLearning(false);
      if (data.success === 1) {
        setCode(data.data);
        setStep(3);
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
    onSuccess: () => setStep(2),
  });

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

  const RF_STEPS = [
    { label: 'Hold button', desc: 'Hold the RF button until device sweeps frequencies.' },
    { label: 'Press button once', desc: 'Press the same button once to capture the exact code.' },
    { label: 'Save code', desc: 'Name and save the captured RF code.' },
  ];

  const statusMsg =
    step === 0 ? 'Click "Learn RF" to start.' :
    step === 1 ? 'Hold the RF button until frequency is found…' :
    step === 2 ? 'Press the button once to capture.' :
                 'RF code captured.';

  return (
    <div className="flex flex-col gap-3 p-4">
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

      <StatusBanner
        status={step === 0 ? 'idle' : step === 3 ? 'success' : 'rf'}
        message={statusMsg}
      />

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
          <Button size="sm" variant="rf" onClick={() => learnMut.mutate()} disabled={learnMut.isPending}>
            Learn RF
          </Button>
        )}
        {step === 2 && (
          <Button size="sm" variant="rf" onClick={() => continueMut.mutate()} disabled={continueMut.isPending}>
            Continue Sweep
          </Button>
        )}
        {step > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setStep(0); setCode(''); setIsLearning(false); }}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
