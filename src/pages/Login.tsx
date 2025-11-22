import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import bannerImage from "@/assets/redact-banner.jpg";
import logoImage from "@/assets/redact-logo.png";
import { LockKeyhole, User, Shield, AlertTriangle } from "lucide-react";

const CREDENTIALS = {
  username: "admin",
  password: "redact2025",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 30; // seconds

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast({
        variant: "destructive",
        title: "Account Locked",
        description: `Too many failed attempts. Try again in ${lockoutTimer} seconds.`,
      });
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        // Success
        if (rememberMe) {
          localStorage.setItem("redact_remember", "true");
        }
        sessionStorage.setItem("redact_auth", "true");
        
        toast({
          title: "Login Successful",
          description: "Welcome to ChainForecast Dashboard",
        });
        
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        // Failed attempt
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockoutTimer(LOCKOUT_TIME);
          toast({
            variant: "destructive",
            title: "Account Locked",
            description: `Too many failed attempts. Locked for ${LOCKOUT_TIME} seconds.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Invalid Credentials",
            description: `Attempt ${newAttempts} of ${MAX_ATTEMPTS}. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
          });
        }
      }
      
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Security Warning Banner */}
          {isLocked && (
            <div className="mb-6 glass-card border-destructive/50 p-4 rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">Security Lockout Active</p>
                  <p className="text-xs text-destructive/80">Time remaining: {lockoutTimer}s</p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-8 rounded-2xl shadow-card glow-effect">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img 
                    src={logoImage} 
                    alt="REDACT Logo" 
                    className="w-20 h-20 object-contain drop-shadow-glow"
                  />
                  <Shield className="absolute -bottom-2 -right-2 w-6 h-6 text-primary" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-2 gradient-text">
                ChainForecast
              </h1>
              <p className="text-lg font-semibold text-foreground">
                REDACT Suraksha 2k25
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                AI-Powered Sales Forecasting & CRM
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLocked}
                    className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="redact2025"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked}
                    className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Attempts Counter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLocked}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                
                {attempts > 0 && !isLocked && (
                  <p className="text-xs text-destructive">
                    Attempts: {attempts}/{MAX_ATTEMPTS}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLocked || isLoading}
                className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-glow transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : isLocked ? (
                  `Locked (${lockoutTimer}s)`
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>Secured by REDACT Security Framework</p>
              <p className="mt-1">© 2025 ChainForecast. All rights reserved.</p>
            </div>
          </div>

          {/* Hint for demo */}
          <div className="mt-4 text-center text-xs text-muted-foreground glass-card p-3 rounded-lg">
            <p>Demo Credentials: admin / redact2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
