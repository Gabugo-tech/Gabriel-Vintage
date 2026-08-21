import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Mail, 
  Phone, 
  Lock, 
  User, 
  ShieldCheck, 
  Send, 
  CheckCircle,
  Timer,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Wifi,
  Battery,
  Copy,
  Volume2,
  Bell,
  ChevronLeft,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { safeLocalStorage } from "../lib/storage";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string, phone: string, name: string) => void;
  hideCloseButton?: boolean;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, hideCloseButton = false }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  
  // Registration & Login States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  
  // Ref pointers for auto-focusing inputs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Reset all state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setIsVerifying(false);
      setVerificationSuccess(false);
      setUserEnteredCode("");
      setVerificationError("");
      setSimulationToast(null);
      setCountdown(60);
      setFieldErrors({});
    }
  }, [isOpen]);

  // Auto focus first empty input field when mode or modal toggles
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (authMode === "register" && nameInputRef.current) {
          nameInputRef.current.focus();
        } else if (authMode === "login" && emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 155);
    }
  }, [isOpen, authMode]);

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationType, setVerificationType] = useState<"email" | "sms">("sms");
  const [generatedCode, setGeneratedCode] = useState("");
  const [userEnteredCode, setUserEnteredCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // Interactive Simulator States
  const [isVibrating, setIsVibrating] = useState(false);
  const [phoneTime, setPhoneTime] = useState("09:41 AM");
  const [isMuted, setIsMuted] = useState(false);
  const [activeTabOnPhone, setActiveTabOnPhone] = useState<"lockscreen" | "messages">("messages");

  // Phone local clock sync
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      setPhoneTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Synthesizer for SMS alert tone chime sound
  const playSmsPing = () => {
    if (isMuted) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // High A5 pitch
      osc1.frequency.exponentialRampToValueAtTime(1109, audioCtx.currentTime + 0.12); // Elegant major interval up to C#6
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440, audioCtx.currentTime); // Stabilizing undertone
      osc2.frequency.exponentialRampToValueAtTime(554, audioCtx.currentTime + 0.12);

      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log("Synthesized text chirp audio blocked or bypassed by browser security policy.", e);
    }
  };

  // Interactive Simulation Status Toast
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isVerifying || verificationSuccess) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isVerifying, verificationSuccess, countdown]);

  if (!isOpen) return null;

  // Evaluate Password Strength Score
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Required", color: "bg-stone-200" };
    let points = 0;
    if (pass.length >= 6) points += 1;
    if (pass.length >= 10) points += 1;
    if (/[0-9]/.test(pass)) points += 1;
    if (/[A-Z]/.test(pass)) points += 1;
    if (/[^A-Za-z0-9]/.test(pass)) points += 1;

    if (points <= 2) return { score: 1, label: "Weak Security", color: "bg-rose-500" };
    if (points <= 4) return { score: 2, label: "Moderate Protection", color: "bg-amber-500" };
    return { score: 3, label: "Robust Strength Guaranteed", color: "bg-emerald-500" };
  };

  // Generate a random 6-digit verification code and trigger simulated dispatch
  const triggerVerification = (type: "email" | "sms", targetValue: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setVerificationType(type);
    setIsVerifying(true);
    setCountdown(60);
    setVerificationError("");
    setUserEnteredCode("");
    setIsVibrating(true);
    setActiveTabOnPhone("lockscreen");
    
    // Trigger audio & tactile vibrations
    playSmsPing();
    setTimeout(() => {
      setIsVibrating(false);
    }, 850);
    
    // Simulate real-time carrier delivery via custom premium active notification alert
    if (type === "sms") {
      setSimulationToast(`📱 SMS BROADCAST SUCCESS: Security Verification code [${code}] dispatched to ${targetValue} via FitCheck-Gateway!`);
    } else {
      setSimulationToast(`📧 EMAIL BROADCAST SUCCESS: Secure verification link with passcode [${code}] routed safely to ${targetValue}!`);
    }

    // Auto clear toast after 10 seconds
    setTimeout(() => {
      setSimulationToast(null);
    }, 10000);
  };

  // Form Validation Handlers
  const validateFields = () => {
    const errors: { [key: string]: string } = {};
    if (authMode === "register" && !name.trim()) {
      errors.name = "Full Name is required for listing curation signature.";
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please input a valid email address.";
    }
    if (authMode === "register" && !phone.trim()) {
      errors.phone = "Active phone is required for SMS security authorization.";
    }
    if (!password || password.length < 6) {
      errors.password = "Security password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");

    if (!validateFields()) return;

    if (authMode === "register") {
      triggerVerification("sms", phone);
    } else {
      // Login: check stored registered users
      let registeredUsers: { name: string; email: string; phone: string; isVerified: boolean }[] = [];
      try {
        registeredUsers = JSON.parse(safeLocalStorage.getItem("fitcheck_registered_users") || "[]");
      } catch (_) {}

      const matchedUser = registeredUsers.find(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );

      if (registeredUsers.length > 0 && !matchedUser) {
        setFieldErrors({ email: "No account found with this email. Please register first." });
        return;
      }

      setSimulationToast("🔒 SECURE LOGIN AUTH: Access request authorized successfully!");
      onAuthSuccess(email, matchedUser?.phone || phone || "+244 955 120190", matchedUser?.name || name || "Verified Customer");
      setTimeout(() => {
        onClose();
        setSimulationToast(null);
      }, 1000);
    }
  };

  // Google Simulated Sign-In - ultra fast account creation (< 5 seconds!)
  const handleGoogleSignIn = () => {
    setSimulationToast("🔄 AUTH SERVICES: Fetching secure cryptographic token from accounts.google.com...");
    setTimeout(() => {
      const gEmail = "darcywon644@gmail.com";
      const gName = "Darcy Won";
      const gPhone = "+254 755 319800";
      
      setName(gName);
      setEmail(gEmail);
      setPhone(gPhone);
      setPassword("GoogleFederatedSecure-898");
      
      setSimulationToast(`🎉 GOOGLE ACCOUNT RETRIEVED: Logged in securely as ${gName} (${gEmail}) via Google Verified OAuth! Handshaking session profile...`);
      
      setTimeout(() => {
        onAuthSuccess(gEmail, gPhone, gName);
        onClose();
        setSimulationToast(null);
      }, 1500);
    }, 1200);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");

    if (userEnteredCode.trim() === generatedCode) {
      setVerificationSuccess(true);
      setSimulationToast("🎉 Code successfully authenticated! Authorizing credentials secure handoff...");
      
      // Delay success to let animation play
      setTimeout(() => {
        // Register user profiles
        let registeredUsers = [];
        try {
          registeredUsers = JSON.parse(safeLocalStorage.getItem("fitcheck_registered_users") || "[]");
        } catch (_) {}
        const newUser = { name, email, phone, isVerified: true, createdAt: new Date().toISOString() };
        registeredUsers.push(newUser);
        safeLocalStorage.setItem("fitcheck_registered_users", JSON.stringify(registeredUsers));
        
        // Authenticate session
        onAuthSuccess(email, phone, name);
        onClose();
        
        // Reset state
        setIsVerifying(false);
        setVerificationSuccess(false);
        setSimulationToast(null);
      }, 1500);
    } else {
      setVerificationError("Invalid security verification code. Please check your simulated code banner and try again.");
    }
  };

  const handleResendCode = () => {
    triggerVerification(verificationType, verificationType === "sms" ? phone : email);
  };

  // Skip step helper for quick testing (very client friendly)
  const autoVerify = () => {
    setUserEnteredCode(generatedCode);
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="auth_verification_modal_root">
      {/* Dark overlay backdrop */}
      <div 
        onClick={hideCloseButton ? undefined : onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={`relative w-full transform overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200 transition-all duration-300 ${
          isVerifying ? "md:max-w-4xl max-w-lg md:p-8 p-6" : "max-w-md p-6"
        }`}>
          
          {/* Close trigger */}
          {!hideCloseButton && (
            <button 
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-stone-450 hover:text-stone-900 p-1.5 hover:bg-stone-100 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* ACTIVE DELIVERY STATUS SIMULATOR TOAST PANEL */}
          <AnimatePresence>
            {simulationToast && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-stone-900 border-l-4 border-jumia-orange text-amber-300 p-3.5 rounded-lg text-xs font-mono mb-4 shadow-md space-y-1.5 relative overflow-hidden"
                id="interactive_sms_broadcast_sim"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-jumia-orange tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-jumia-orange animate-ping"></span>
                  FITCHECK REALTIME COMMUNICATIONS GATEWAY
                </div>
                <p className="leading-relaxed">{simulationToast}</p>
                <div className="flex justify-between items-center pt-1 border-t border-stone-850 text-[9px] text-stone-400">
                  <span>Channel: Live Gateway Sync</span>
                  <button 
                    type="button" 
                    onClick={autoVerify}
                    className="text-white hover:text-jumia-orange font-bold uppercase tracking-wider bg-stone-800 px-2 py-0.5 rounded border border-stone-700"
                    title="Click to auto-insert verification code"
                  >
                    Auto Fill Code [⚡]
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isVerifying ? (
            /* ==============================================
               REGISTRATION / SIGN UP INPUTS
               ============================================== */
            <div className="space-y-5 animate-fade-in" id="auth_mode_selector_pane">
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#F68B1E] bg-orange-50 px-2.5 py-1 rounded-full">
                  Secure Customer Hub
                </span>
                <h3 className="text-lg font-bold font-sans text-stone-900 uppercase tracking-tight">
                  {authMode === "register" ? "Create Personal Account" : "Access Personal Account"}
                </h3>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                  Gain listing workspace access, place real-time bids, and track shipping measurements instantly!
                </p>
              </div>

              {/* Tab selector for Login / Register */}
              <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-lg text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setFieldErrors({});
                  }}
                  className={`py-1.5 rounded transition-all cursor-pointer text-center uppercase ${
                    authMode === "register" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setFieldErrors({});
                  }}
                  className={`py-1.5 rounded transition-all cursor-pointer text-center uppercase ${
                    authMode === "login" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Social Login option (Google One-Tap Mockup) to connect in 5 seconds */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-700 font-sans font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                {/* Custom Google Vector G Badge */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23sz" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google Secure
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-4 text-[9px] font-mono text-stone-400 uppercase">Or custom signature</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 block uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <input 
                        ref={nameInputRef}
                        type="text" 
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: "" }));
                        }}
                        placeholder="e.g. Darcy Won" 
                        className={`w-full border-2 focus:border-[#F68B1E] p-2.5 pl-10 rounded-lg text-xs text-stone-900 outline-none transition-colors ${
                          fieldErrors.name ? "border-rose-450 bg-rose-50/10" : "border-stone-200"
                        }`}
                      />
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                    </div>
                    {fieldErrors.name && (
                      <p className="text-[9.5px] font-semibold text-rose-550 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 block uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <input 
                      ref={emailInputRef}
                      type="email" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                      }}
                      placeholder="customer@domain.com" 
                      className={`w-full border-2 focus:border-[#F68B1E] p-2.5 pl-10 rounded-lg text-xs text-stone-900 outline-none transition-colors ${
                        fieldErrors.email ? "border-rose-450 bg-rose-50/10" : "border-stone-200"
                      }`}
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[9.5px] font-semibold text-rose-550 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 block uppercase tracking-wide">Phone Number</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: "" }));
                        }}
                        placeholder="+254 755 123456" 
                        className={`w-full border-2 focus:border-[#F68B1E] p-2.5 pl-10 rounded-lg text-xs text-stone-900 outline-none transition-colors ${
                          fieldErrors.phone ? "border-rose-450 bg-rose-50/10" : "border-stone-200"
                        }`}
                      />
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-[9.5px] font-semibold text-rose-550 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        {fieldErrors.phone}
                      </p>
                    )}
                    <span className="text-[8.5px] text-amber-800 font-mono leading-none block pt-0.5">
                      ⚠ Active local/international format required for SMS MFA signals.
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-stone-500 block uppercase tracking-wide">Security Password</label>
                    {password && authMode === "register" && (
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${strength.color} text-white`}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                      }}
                      placeholder="••••••••" 
                      className={`w-full border-2 focus:border-[#F68B1E] p-2.5 pl-10 pr-10 rounded-lg text-xs text-stone-900 outline-none transition-colors ${
                        fieldErrors.password ? "border-rose-450 bg-rose-50/10" : "border-stone-200"
                      }`}
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 flex items-center text-stone-400 hover:text-stone-820 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[9.5px] font-semibold text-rose-550 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                      {fieldErrors.password}
                    </p>
                  )}

                  {/* Password strength dynamic meter container */}
                  {authMode === "register" && password && (
                    <div className="pt-1.5 space-y-1" id="ps_meter_indicator_box">
                      <div className="grid grid-cols-3 gap-1 h-1.5 rounded bg-stone-100 overflow-hidden">
                        <div className={`h-full rounded-l transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-transparent"}`}></div>
                        <div className={`h-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-transparent"}`}></div>
                        <div className={`h-full rounded-r transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-transparent"}`}></div>
                      </div>
                      <span className="text-[8px] font-mono text-stone-450 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                        Keep your couture password safe from brute-force attempts.
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#F68B1E] hover:bg-[#D57B18] text-white rounded-lg font-black text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {authMode === "register" ? "Register & Request Signals" : "Secure Account Sign-In"}
                </button>
              </form>

              <div className="text-center pt-2.5 border-t border-stone-100">
                <p className="text-[11px] text-stone-605">
                  {authMode === "register" ? "Already have an authorized signature account?" : "Need a professional curation profile?"}{" "}
                  <button 
                    type="button"
                    onClick={() => {
                      if (authMode === "register") {
                        setAuthMode("login");
                      } else {
                        setAuthMode("register");
                      }
                      setFieldErrors({});
                    }} 
                    className="text-[#F68B1E] font-bold hover:underline"
                  >
                    {authMode === "register" ? "Sign In Instantly" : "Create Account Now"}
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* ==============================================
               VERIFICATION INTERACTIVE FLOW (SMS & Email Verification)
               ============================================== */
            <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-12 md:gap-8" id="verification_split_workspace">
              
              {/* STYLES FOR EMBEDDED PHONE SIMULATION VIBRATIONS & LOCKSLIDES */}
              <style>{`
                @keyframes gsmVibrateSim {
                  0%, 100% { transform: translate(0, 0) rotate(0deg); }
                  15% { transform: translate(-2.5px, 1.5px) rotate(-1.5deg); }
                  30% { transform: translate(2.5px, -1.5px) rotate(1.5deg); }
                  45% { transform: translate(-2px, -1px) rotate(-1deg); }
                  60% { transform: translate(2px, 1.5px) rotate(1deg); }
                  75% { transform: translate(-1.5px, 1px) rotate(-0.5deg); }
                  90% { transform: translate(1.5px, -1px) rotate(0.5deg); }
                }
                .gsm-vibrating {
                  animation: gsmVibrateSim 0.12s linear infinite;
                }
                @keyframes bannerSlideDown {
                  0% { transform: translate(-50%, -40px); opacity: 0; }
                  100% { transform: translate(-50%, 0); opacity: 1; }
                }
                .banner-entrance {
                  animation: bannerSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
              `}</style>

              {/* LEFT COLUMN: SECURITY FORM PANELS */}
              <div className="md:col-span-7 space-y-5 flex flex-col justify-between" id="auth_form_column">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#E61601] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-3xs animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                      Real-time GSM Sync Status
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
                      title={isMuted ? "Unmute SMS incoming notifications tone" : "Mute SMS incoming notification tones"}
                    >
                      {isMuted ? <Volume2 className="w-3.5 h-3.5 text-stone-300 line-through" /> : <Volume2 className="w-3.5 h-3.5 text-jumia-orange" />}
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold font-sans text-stone-900 uppercase tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                    Verify Phone SMS Code
                  </h3>
                  
                  <p className="text-xs text-stone-500 leading-relaxed">
                    We delivered a confidential security transaction code to your specified phone:{" "}
                    <strong className="text-stone-900 underline decoration-jumia-orange font-bold font-mono text-[12px] bg-stone-50 px-1.5 py-0.5 rounded border border-stone-150">
                      {phone || "+254 755 123456"}
                    </strong>.
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                      6-Digit Authenticator Key
                    </label>
                    
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={userEnteredCode}
                        onChange={(e) => {
                          setUserEnteredCode(e.target.value.replace(/[^0-9]/g, ""));
                          setVerificationError("");
                        }}
                        placeholder="••••••" 
                        className="w-full border-2 border-stone-200 focus:border-[#F68B1E] p-3 rounded-xl text-center font-mono text-2xl tracking-[0.4em] text-stone-900 outline-none transition-all shadow-input"
                      />
                      <Timer className="w-5 h-5 text-stone-300 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>

                    {verificationError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 leading-relaxed font-semibold flex items-start gap-2 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <span>{verificationError}</span>
                      </div>
                    )}

                    {verificationSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2 shadow-2xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Success! Cellular signal authenticated. Constructing curated studio...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-stone-500 py-1 bg-stone-50/70 p-2.5 rounded-lg border border-stone-100">
                    <span className="flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-stone-400 animate-spin" style={{ animationDuration: '4s' }} />
                      Signal window: <strong className="text-stone-800 font-bold">{countdown}s</strong>
                    </span>
                    
                    <button
                      type="button"
                      disabled={countdown > 0}
                      onClick={handleResendCode}
                      className={`flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors ${
                        countdown > 0 
                          ? "text-stone-300 pointer-events-none" 
                          : "text-jumia-orange hover:bg-orange-50 cursor-pointer"
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend Code
                    </button>
                  </div>

                  {/* Submit code authentication */}
                  <button
                    type="submit"
                    disabled={verificationSuccess}
                    className="w-full py-3 bg-[#1C1A17] hover:bg-stone-950 text-white rounded-lg font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Confirm & Activate Session Account
                  </button>
                </form>

                {/* Aesthetic pairing instructions for trial */}
                <div className="p-3.5 bg-stone-50/70 border border-stone-200 rounded-xl text-[10.5px] text-stone-605 leading-relaxed space-y-1">
                  <div className="font-bold text-stone-800 uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Interactive Signal Feedback Model:
                  </div>
                  <p>
                    A beautiful smartphone emulator representing your actual local device has booted up on the right. When the SMS is broad-casted, the emulator vibrates, sounds a soft tone, and receives the SMS directly on your registered phone number!
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: HIGH-FIDELITY SMARTPHONE SMS INBOX EMULATOR */}
              <div className="md:col-span-5 md:border-l md:border-stone-150 md:pl-8 flex flex-col items-center justify-center" id="virt_gsm_carrier_column">
                <div className="text-center mb-2.5">
                  <span className="text-[10px] font-mono font-black text-stone-450 uppercase tracking-widest block">
                    Dynamic User Terminal
                  </span>
                  <p className="text-[9.5px] text-stone-400 font-mono">
                    Node: {phone || "+254 755 123456"}
                  </p>
                </div>

                {/* PHONE CHASSIS AND INTERACTIVE MOCKUP */}
                <div 
                  className={`relative w-[285px] h-[495px] rounded-[44px] border-[10px] border-stone-900 bg-stone-950 shadow-2xl overflow-hidden transition-all duration-300 ${
                    isVibrating ? "gsm-vibrating border-red-950" : "border-stone-900"
                  }`}
                  id="smartphone_body_wrapper"
                >
                  {/* PHONE SPEAKER / CAMERA NOTCH */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-stone-900 rounded-b-2xl z-35 flex items-center justify-between px-5">
                    <div className="w-2 h-2 rounded-full bg-stone-800"></div>
                    <div className="w-12 h-1 bg-stone-950 rounded-full"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-800"></div>
                  </div>

                  {/* PHONE GLASS CANVAS SCREEN */}
                  <div className="relative w-full h-full bg-[#FAF9F6] text-stone-900 overflow-hidden flex flex-col font-sans select-none">
                    
                    {/* CARRIER TOP STATUS BAR */}
                    <div className="h-7 pt-1.5 px-6 flex justify-between items-center bg-stone-900 text-stone-100 text-[10px] font-mono z-30 font-bold select-none">
                      <span>{phoneTime.split(' ')[0]}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-semibold text-emerald-400 tracking-wider">5G LTE</span>
                        <Wifi className="w-3 h-3 text-stone-200" />
                        <Battery className="w-3.5 h-3.5 text-stone-200" />
                      </div>
                    </div>

                    {/* DYNAMIC LOCKSCREEN VS MESSAGES TAB ROUTING */}
                    {activeTabOnPhone === "lockscreen" ? (
                      /* ================= LOCK SCREEN OVERLAY WALLPAPER ================= */
                      <div className="flex-1 relative bg-gradient-to-b from-stone-900 via-stone-850 to-stone-950 text-white p-4 flex flex-col justify-between select-none">
                        
                        {/* Lock screen Clock */}
                        <div className="text-center pt-8 space-y-1 z-10">
                          <p className="text-[9px] uppercase font-bold tracking-widest text-[#F68B1E] animate-pulse">
                            Secure GSM Connection
                          </p>
                          <h1 className="text-4xl font-extralight tracking-tight font-sans text-stone-50">
                            {phoneTime.split(' ')[0]}
                          </h1>
                          <p className="text-[10px] font-mono text-stone-400">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                        </div>

                        {/* Lock Screen Centered Authenticating Line Node Signal */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center space-y-2 opacity-5 pointer-events-none">
                          <div className="w-24 h-24 rounded-full border border-stone-300 animate-ping"></div>
                          <Phone className="w-12 h-12 text-stone-300" />
                        </div>

                        {/* DYNAMIC SLIDE DOWN SMS NOTIFICATION BANNER */}
                        <div className="absolute top-26 left-3 right-3 z-40">
                          <div 
                            onClick={() => setActiveTabOnPhone("messages")}
                            className="bg-white/95 backdrop-blur-md border border-stone-200 p-3 rounded-2xl shadow-xl text-stone-900 space-y-1.5 cursor-pointer banner-entrance transform hover:scale-[1.02] active:scale-95 transition-all text-left"
                            title="Tap notification banner to answer SMS"
                          >
                            <div className="flex items-center justify-between text-[9.5px] font-mono">
                              <span className="font-extrabold text-[#F68B1E] uppercase tracking-wide flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#F68B1E] rounded-full"></span>
                                FITCHECK-SECURE ✓
                              </span>
                              <span className="text-stone-450 font-bold">Just Now</span>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-serif font-black text-stone-900">
                                SMS verification delivered
                              </p>
                              <p className="text-[10px] text-stone-550 leading-relaxed font-mono truncate">
                                Code: {generatedCode}. Authenticate phone access used on account registration...
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-stone-150 text-[8.5px] font-bold text-stone-500">
                              <span>Tap to view conversations</span>
                              <span className="text-[#F68B1E] underline font-mono">AUTOFILL NOW ⚡</span>
                            </div>
                          </div>
                        </div>

                        {/* Swipe bottom instruction */}
                        <div className="text-center pb-3 space-y-1 z-10">
                          <button
                            type="button"
                            onClick={() => setActiveTabOnPhone("messages")}
                            className="w-full py-2 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 text-stone-100 text-[10px] font-mono uppercase font-black tracking-widest rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Swipe to Inbox [🔓]</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ================= UNLOCKED ACTIVE SMS CLIENT INBOX ================= */
                      <div className="flex-1 flex flex-col bg-[#F3F1EC] text-stone-900 select-none">
                        
                        {/* Message UI Hub Upper Header */}
                        <div className="bg-white border-b border-stone-200 px-4 py-2 flex items-center justify-between shadow-2xs">
                          <button 
                            type="button"
                            onClick={() => setActiveTabOnPhone("lockscreen")}
                            className="flex items-center text-stone-500 hover:text-stone-900 text-xs font-mono"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Exit</span>
                          </button>
                          
                          <div className="text-center">
                            <h4 className="text-[11px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-1 justify-center">
                              FITCHECK-MFA
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white inline-block shadow-3xs" title="Server Line Verified Active"></span>
                            </h4>
                            <p className="text-[8px] font-mono text-stone-400">
                              Broadcasting to {phone.slice(0, 9) || "+254 755"}***
                            </p>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-250 flex items-center justify-center font-mono text-xs font-extrabold text-stone-600">
                            G
                          </div>
                        </div>

                        {/* Real-time SMS Feed bubbles */}
                        <div className="flex-grow p-3 space-y-3 overflow-y-auto no-scrollbar flex flex-col justify-end text-xs leading-relaxed">
                          
                          {/* Previous Welcome Text Bubble */}
                          <div className="self-start max-w-[85%] space-y-1">
                            <span className="text-[8px] font-mono text-stone-450 uppercase block pl-2 font-bold select-none">
                              Gabriel Telecom • 10 mins ago
                            </span>
                            <div className="bg-white text-stone-850 p-2.5 rounded-2xl rounded-tl-none shadow-3xs border border-stone-150">
                              <p className="text-[10px]">
                                Hello and welcome! This signal channel authenticates vintage accounts registered on FitCheck. Keep your code private.
                              </p>
                            </div>
                          </div>

                          {/* Dynamic Active Incoming Verification Code Bubble */}
                          <div className="self-start max-w-[88%] space-y-1 animate-fade-in" id="active_sms_bubble_element">
                            <span className="text-[8px] font-mono text-[#F68B1E] uppercase flex items-center gap-1 block pl-2 font-black select-none">
                              <span className="w-1.5 h-1.5 bg-jumia-orange rounded-full animate-ping"></span>
                              Incoming Dispatch • Realtime Live
                            </span>
                            
                            <div 
                              onClick={autoVerify}
                              className="bg-stone-900 text-stone-100 p-3 rounded-2xl rounded-tl-none border-l-4 border-jumia-orange shadow-md relative overflow-hidden group cursor-pointer transition-all hover:bg-stone-950 hover:scale-[1.01]"
                              title="Click entire SMS message bubble to immediately copy & paste verification code"
                            >
                              <div className="space-y-1.5 relative z-10 text-left">
                                <div className="border-b border-stone-800 pb-1 flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-[#F68B1E] font-extrabold">
                                  <span>FITCHECK SECURITY MFA</span>
                                  <span className="bg-orange-950 px-1 rounded border border-orange-900">SIM GSM</span>
                                </div>
                                
                                <p className="text-[9px] text-stone-300 leading-normal font-sans pt-0.5">
                                  Your secure registration code is:
                                </p>
                                
                                <div className="py-2.5 my-1 bg-stone-950 rounded border border-stone-850 flex items-center justify-center gap-2">
                                  <span className="text-xl font-bold font-mono tracking-wider text-amber-300 select-all">
                                    {generatedCode}
                                  </span>
                                  <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-300 transition-colors" />
                                </div>

                                <p className="text-[8px] text-stone-400 leading-relaxed font-mono pt-1">
                                  Line Node Destination: {phone || "+254 755 123456"}
                                </p>

                                <button 
                                  type="button"
                                  onClick={autoVerify}
                                  className="w-full py-1.5 mt-2 bg-[#F68B1E] hover:bg-orange-600 text-white font-mono text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1 select-none"
                                >
                                  <span>Tap to autofill [⚡]</span>
                                </button>
                              </div>

                              {/* Decorative abstract watermark */}
                              <ShieldCheck className="w-24 h-24 text-stone-850/15 absolute -right-4 -bottom-4 pointer-events-none transform rotate-12" />
                            </div>
                          </div>

                        </div>

                        {/* Lock warning inside terminal */}
                        <div className="p-2.5 bg-stone-100 border-t border-stone-200 text-center text-[9px] text-stone-450 font-mono">
                          🔐 End-to-end cryptographic GSM sync verified.
                        </div>

                      </div>
                    )}

                  </div>

                </div>

                {/* Simulated carrier status indicator logs */}
                <div className="mt-3 text-center space-y-1" id="gsm_telecom_logline">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button" 
                      onClick={() => setActiveTabOnPhone(activeTabOnPhone === "lockscreen" ? "messages" : "lockscreen")}
                      className="text-[10px] font-mono text-[#F68B1E] hover:underline bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded cursor-pointer font-bold"
                    >
                      {activeTabOnPhone === "lockscreen" ? "Force Open Messages Inbox 🔓" : "Show Phone Lockscreen 🔒"}
                    </button>
                  </div>
                  <p className="text-[8.5px] font-mono text-stone-400 uppercase tracking-widest select-none">
                    Connected Carrier Service: GSM Multi-Handoff Node Link
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
