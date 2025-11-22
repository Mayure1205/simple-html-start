import { LayoutDashboard, LogOut, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export const DashboardSidebar = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 glass-card border-r min-h-screen p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            REDACT
          </h2>
          <p className="text-xs text-muted-foreground">Suraksha 2k25</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Button>
      </nav>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground">Logged in</p>
          </div>
          <ThemeToggle />
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};
