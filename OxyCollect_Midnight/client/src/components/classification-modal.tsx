import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CLASSIFICATION_TYPES, type ClassificationType } from "@shared/schema";
import { getCNNClassifier, shouldShowAISuggestion, type CNNPrediction } from "@/lib/cnn-classifier";
import { Sparkles, Brain, CheckCircle, Plus, ArrowLeft, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface ClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassify: (classification: string, allClassifications?: any) => void;
  imageUrl: string;
  currentIndex?: number;
  totalImages?: number;
}

interface NewClassData {
  name: string;
  description?: string;
}

// Better representative icons for each classification
const ClassificationIcon = ({ type, size = "w-8 h-8" }: { type: string; size?: string }) => {
  const getColor = () => {
    switch (type) {
      case 'plastic_bottle': return 'text-blue-600';
      case 'plastic_cup': return 'text-purple-600';
      case 'plastic_bag': return 'text-green-600';
      case 'rope': return 'text-orange-600';
      case 'other': return 'text-gray-600';
      default: return 'text-green-600'; // Default color for new dynamic classifications
    }
  };

  const className = `${size} ${getColor()}`;
  
  switch (type) {
    case 'plastic_bottle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M9 3V1h6v2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2v11c0 1.1-.9 2-2 2H11c-1.1 0-2-.9-2-2V8c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm2 0h2v2H11V3zm4 5v11H9V8h6zm-1 2h-4v2h4v-2z"/>
        </svg>
      );
    case 'plastic_cup':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M6 2l1.5 15c.1 1.1 1 2 2.1 2h4.8c1.1 0 2-.9 2.1-2L18 2H6zm2.2 2h7.6l-1.2 12H9.4L8.2 4zm1.8 2v8h4V6h-4z"/>
        </svg>
      );
    case 'plastic_bag':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2h4v2H3V4h4zm2-2v2h6V2H9zm-4 4h14l-1 14c-.1 1.1-1 2-2.1 2H8.1C7 20 6.1 19.1 6 18L5 6z"/>
        </svg>
      );
    case 'rope':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2C8.7 2 6 4.7 6 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0 2c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
        </svg>
      );
    case 'other':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
    default:
      // Default icon for new dynamic classifications
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
  }
};

export default function ClassificationModal({
  isOpen,
  onClose,
  onClassify,
  imageUrl,
}: ClassificationModalProps) {
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = selection, 2 = confirmation
  const [cnnPrediction, setCnnPrediction] = useState<CNNPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [newClassData, setNewClassData] = useState<NewClassData>({
    name: '',
    description: ''
  });
  const { toast } = useToast();

  // Fetch combined classifications (static + approved dynamic suggestions)
  const { data: allClassifications = CLASSIFICATION_TYPES } = useQuery({
    queryKey: ['/api/classifications'],
    enabled: isOpen, // Only fetch when modal is open
  });

  // Run CNN analysis when modal opens
  useEffect(() => {
    if (isOpen && imageUrl) {
      analyzeCapturedImage();
    }
    // Reset state when modal closes
    if (!isOpen) {
      setCnnPrediction(null);
      setShowAISuggestion(false);
      setSelectedClassification(null);
      setStep(1);
      setNewClassData({ name: '', description: '' });
    }
  }, [isOpen, imageUrl]);

  const analyzeCapturedImage = async () => {
    setIsAnalyzing(true);
    try {
      const classifier = getCNNClassifier();
      if (!classifier.isReady()) {
        console.log('CNN classifier not ready, initializing...');
        await classifier.initialize();
      }
      
      const prediction = await classifier.classifyImage(imageUrl);
      if (prediction) {
        console.log('CNN Prediction:', prediction);
        console.log('Confidence:', prediction.confidence);
        console.log('Should show suggestion:', shouldShowAISuggestion(prediction));
        
        setCnnPrediction(prediction);
        setShowAISuggestion(shouldShowAISuggestion(prediction, 0.2)); // Lower threshold to show more suggestions
        
        // Don't auto-select, just show the suggestion
        // User should see AI recommendation first, then decide
      }
    } catch (error) {
      console.error('CNN analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (selectedClassification && selectedClassification !== 'custom') {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleClassify = async () => {
    if (!selectedClassification) return;
    
    // Handle custom classification submission
    if (selectedClassification === 'custom') {
      await handleSubmitCustomClassification();
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Record whether CNN prediction was correct
      if (cnnPrediction) {
        const wasCorrect = cnnPrediction.classification === selectedClassification;
        console.log(`CNN Prediction Accuracy: ${wasCorrect ? 'CORRECT' : 'INCORRECT'}`);
        console.log(`AI predicted: ${cnnPrediction.classification}, User chose: ${selectedClassification}`);
        
        // Train the CNN model with the correct classification
        const classifier = getCNNClassifier();
        if (classifier.isReady()) {
          await classifier.trainWithExample(imageUrl, selectedClassification as any);
          console.log(`CNN model trained with correct classification: ${selectedClassification}`);
        }
        
        // Submit learning feedback to server
        try {
          const response = await fetch('/api/cnn-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl,
              predictedClassification: cnnPrediction.classification,
              actualClassification: selectedClassification,
              confidence: cnnPrediction.confidence,
              wasCorrect
            })
          });
          
          if (response.ok) {
            console.log('Learning feedback recorded successfully');
          }
        } catch (error) {
          console.warn('Failed to record learning feedback:', error);
        }
      } else {
        // No AI prediction was made, just train with user classification
        const classifier = getCNNClassifier();
        if (classifier.isReady()) {
          await classifier.trainWithExample(imageUrl, selectedClassification as any);
          console.log(`CNN model trained with new example: ${selectedClassification}`);
        }
      }
      
      // Submit the classification with all available classification data
      await onClassify(selectedClassification, allClassifications);
      setSelectedClassification(null);
      setCnnPrediction(null);
      setShowAISuggestion(false);
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCustomClassification = async () => {
    if (!newClassData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for the new category.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/classification-suggestions', {
        name: newClassData.name.trim(),
        description: newClassData.description?.trim() || '',
        suggestedPoints: 10, // Default points for new categories
        imageUrl: imageUrl
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Suggestion Submitted!",
          description: "Your new category suggestion has been sent for admin approval. Thank you for helping improve our classification system!",
        });
        
        // Complete the classification workflow with the suggested category
        // This triggers the reward modal and normal completion flow
        onClassify(newClassData.name.trim());
        
        // Reset form state after successful submission
        setNewClassData({ name: '', description: '' });
        setStep(1);
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle authentication error specifically
        if (response.status === 401 || errorData.code === 'AUTH_REQUIRED') {
          toast({
            title: "Please Log In",
            description: "You need to be logged in to suggest new categories. Please log in and try again.",
            variant: "destructive",
          });
          // Optionally redirect to login page
          window.location.href = '/auth';
          return;
        }
        
        throw new Error(errorData.message || 'Failed to submit suggestion');
      }
    } catch (error: any) {
      console.error('Error submitting custom classification:', error);
      
      // Check if it's a network error
      if (error.message?.includes('fetch')) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: error.message || "Failed to submit your category suggestion. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[75vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 transition-colors duration-200 z-[200]" aria-describedby="classification-description">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-gray-900 dark:text-white">
            {step === 1 ? "Classify This Item" : "Confirm Your Selection"}
          </DialogTitle>
          <p id="classification-description" className="sr-only">
            {step === 1 ? "Select the type of litter you captured to earn points" : "Confirm your selection to submit and earn points"}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Captured Image */}
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={imageUrl}
              alt="Captured litter"
              className="w-full h-full object-cover"
            />
          </div>

          {step === 1 ? (
            <>
              {/* AI Analysis Status */}
              {isAnalyzing && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">AI analyzing image...</span>
                </div>
              )}

              {/* AI Suggestion - More Prominent */}
              {showAISuggestion && cnnPrediction && (
                <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg border-2 border-purple-300 dark:border-purple-600 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-base font-semibold text-purple-800 dark:text-purple-200">🤖 AI Recommendation</span>
                    <Badge variant="default" className="ml-auto bg-purple-600 dark:bg-purple-500">
                      {Math.round(cnnPrediction.confidence * 100)}% confident
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
                    <ClassificationIcon type={cnnPrediction.classification} size="w-8 h-8" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {allClassifications[cnnPrediction.classification]?.name || cnnPrediction.classification}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Our AI suggests this classification - you can accept it or choose differently below
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedClassification(cnnPrediction.classification)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
                    >
                      Accept AI Pick
                    </Button>
                  </div>
                </div>
              )}

              {/* Classification Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What type of litter is this?</p>
                {Object.entries(allClassifications).map(([key, value]) => {
                  const isSelected = selectedClassification === key;
                  const isAISuggestion = cnnPrediction && cnnPrediction.classification === key && showAISuggestion;
                  const aiConfidence = cnnPrediction?.allPredictions[key as ClassificationType] || 0;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedClassification(key)}
                      className={`w-full p-3 text-left rounded-lg transition-all border ${
                        isSelected
                          ? "bg-teal-600 text-white border-teal-600"
                          : isAISuggestion
                          ? "bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800 border-purple-200 dark:border-purple-600"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <ClassificationIcon type={key} />
                        <span className={`flex-1 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{value.name}</span>
                        <div className="flex items-center space-x-2">
                          {isAISuggestion && (
                            <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-300">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Pick
                            </Badge>
                          )}
                          <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>+{value.points} pts</span>
                        </div>
                      </div>
                      {/* Show AI confidence for all predictions if available */}
                      {cnnPrediction && aiConfidence > 0 && (
                        <div className="mt-1 flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div 
                              className="bg-purple-500 dark:bg-purple-400 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${aiConfidence * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {Math.round(aiConfidence * 100)}%
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
                
                {/* Custom Classification Option */}
                <button
                  onClick={() => setSelectedClassification('custom')}
                  className={`w-full p-3 text-left rounded-lg transition-all border ${
                    selectedClassification === 'custom'
                      ? "bg-teal-600 text-white border-teal-600"
                      : "border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900 bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedClassification === 'custom' 
                        ? "bg-white bg-opacity-20" 
                        : "bg-teal-100 dark:bg-teal-900"
                    }`}>
                      <Plus className={`w-4 h-4 ${
                        selectedClassification === 'custom' 
                          ? "text-white" 
                          : "text-teal-600 dark:text-teal-400"
                      }`} />
                    </div>
                    <span className={`flex-1 font-medium ${
                      selectedClassification === 'custom' 
                        ? "text-white" 
                        : "text-teal-700 dark:text-teal-300"
                    }`}>Suggest New Category</span>
                    <span className={`text-sm ${
                      selectedClassification === 'custom' 
                        ? "text-white" 
                        : "text-teal-600 dark:text-teal-400"
                    }`}>Pending approval</span>
                  </div>
                </button>
                
                {/* Custom Classification Form - Show when custom is selected */}
                {selectedClassification === 'custom' && (
                  <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-700">
                    <h4 className="text-lg font-semibold text-teal-800 dark:text-teal-200 mb-3">
                      Suggest New Litter Category
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="custom-name" className="text-sm font-medium text-teal-700 dark:text-teal-300">
                          Category Name *
                        </Label>
                        <Input
                          id="custom-name"
                          value={newClassData.name}
                          onChange={(e) => setNewClassData({ ...newClassData, name: e.target.value })}
                          placeholder="e.g., Plastic Straws, Glass Bottles, etc."
                          className="mt-1"
                          maxLength={50}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="custom-description" className="text-sm font-medium text-teal-700 dark:text-teal-300">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="custom-description"
                          value={newClassData.description || ''}
                          onChange={(e) => setNewClassData({ ...newClassData, description: e.target.value })}
                          placeholder="Brief description of this litter type"
                          className="mt-1"
                          rows={2}
                          maxLength={200}
                        />
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border border-teal-200 dark:border-teal-600">
                        <p className="text-sm text-teal-700 dark:text-teal-300">
                          <strong>Note:</strong> New categories require admin approval. You'll earn 10 points for suggesting a new category that gets approved.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Step */}
              <div className="space-y-4">
                <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <ClassificationIcon type={selectedClassification!} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-teal-900 dark:text-teal-100">
                        {(allClassifications && allClassifications[selectedClassification!]) 
                          ? allClassifications[selectedClassification!].name 
                          : CLASSIFICATION_TYPES[selectedClassification!]?.name || 'Unknown Category'}
                      </h3>
                      <p className="text-sm text-teal-700 dark:text-teal-300">
                        You'll earn {(allClassifications && allClassifications[selectedClassification!]) 
                          ? allClassifications[selectedClassification!].points 
                          : CLASSIFICATION_TYPES[selectedClassification!]?.points || 10} points for this classification
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Ready to submit? This will add the item to your profile and update your score.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - Always visible at bottom with mobile-safe spacing */}
        <div className="flex space-x-3 pt-4 pb-6 sm:pb-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 relative z-[210]">
          {step === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={selectedClassification === 'custom' ? handleClassify : handleNext}
                disabled={!selectedClassification || (selectedClassification === 'custom' && !newClassData.name.trim())}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                {selectedClassification === 'custom' 
                  ? (isSubmitting ? 'Submitting...' : 'Submit Suggestion')
                  : 'Next'
                }
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleClassify}
                disabled={isSubmitting}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit & Earn Points"
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}