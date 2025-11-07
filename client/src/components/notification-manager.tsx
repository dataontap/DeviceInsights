import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  requestNotificationPermission, 
  setupMessageListener, 
  sendPushNotification 
} from '@/lib/firebase';
import { Bell, Smartphone } from 'lucide-react';

export function NotificationManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  
  // Form state for push notifications only (SMS and email are now internal APIs)
  const [pushForm, setPushForm] = useState({ title: '', body: '', data: '' });

  const handleRequestPermission = async () => {
    try {
      setIsLoading(true);
      const token = await requestNotificationPermission();
      
      if (token) {
        setFcmToken(token);
        setupMessageListener(); // Start listening for messages
        toast({
          title: "Notification permission granted!",
          description: "You'll now receive push notifications.",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Permission error:', error);
      toast({
        title: "Permission error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPush = async () => {
    if (!fcmToken || !pushForm.title || !pushForm.body) {
      toast({
        title: "Missing requirements",
        description: "FCM token, title, and body are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = pushForm.data ? JSON.parse(pushForm.data) : undefined;
      const success = await sendPushNotification(fcmToken, pushForm.title, pushForm.body, data);
      
      if (success) {
        toast({
          title: "Push notification sent!",
          description: "Push notification sent successfully.",
        });
        setPushForm({ title: '', body: '', data: '' });
      } else {
        toast({
          title: "Push notification failed",
          description: "Failed to send push notification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Push notification error:', error);
      toast({
        title: "Push notification error",
        description: "Error sending push notification.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Web Push Notifications
        </CardTitle>
        <CardDescription>
          Send push notifications to website visitors using Firebase Cloud Messaging
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="push">Send Notification</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Push Notification Setup</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enable push notifications to receive real-time updates
                </p>
                <Button 
                  onClick={handleRequestPermission} 
                  disabled={isLoading || !!fcmToken}
                  className="w-full"
                >
                  {fcmToken ? "Notifications Enabled ✓" : "Enable Push Notifications"}
                </Button>
              </div>
              
              {fcmToken && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>FCM Token:</strong> {fcmToken.substring(0, 20)}...
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Push notifications are now enabled for this device
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="push" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4" />
              <h3 className="text-lg font-semibold">Send Push Notification</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="push-title">Title</Label>
                <Input
                  id="push-title"
                  placeholder="Notification title"
                  value={pushForm.title}
                  onChange={(e) => setPushForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="push-body">Message</Label>
                <Textarea
                  id="push-body"
                  placeholder="Notification message"
                  value={pushForm.body}
                  onChange={(e) => setPushForm(prev => ({ ...prev, body: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="push-data">Data (JSON, optional)</Label>
                <Textarea
                  id="push-data"
                  placeholder='{"key": "value"}'
                  value={pushForm.data}
                  onChange={(e) => setPushForm(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={handleSendPush} 
                disabled={isLoading || !fcmToken} 
                className="w-full"
              >
                {!fcmToken ? "Setup Notifications First" : "Send Push Notification"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}