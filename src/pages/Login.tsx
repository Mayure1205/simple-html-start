import { Captcha } from '@/components/Captcha';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have this custom hook for managing user authentication
import axios from 'axios';
import { TrendingUp } from 'lucide-react';
//import { useRouter } from 'next/router'; // Assuming you're using Next.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const nav=useNavigate();  
  const { login } = useAuth();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCaptchaValid) {
      toast.error('Please enter the correct CAPTCHA code');
      return;
    }

    setIsLoading(true);
    try {
      // Send POST request to backend login route
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password,
      }, {
        withCredentials: true,  // Make sure the cookie is sent and received
      });

      // If login is successful, store the JWT token in cookies (handled by the backend)
      if (response.status === 200) {
        toast.success('Login successful!');
        // Optionally redirect to another page
        nav('/dashboard'); // Redirect to the Dashboard page or wherever you need
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
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
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50"
            />
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
