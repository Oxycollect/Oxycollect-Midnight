import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import AnonymousPage from "./pages/anonymous";
import MapPage from "./pages/map";
import AdminPage from "./pages/admin";
import AuthPage from "./pages/auth";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🌙</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  OxyCollect-Midnight
                </h1>
                <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Privacy First Challenge
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <a 
                  href="/anonymous" 
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Anonymous Tracking
                </a>
                <a 
                  href="/map" 
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Privacy Map
                </a>
                {isAuthenticated && (
                  <a 
                    href="/admin" 
                    className="text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    Admin
                  </a>
                )}
                <a 
                  href="/auth" 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {isAuthenticated ? 'Dashboard' : 'Login'}
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Switch>
            <Route path="/" component={AnonymousPage} />
            <Route path="/anonymous" component={AnonymousPage} />
            <Route path="/map" component={MapPage} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/auth" component={AuthPage} />
            <Route>
              <div className="max-w-4xl mx-auto p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to OxyCollect-Midnight</h2>
                <p className="text-gray-600 mb-6">
                  Privacy-first litter classification using Midnight Network ZK proofs
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <a href="/anonymous" className="p-6 border rounded-lg hover:bg-gray-50">
                    <h3 className="font-semibold mb-2">🔐 Anonymous Tracking</h3>
                    <p className="text-sm text-gray-600">
                      Submit litter classifications with complete privacy protection
                    </p>
                  </a>
                  <a href="/map" className="p-6 border rounded-lg hover:bg-gray-50">
                    <h3 className="font-semibold mb-2">🗺️ Privacy Map</h3>
                    <p className="text-sm text-gray-600">
                      View anonymized environmental data on the map
                    </p>
                  </a>
                  <a href="/auth" className="p-6 border rounded-lg hover:bg-gray-50">
                    <h3 className="font-semibold mb-2">👨‍💼 Admin Panel</h3>
                    <p className="text-sm text-gray-600">
                      Moderate content while preserving user privacy
                    </p>
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;