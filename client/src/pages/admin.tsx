import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Smartphone, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminDashboard from "@/components/admin-dashboard";
import AdminLogin from "@/components/admin-login";

export default function Admin() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for token in URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const storedToken = localStorage.getItem('adminSessionToken');
    const storedEmail = localStorage.getItem('adminEmail');

    if (token) {
      // Verify the magic link token
      verifyTokenMutation.mutate(token);
      // Clean URL
      window.history.replaceState({}, '', '/admin');
    } else if (storedToken && storedEmail) {
      // Use stored session
      setSessionToken(storedToken);
      setUserEmail(storedEmail);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/admin/verify-token", { token });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      setUserEmail(data.email);
      setIsLoading(false);
      
      // Store session in localStorage
      localStorage.setItem('adminSessionToken', data.sessionToken);
      localStorage.setItem('adminEmail', data.email);
      
      toast({
        title: "Login successful!",
        description: `Welcome back, ${data.email}`,
      });
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast({
        title: "Login failed",
        description: error.message || "Invalid or expired magic link",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout", { 
        sessionToken 
      });
      return response.json();
    },
    onSuccess: () => {
      setSessionToken(null);
      setUserEmail(null);
      localStorage.removeItem('adminSessionToken');
      localStorage.removeItem('adminEmail');
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!sessionToken || !userEmail) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-semibold text-blue-900">IMEI Checker Admin</span>
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {userEmail}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Link href="/">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Main Site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <div className="bg-blue-50 min-h-screen">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">Admin Dashboard</h1>
              <p className="text-blue-700">Monitor IMEI searches, device trends, and system analytics</p>
            </div>
            
            <AdminDashboard sessionToken={sessionToken} />
          </div>
        </div>
      </div>
    </div>
  );
}
