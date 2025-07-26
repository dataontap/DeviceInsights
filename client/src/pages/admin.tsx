import { Link } from "wouter";
import { Smartphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminDashboard from "@/components/admin-dashboard";

export default function Admin() {
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
            </div>
            
            <div className="flex items-center space-x-4">
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
            
            <AdminDashboard />
          </div>
        </div>
      </div>
    </div>
  );
}
