import { Captcha } from '@/components/Captcha';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SHA256 from 'crypto-js/sha256'; // Importing SHA256 from crypto-js
import { TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordStrengthClass, setPasswordStrengthClass] = useState('');
  const [passwordStrengthBar, setPasswordStrengthBar] = useState(0); // 0-100 scale
  const nav = useNavigate();
  
  const hardcodedUsername = 'testuser';
  const hardcodedPassword = 'password123';  // Hardcoded demo password
  const storedHashedPassword = localStorage.getItem('hashedPassword');  // Retrieve stored hash

  // Password strength validation (more genuine)
  const checkPasswordStrength = (password) => {
    const length = password.length;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;

    let strengthScore = 0;

    // Length check
    if (length >= 8) strengthScore += 25;
    if (length >= 12) strengthScore += 25;

    // Check for numbers, uppercase, lowercase, special characters
    if (hasNumber) strengthScore += 25;
    if (hasSpecialChar) strengthScore += 25;
    if (hasUpperCase) strengthScore += 25;
    if (hasLowerCase) strengthScore += 25;

    // Set password strength text and class based on the score
    if (strengthScore < 50) {
      setPasswordStrength('Weak password');
      setPasswordStrengthClass('text-red-500');
    } else if (strengthScore < 75) {
      setPasswordStrength('Moderate password');
      setPasswordStrengthClass('text-yellow-500');
    } else {
      setPasswordStrength('Strong password');
      setPasswordStrengthClass('text-green-500');
    }

    // Set password strength bar
    setPasswordStrengthBar(strengthScore);
  };

  // Hash the password using SHA-256 (for demo purposes)
  const hashPassword = (password) => {
    return SHA256(password).toString();  // Hashing the password with SHA-256
  };

  // // Check if the user is already logged in by looking for the hashed password in localStorage
  // useEffect(() => {
  //   if (storedHashedPassword) {
  //   nav('/dashboard');  // Redirect to dashboard if already logged in
  //   }
  // }, [storedHashedPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for fields
    if (!username || !password) {
      toast.error('Please fill in both the username and password.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!isCaptchaValid) {
      toast.error('Please enter the correct CAPTCHA code');
      return;
    }

    // Check if hardcoded credentials match
    const hashedPassword = hashPassword(password);
    if (username === hardcodedUsername && hashedPassword === hashPassword(hardcodedPassword)) {
      // Store hashed password in localStorage
      localStorage.setItem('hashedPassword', hashedPassword);
      toast.success('Login successful!');
      nav('/dashboard');  // Redirect to the Dashboard
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
            <div className={`mt-1 text-sm ${passwordStrengthClass}`}>
              {passwordStrength}
            </div>
            <div className="h-1 w-full bg-gray-300 mt-2">
              <div
                className={`h-1 bg-gradient-to-r from-red-500 to-yellow-500`}
                style={{ width: `${passwordStrengthBar}%` }}
              />
            </div>
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
          Demo credentials: any username/password will work
        </p>
      </Card>
    </div>
  );
};

export default Login;
