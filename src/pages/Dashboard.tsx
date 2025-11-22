import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, Users, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const isAuth = sessionStorage.getItem("redact_auth");
    if (!isAuth) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("redact_auth");
    localStorage.removeItem("redact_remember");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">ChainForecast</h1>
            <p className="text-sm text-muted-foreground">REDACT Suraksha 2k25</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">AI-Powered Sales Forecasting & CRM Analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: DollarSign, label: "Total Revenue", value: "$2.4M", trend: "+12.5%" },
            { icon: Users, label: "Active Customers", value: "1,234", trend: "+8.2%" },
            { icon: TrendingUp, label: "Sales Growth", value: "23%", trend: "+3.1%" },
            { icon: BarChart3, label: "Forecasted Sales", value: "$3.1M", trend: "+15.3%" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 rounded-lg glow-effect hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="h-8 w-8 text-primary" />
                <span className="text-sm text-green-400">{stat.trend}</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Welcome Message */}
        <div className="glass-card p-8 rounded-lg text-center">
          <h3 className="text-2xl font-bold mb-4">Welcome to ChainForecast</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your secure dashboard for AI-powered sales forecasting and CRM analytics. 
            This is a demonstration dashboard - integrate your actual forecasting components here.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
