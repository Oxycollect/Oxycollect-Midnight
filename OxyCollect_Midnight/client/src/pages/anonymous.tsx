import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Shield, Trophy, Zap, ImageIcon, ArrowLeft, User } from "lucide-react";
import iconClean from "@assets/icon-clean.png";
import PhotoInputFallback from "@/components/photo-input-fallback";
import ClassificationModal from "@/components/classification-modal";
import { CLASSIFICATION_TYPES, type ClassificationType } from "@shared/schema";
import { getCurrentLocation } from "@/lib/camera-utils";
import { apiRequest } from "@/lib/queryClient";

interface CapturedPhoto {
  id: string;
  imageUrl: string;
  timestamp: Date;
  classification?: ClassificationType;
  points?: number;
}

export default function AnonymousPage() {
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [currentPhotoForClassification, setCurrentPhotoForClassification] = useState<CapturedPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [totalPoints, setTotalPoints] = useState(0);
  const [sessionStats, setSessionStats] = useState({ items: 0, points: 0 });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for anonymous session
  const { data: anonymousSession } = useQuery<{ 
    sessionId?: string; 
    anonymous: boolean; 
    active: boolean 
  }>({
    queryKey: ['/api/anonymous/session'],
  });

  // Load session stats
  useEffect(() => {
    const savedStats = localStorage.getItem('anonymousSessionStats');
    if (savedStats) {
      try {
        setSessionStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Failed to parse session stats:', e);
      }
    }
  }, []);

  // Save session stats
  const updateSessionStats = (newStats: { items: number; points: number }) => {
    setSessionStats(newStats);
    localStorage.setItem('anonymousSessionStats', JSON.stringify(newStats));
  };

  const createLitterItemMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use anonymous endpoint for privacy protection
      const response = await apiRequest("POST", "/api/anonymous/submit-litter", {
        imageData: data.imageUrl,
        classification: data.classification,
        location: { lat: data.latitude, lng: data.longitude },
        privacyLevel: 'anonymous',
        userSecret: anonymousSession?.sessionId || 'default_secret'
      });
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      const newStats = {
        items: sessionStats.items + 1,
        points: sessionStats.points + (result.points || 0)
      };
      updateSessionStats(newStats);
      
      toast({
        title: "✅ Submission Successful!",
        description: `+${result.points || 0} points earned anonymously`,
        variant: "default",
      });

      // Update the photo with classification and points
      setCapturedPhotos(prev => prev.map(photo => 
        photo.id === currentPhotoForClassification?.id 
          ? { ...photo, classification: result.classification, points: result.points }
          : photo
      ));
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again. Your anonymous session is still active.",
        variant: "destructive",
      });
    }
  });

  const handlePhotoCapture = (imageUrl: string) => {
    const newPhoto: CapturedPhoto = {
      id: Date.now().toString(),
      imageUrl,
      timestamp: new Date(),
    };
    
    setCapturedPhotos(prev => [...prev, newPhoto]);
    setCurrentPhotoForClassification(newPhoto);
    setShowCamera(false);
    setShowClassificationModal(true);
  };

  const handleClassification = async (classification: string) => {
    if (!currentPhotoForClassification) return;

    setIsProcessing(true);
    setProcessingStep("Getting location...");

    try {
      const location = await getCurrentLocation();
      const submissionData = {
        imageUrl: currentPhotoForClassification.imageUrl,
        classification: classification,
        points: CLASSIFICATION_TYPES[classification as ClassificationType]?.points || 5,
        latitude: location?.latitude || 51.5074,
        longitude: location?.longitude || -0.1278,
      };

      setProcessingStep("Submitting anonymously...");
      await createLitterItemMutation.mutateAsync(submissionData);

    } catch (error) {
      console.error('Classification error:', error);
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
      setShowClassificationModal(false);
      setCurrentPhotoForClassification(null);
    }
  };

  const startNewCapture = () => {
    setShowCamera(true);
  };

  if (!anonymousSession?.active) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 shadow-2xl min-h-screen">
        <div className="flex items-center justify-center h-screen p-6">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <img src={iconClean} alt="Oxy Collect" className="w-16 h-16" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">Anonymous Session Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You need an active anonymous session to use this page.
              </p>
              <Button 
                onClick={() => window.location.href = "/auth"}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 shadow-2xl min-h-screen relative transition-colors duration-200 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={iconClean} alt="Oxy Collect" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">Anonymous Tracking</h1>
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span className="text-xs">🌙 Midnight Protected</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{sessionStats.points} points</div>
            <div className="text-xs opacity-90">{sessionStats.items} items</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        
        {/* Session Info */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Anonymous Session Active</span>
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Connected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-200">
                Complete privacy protection • ZK proofs • Location anonymization • Strike system for moderation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Capture Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Capture & Classify</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Take photos of litter and earn anonymous points while helping train our AI
            </p>
            <Button 
              onClick={startNewCapture}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Capture
            </Button>
          </CardContent>
        </Card>

        {/* Recent Captures */}
        {capturedPhotos.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <ImageIcon className="h-4 w-4" />
                <span>This Session ({capturedPhotos.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {capturedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img 
                      src={photo.imageUrl} 
                      alt="Captured litter" 
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    {photo.classification && (
                      <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs p-1 rounded">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{CLASSIFICATION_TYPES[photo.classification]?.name}</span>
                          {photo.points && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              +{photo.points}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Information */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Privacy Protection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Location anonymized to 1km radius</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Zero-knowledge proofs for verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Anonymous strike system for moderation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>No personal data stored or tracked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Capture Photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCamera(false)}
              >
                ×
              </Button>
            </div>
            <PhotoInputFallback 
              onCapture={handlePhotoCapture}
              onClose={() => setShowCamera(false)}
            />
          </div>
        </div>
      )}

      {/* Classification Modal */}
      <ClassificationModal
        isOpen={showClassificationModal}
        onClose={() => setShowClassificationModal(false)}
        onClassify={handleClassification}
        imageUrl={currentPhotoForClassification?.imageUrl || ""}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white font-medium">{processingStep}</p>
          </div>
        </div>
      )}
    </div>
  );
}