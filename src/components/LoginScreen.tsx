import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ShieldAlert, KeyRound, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyPassword, getOrInitPasswordConfig, DEFAULT_PASSWORD } from '../utils/password';

interface LoginScreenProps {
  onUnlock: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomized, setIsCustomized] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    getOrInitPasswordConfig().then((cfg) => {
      setIsCustomized(cfg.isCustomized);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your gallery password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyPassword(password);
      if (isValid) {
        // Successful login
        sessionStorage.setItem('zish_gallery_authenticated', 'true');
        sessionStorage.setItem('zish_gallery_auth_time', Date.now().toString());
        onUnlock();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch {
      setError('Error verifying password via Web Crypto API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-neutral-100 overflow-hidden">
      {/* Background radial ambient lights */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Vault Icon */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600/20 to-amber-400/10 border border-amber-500/30 text-amber-400 shadow-inner">
              <Lock className="h-9 w-9 stroke-[1.75]" />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 border border-neutral-700 text-amber-400">
                <KeyRound className="h-3 w-3" />
              </span>
            </div>

            <span className="inline-block text-[11px] font-semibold tracking-widest uppercase text-amber-400/90 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Private Gallery
            </span>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
              Zish-Gallery
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Your personal photo gallery
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <div className="relative">
                <input
                  id="gallery-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter Password"
                  autoFocus
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-neutral-950/80 border border-neutral-700 px-4 py-3.5 pr-12 text-sm text-white placeholder-neutral-500 transition-all focus:border-amber-500/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              id="btn-unlock-gallery"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-amber-500/10 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? 'Verifying...' : 'Unlock Gallery'}
            </button>
          </form>

          {/* First time hint if not customized */}
          {!isCustomized && (
            <div className="mt-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 p-3 text-center">
              <p className="text-xs text-neutral-400">
                Initial passcode: <span className="font-mono text-amber-300 font-semibold">{DEFAULT_PASSWORD}</span>
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                (You can easily customize or change this anytime in Settings)
              </p>
            </div>
          )}

          {/* Privacy & Architecture Disclaimer Footer */}
          <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Client-Side Private</span>
            </span>

            <button
              id="btn-security-info"
              type="button"
              onClick={() => setShowDisclaimer(true)}
              className="text-neutral-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Security Info</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Security Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-200"
          >
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-base mb-3">
              <ShieldCheck className="w-5 h-5" />
              <h3>Client-Side Privacy Architecture</h3>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
              <p>
                <strong>Zero Cloud / Zero Backend:</strong> This application runs entirely within your browser. Photos are never uploaded to any cloud server, AI model, or third-party service.
              </p>
              <p>
                <strong>Web Crypto Hashing:</strong> Passwords are never stored in plaintext. They are salted and hashed using the browser&apos;s native Web Crypto API (SHA-256).
              </p>
              <p className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90">
                <strong>Important Notice:</strong> Because this is a frontend-only application, client-side protection is designed for personal privacy and convenience. It does not provide server-grade access control against someone who already has access to the device or local filesystem.
              </p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="mt-5 w-full rounded-xl bg-neutral-800 py-2.5 text-xs font-semibold text-white hover:bg-neutral-700 transition"
            >
              Understood
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
