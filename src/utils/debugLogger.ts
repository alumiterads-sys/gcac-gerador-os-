export interface DebugLog {
  timestamp: string;
  type: 'error' | 'warn' | 'info' | 'auth';
  message: string;
  stack?: string;
}

const MAX_LOGS = 100;
let logs: DebugLog[] = [];
let listeners: (() => void)[] = [];

export function getDebugLogs() {
  return logs;
}

export function subscribeToLogs(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function clearDebugLogs() {
  logs = [];
  try {
    sessionStorage.removeItem('gcac_debug_logs');
  } catch {}
  listeners.forEach(l => l());
}

export function addDebugLog(type: DebugLog['type'], message: string, stack?: string) {
  const newLog: DebugLog = {
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    stack
  };
  logs = [newLog, ...logs].slice(0, MAX_LOGS);
  listeners.forEach(l => l());
  
  try {
    sessionStorage.setItem('gcac_debug_logs', JSON.stringify(logs));
  } catch {}
}

// Load initial logs
try {
  const saved = sessionStorage.getItem('gcac_debug_logs');
  if (saved) logs = JSON.parse(saved);
} catch {}

if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    addDebugLog('error', `Erro Global: ${message} em ${source}:${lineno}:${colno}`, error?.stack);
  };

  window.addEventListener('unhandledrejection', (event) => {
    addDebugLog('error', `Rejeição Não Tratada: ${event.reason?.message || event.reason}`, event.reason?.stack);
  });

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    const msg = args.map(arg => {
      if (arg instanceof Error) return arg.message + (arg.stack ? '\n' + arg.stack : '');
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ');
    addDebugLog('error', msg);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    addDebugLog('warn', msg);
  };
}
