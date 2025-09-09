import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMagicLink } from "@/lib/firebase";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const sendMagicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      // First check if email is registered (has API key)
      const checkResponse = await fetch("/api/admin/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!checkResponse.ok) {
        const error = await checkResponse.json();
        throw new Error(error.message || "Email not registered");
      }
      
      // Send Firebase magic link
      await sendMagicLink(email);
      return { success: true };
    },
    onSuccess: (data: any) => {
      setEmailSent(true);
      
      // If in development mode, log the magic link to console
      if (data.isDevMode && data.devNote) {
        console.log("🔐 Development Magic Link:", data.devNote);
        console.log("Click this link to access admin dashboard:", data.devNote);
      }
      
      toast({
        title: "Magic link sent!",
        description: data.isDevMode ? "Check console for development link" : "Check your email for the login link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = emailSchema.parse({ email });
      sendMagicLinkMutation.mutate(validatedData.email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid email",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a secure login link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Check the browser console or server logs for the magic link until Firebase credentials are configured.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Click the link in your email to access the admin dashboard. The link will expire in 15 minutes.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
              className="w-full"
            >
              Try Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-blue-900">Admin Dashboard Access</CardTitle>
          <CardDescription>
            Provide your email and if it is registered we will send instructions on how to login to your Admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only emails that have generated API keys can access the admin dashboard.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={sendMagicLinkMutation.isPending}
            >
              {sendMagicLinkMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}