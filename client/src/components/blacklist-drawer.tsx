import { Drawer } from "vaul";
import { AlertTriangle, X, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlacklistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imei?: string;
  reason?: string;
}

export default function BlacklistDrawer({ open, onOpenChange, imei, reason }: BlacklistDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-fit mt-24 max-h-[96%] fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-white rounded-t-[10px] flex-1">
            {/* Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
            
            {/* Content */}
            <div className="max-w-md mx-auto">
              {/* Icon and Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Device on Naughty List
                </h2>
                <div className="flex items-center space-x-2 text-red-600 mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Security Alert</span>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-gray-800 text-center leading-relaxed">
                  It looks like the device IMEI you provided is on the <strong>"naughty list"</strong>. 
                  This device has been flagged for security reasons and cannot be analyzed at this time.
                </p>
              </div>

              {/* IMEI Display */}
              {imei && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <span className="text-sm text-gray-600">IMEI Number</span>
                    <div className="font-mono text-lg text-gray-900 mt-1">{imei}</div>
                  </div>
                </div>
              )}

              {/* Reason */}
              {reason && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Reason</h4>
                      <p className="text-yellow-800 text-sm">{reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  If you believe this is an error, please contact our support team for assistance.
                </p>
                <div className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 rounded-lg py-3 px-4">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">Contact Support</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700" 
                  onClick={() => onOpenChange(false)}
                >
                  Try Another IMEI
                </Button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}