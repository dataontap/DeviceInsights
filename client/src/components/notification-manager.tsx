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
  sendSMSNotification, 
  sendEmailNotification, 
  sendPushNotification 
} from '@/lib/firebase';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

export function NotificationManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  
  // Form states
  const [smsForm, setSmsForm] = useState({ phoneNumber: '', message: '' });
  const [emailForm, setEmailForm] = useState({ email: '', subject: '', body: '' });
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

  const handleSendSMS = async () => {
    if (!smsForm.phoneNumber || !smsForm.message) {
      toast({
        title: "Missing fields",
        description: "Please provide both phone number and message.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const success = await sendSMSNotification(smsForm.phoneNumber, smsForm.message);
      
      if (success) {
        toast({
          title: "SMS sent!",
          description: "SMS notification sent successfully.",
        });
        setSmsForm({ phoneNumber: '', message: '' });
      } else {
        toast({
          title: "SMS failed",
          description: "Failed to send SMS notification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('SMS error:', error);
      toast({
        title: "SMS error",
        description: "Error sending SMS notification.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.email || !emailForm.subject || !emailForm.body) {
      toast({
        title: "Missing fields",
        description: "Please provide email, subject, and body.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const success = await sendEmailNotification(emailForm.email, emailForm.subject, emailForm.body);
      
      if (success) {
        toast({
          title: "Email sent!",
          description: "Email notification sent successfully.",
        });
        setEmailForm({ email: '', subject: '', body: '' });
      } else {
        toast({
          title: "Email failed",
          description: "Failed to send email notification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: "Email error",
        description: "Error sending email notification.",
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
          Firebase Messaging Center
        </CardTitle>
        <CardDescription>
          Send SMS, email, and push notifications using Firebase services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="push">Push</TabsTrigger>
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
          
          <TabsContent value="sms" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4" />
              <h3 className="text-lg font-semibold">Send SMS Notification</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={smsForm.phoneNumber}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="sms-message">Message</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Your SMS message here..."
                  value={smsForm.message}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              
              <Button onClick={handleSendSMS} disabled={isLoading} className="w-full">
                Send SMS
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4" />
              <h3 className="text-lg font-semibold">Send Email Notification</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="email-body">Message Body</Label>
                <Textarea
                  id="email-body"
                  placeholder="Your email message here..."
                  rows={4}
                  value={emailForm.body}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                />
              </div>
              
              <Button onClick={handleSendEmail} disabled={isLoading} className="w-full">
                Send Email
              </Button>
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