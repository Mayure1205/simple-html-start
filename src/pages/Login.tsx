import { Captcha } from '@/components/Captcha';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordStrengthClass, setPasswordStrengthClass] = useState('');
  const [passwordStrengthBar, setPasswordStrengthBar] = useState(0); // 0-100 scale
  const nav = useNavigate();
  
  const hardcodedUsername = 'tester';

  // Password strength validation (Ab thoda strict logic lagayenge)
  const checkPasswordStrength = (password: string) => {
    const length = password.length;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);

    let strengthScore = 0;

    // 1. Length check (Length matter karta hai)
    if (length > 0) strengthScore += 10; // Typing start kiya
    if (length >= 8) strengthScore += 20; // Decent length
    if (length >= 12) strengthScore += 20; // Strong length

    // 2. Complexity check (Mix of characters)
    if (hasNumber) strengthScore += 10;
    if (hasSpecialChar) strengthScore += 20;
    if (hasUpperCase && hasLowerCase) strengthScore += 20;

    // Cap score at 100
    strengthScore = Math.min(strengthScore, 100);

    // Set password strength text and class based on the score
    if (length === 0) {
      setPasswordStrength('');
      setPasswordStrengthBar(0);
      return;
    }

    if (strengthScore < 40) {
      setPasswordStrength('Weak password');
      setPasswordStrengthClass('text-red-500');
    } else if (strengthScore < 80) {
      setPasswordStrength('Moderate password');
      setPasswordStrengthClass('text-yellow-500');
    } else {
      setPasswordStrength('Strong password');
      setPasswordStrengthClass('text-green-500');
    }

    // Set password strength bar
    setPasswordStrengthBar(strengthScore);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation for fields
    if (!username || !password) {
      toast.error('Please fill in both the username and password.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (!isCaptchaValid) {
      toast.error('Please enter the correct CAPTCHA code');
      setIsLoading(false);
      return;
    }

    // Check if hardcoded credentials match (Direct comparison for reliability)
    if (username === hardcodedUsername) {
       // Use AuthContext login to ensure state is updated correctly
       await login(password);
       // login function handles navigation and toast
    } else {
      toast.error('Invalid username or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md glass-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ChainForecast
          </h1>
          <p className="text-sm text-muted-foreground mt-2">REDACT Suraksha 2K25</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value); // Check password strength on change
              }}
              required
              className="bg-background/50"
            />
            {password && (
              <>
                <div className={`text-xs font-medium ${passwordStrengthClass}`}>
                  {passwordStrength}
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrengthBar < 50 
                        ? 'bg-red-500' 
                        : passwordStrengthBar < 75 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${passwordStrengthBar}%` }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Security Check</Label>
            <Captcha onValidate={setIsCaptchaValid} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Authorized Access Only: Use <b>tester</b> / <b>Pass@1205</b>
        </p>
      </Card>
    </div>
  );
};

export default Login;
