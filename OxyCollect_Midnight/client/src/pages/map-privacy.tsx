import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Eye } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface AnonymousPick {
  id: number;
  classification: string;
  locationRange: {
    latRange: [number, number];
    lngRange: [number, number];
  };
  points: number;
  submittedAt: string;
  isVerified: boolean;
}

export default function MapPrivacy() {
  // Fetch anonymous picks for map display
  const { data: anonymousPicks, isLoading } = useQuery<AnonymousPick[]>({
    queryKey: ['/api/anonymous/map-data'],
  });

  // Default map center (London)
  const defaultCenter: [number, number] = [51.505, -0.09];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🗺️ Privacy-Protected Environmental Map
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          View environmental cleanup data with complete location anonymization
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>10km Location Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span>Anonymous Data Only</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Display */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Anonymous Environmental Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>Loading privacy-protected data...</p>
                  </div>
                </div>
              ) : (
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapContainer
                    center={defaultCenter}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      attribution='© OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {anonymousPicks?.map((pick) => {
                      // Calculate center of anonymized zone
                      const centerLat = (pick.locationRange.latRange[0] + pick.locationRange.latRange[1]) / 2;
                      const centerLng = (pick.locationRange.lngRange[0] + pick.locationRange.lngRange[1]) / 2;
                      
                      return (
                        <CircleMarker
                          key={pick.id}
                          center={[centerLat, centerLng]}
                          radius={8}
                          pathOptions={{
                            color: pick.isVerified ? '#10b981' : '#f59e0b',
                            fillColor: pick.isVerified ? '#10b981' : '#f59e0b',
                            fillOpacity: 0.6,
                          }}
                        >
                          <Popup>
                            <div className="p-2">
                              <div className="font-semibold text-sm mb-2">
                                Anonymous Environmental Action
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {pick.classification.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>Points:</span>
                                  <Badge variant="secondary">+{pick.points}</Badge>
                                </div>
                                <div className="text-gray-500">
                                  {new Date(pick.submittedAt).toLocaleDateString()}
                                </div>
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                  <div className="font-medium text-blue-800 dark:text-blue-200">
                                    🔐 Privacy Protected
                                  </div>
                                  <div className="text-blue-600 dark:text-blue-300">
                                    Location anonymized to ~10km zone
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Privacy Stats Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔐 Privacy Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {anonymousPicks?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Anonymous Actions
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {anonymousPicks?.filter(p => p.isVerified).length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Verified Actions
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {anonymousPicks?.reduce((sum, p) => sum + p.points, 0) || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Points Distributed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🛡️ Privacy Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Location Anonymization</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    GPS coordinates anonymized to 10km zones
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Zero Identity Tracking</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    All actions use anonymous hashes
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-purple-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Zone-Based Display</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Environmental data shown in privacy zones
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}