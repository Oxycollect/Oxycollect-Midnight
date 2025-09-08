import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MapItem {
  id: number;
  classification: string;
  latitude: number;
  longitude: number;
  points: number;
  createdAt: string;
  privacyLevel: string;
}

export default function MapPage() {
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

  const { data: mapItems = [], isLoading } = useQuery<MapItem[]>({
    queryKey: ['/api/litter-items/all'],
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading privacy-protected map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Privacy-Protected Environmental Map</h1>
        </div>
        <p className="text-gray-600">
          All locations anonymized to 1km radius • User identities protected via Midnight Network ZK proofs
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Map Area (Simplified visualization) */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Anonymous Submissions</span>
              <Badge variant="secondary" className="ml-auto">
                {mapItems.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center relative">
              <p className="text-gray-500 text-center">
                Interactive Map View<br />
                <span className="text-sm">Privacy-protected locations displayed</span>
              </p>
              
              {/* Simulated map markers */}
              <div className="absolute inset-4">
                {mapItems.slice(0, 10).map((item, index) => (
                  <div
                    key={item.id}
                    className="absolute w-3 h-3 bg-teal-600 rounded-full cursor-pointer hover:bg-teal-700 transition-colors"
                    style={{
                      left: `${(index * 37) % 90}%`,
                      top: `${(index * 23) % 80}%`,
                    }}
                    onClick={() => setSelectedItem(item)}
                    title={`${item.classification} - ${item.points} points`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Item Details */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>
              {selectedItem ? 'Item Details' : 'Recent Submissions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {selectedItem.classification.replace('_', ' ').toUpperCase()}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Points:</span>
                      <Badge variant="secondary">+{selectedItem.points}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Privacy Level:</span>
                      <Badge variant="outline" className="text-purple-700">
                        {selectedItem.privacyLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Submitted:</span>
                      <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-gray-500">Protected (~1km radius)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Identity:</span>
                      <span className="text-green-600">🔐 Anonymous</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Close Details
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {mapItems.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {item.classification.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">+{item.points}</Badge>
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()} • Anonymous submission
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Privacy Information */}
      <Card className="mt-6 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Privacy Protection Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Location Privacy</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 1km radius anonymization</li>
                <li>• ZK proof verification</li>
                <li>• No exact GPS coordinates</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Identity Privacy</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Anonymous hash-based tracking</li>
                <li>• No user accounts linked</li>
                <li>• Midnight Network protection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-800">Data Privacy</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Minimal data collection</li>
                <li>• Classification only</li>
                <li>• No personal information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}