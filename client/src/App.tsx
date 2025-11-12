import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Analytics from "@/pages/analytics";
import { CoverageMaps } from "@/pages/coverage-maps";
import APIDocs from "@/components/api-docs";
import IntegrationGuide from "@/pages/integration-guide";
import NetworkPolicy from "@/pages/network-policy";
import BlacklistDemo from "@/pages/blacklist-demo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/coverage-maps" component={CoverageMaps} />
      <Route path="/api-docs" component={APIDocs} />
      <Route path="/integration-guide" component={IntegrationGuide} />
      <Route path="/network-policy" component={NetworkPolicy} />
      <Route path="/blacklist-demo" component={BlacklistDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
