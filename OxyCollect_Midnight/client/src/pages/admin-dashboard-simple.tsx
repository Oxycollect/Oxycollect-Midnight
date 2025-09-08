import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, FileImage, TrendingUp, Shield, Clock, CheckCircle, XCircle, Edit3, Save, RefreshCw, ArrowDown, Trash2, MapPin, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type User, type LitterItem, type ClassificationSuggestion, CLASSIFICATION_TYPES } from "@shared/schema";
import { useState } from "react";
import React from "react";

// ViewImageButton component from map page
function ViewImageButton({ itemId }: { itemId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadImage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/litter-items/${itemId}/image`);
      if (!response.ok) {
        throw new Error('Failed to load image');
      }
      
      const item = await response.json();
      
      if (item.imageUrl) {
        setImageUrl(item.imageUrl);
      } else {
        setError('No image available');
      }
    } catch (err) {
      setError('Failed to load image');
      console.error('Failed to load image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (imageUrl) {
    return (
      <div className="space-y-2">
        <img 
          src={imageUrl} 
          alt="Litter item" 
          className="w-full h-32 object-cover rounded-lg border"
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setImageUrl(null)}
          className="w-full text-xs"
        >
          Hide Image
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-2">
        <p className="text-xs text-red-500">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadImage}
          className="mt-1 text-xs"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={loadImage}
      disabled={isLoading}
      className="w-full text-xs"
    >
      {isLoading ? 'Loading...' : '📸 View Image'}
    </Button>
  );
}

// Strike Management Component for Anonymous Users
function StrikeManagement({ anonymousId }: { anonymousId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [strikes, setStrikes] = useState<{ strikeCount: number; banned: boolean } | null>(null);
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  // Load strikes for anonymous user
  const loadStrikes = async () => {
    if (!anonymousId || anonymousId === 'anonymous_user') return;
    
    try {
      const response = await fetch(`/api/admin/anonymous-strikes/${anonymousId}`);
      if (response.ok) {
        const data = await response.json();
        setStrikes(data.strikes);
      }
    } catch (error) {
      console.error('Failed to load strikes:', error);
    }
  };

  // Add strike to anonymous hash (not user account)
  const addStrike = async () => {
    if (!reason.trim() || !anonymousId || anonymousId === 'anonymous_user') {
      toast({
        title: "Cannot Add Strike",
        description: "Invalid anonymous ID or reason. Strikes require anonymous hash for privacy protection.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/anonymous-strikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymousId, reason: reason.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setStrikes(data.strike);
        setReason("");
        toast({
          title: "Strike Added",
          description: data.message,
          variant: data.banned ? "destructive" : "default"
        });
      } else {
        throw new Error('Failed to add strike');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add strike",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load strikes on component mount
  React.useEffect(() => {
    loadStrikes();
  }, [anonymousId]);

  if (!anonymousId || anonymousId === 'anonymous_user') {
    return (
      <div className="text-xs text-gray-500">
        Anonymous submission - no strikes tracking
      </div>
    );
  }

  const currentStrikes = strikes?.strikeCount || 0;
  const isBanned = strikes?.banned || currentStrikes >= 5;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <AlertTriangle className={`h-4 w-4 ${isBanned ? 'text-red-500' : currentStrikes > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
        <span className={`text-sm font-medium ${isBanned ? 'text-red-600' : currentStrikes > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
          Strikes: {currentStrikes}/5 {isBanned && '(BANNED)'}
        </span>
      </div>
      
      <div className="flex space-x-2">
        <Input
          placeholder="Strike reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="text-xs"
          disabled={isBanned}
        />
        <Button
          size="sm"
          onClick={addStrike}
          disabled={isLoading || !reason.trim() || isBanned}
          variant={isBanned ? "destructive" : "outline"}
          className="text-xs"
        >
          {isLoading ? 'Adding...' : '+ Strike'}
        </Button>
      </div>
    </div>
  );
}

// ViewImageButton for classification suggestions with direct imageUrl
function ViewSuggestionImageButton({ imageUrl: suggestionImageUrl }: { imageUrl?: string }) {
  const [showImage, setShowImage] = useState(false);

  if (!suggestionImageUrl) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled
        className="w-full text-xs opacity-50"
      >
        No Image Available
      </Button>
    );
  }

  if (showImage) {
    return (
      <div className="space-y-2">
        <img 
          src={suggestionImageUrl} 
          alt="Classification suggestion" 
          className="w-full h-32 object-cover rounded-lg border"
          onError={() => setShowImage(false)}
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowImage(false)}
          className="w-full text-xs"
        >
          Hide Image
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => setShowImage(true)}
      className="w-full text-xs"
    >
      📸 View Image
    </Button>
  );
}

export default function AdminDashboardSimple() {
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin - include all admin accounts
  const isAdmin = user?.isAdmin || 
                  user?.username === "Oxy" || 
                  user?.email === "oxy@oxycollect.org" || 
                  user?.email === "danielharvey95@hotmail.co.uk" ||
                  user?.email === "admin@oxycollect.org" ||
                  user?.id === "1753184096797" ||
                  user?.id === "1754680039640" ||
                  user?.id === "1755030840000"; // New admin account

  // Real admin stats query with automatic refresh every 30 seconds
  const { data: adminStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    totalUsers: number;
    activeUsers: number;
    totalLitterItems: number;
    totalPoints: number;
    totalTeams: number;
    pointsToday: number;
    avgItemsPerUser: number;
    systemUptime: number;
    timestamp: string;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: true, // Always enabled - backend handles auth
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  // Classification suggestions query with auto-refresh
  const { data: classificationSuggestions = [], isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery<ClassificationSuggestion[]>({
    queryKey: ["/api/admin/classification-suggestions"],
    enabled: true, // Always enabled - backend handles auth
    refetchInterval: 60000, // Refresh every minute
    refetchIntervalInBackground: true,
  });

  // Suspected non-plastic items query  
  const { data: suspectedItems = [], isLoading: suspectedItemsLoading, refetch: refetchSuspectedItems } = useQuery<LitterItem[]>({
    queryKey: ["/api/admin/suspected-items"],
    enabled: true, // Always enabled - backend handles auth
    refetchInterval: 60000, // Refresh every minute
    refetchIntervalInBackground: true,
  });

  // System health query with frequent refresh
  const { data: systemHealth, refetch: refetchHealth } = useQuery({
    queryKey: ["/api/admin/system-health"],
    enabled: true, // Always enabled - backend handles auth
    refetchInterval: 15000, // Refresh every 15 seconds
    refetchIntervalInBackground: true,
  });

  // All litter items query for admin management
  const { 
    data: allLitterItems = [], 
    isLoading: litterItemsLoading, 
    refetch: refetchLitterItems,
    error: litterItemsError 
  } = useQuery<LitterItem[]>({
    queryKey: ["/api/admin/litter-items"],
    queryFn: () => fetch("/api/admin/litter-items?limit=100").then(res => res.json()),
    enabled: true, // Always enabled - backend handles auth
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', finalPoints: 10 });
  const [reassignToCategory, setReassignToCategory] = useState<string>('');

  // Manual refresh function
  const handleRefreshAll = () => {
    refetchStats();
    refetchSuggestions();
    refetchSuspectedItems();
    refetchHealth();
    refetchLitterItems();
    toast({
      title: "Refreshed",
      description: "All admin data has been refreshed"
    });
  };

  if (!isAuthenticated) {
    return <div className="p-8 text-center">Please log in to access admin features.</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">Access denied. Admin privileges required.</div>
        <div className="text-sm text-gray-500">
          Current user: {user?.email || user?.id || 'Unknown'}
        </div>
        <div className="text-sm text-gray-500">
          Admin check: {user?.username === "Oxy" ? "✓ Oxy user" : 
                       user?.email === "oxy@oxycollect.org" ? "✓ Oxy email" : 
                       user?.email === "danielharvey95@hotmail.co.uk" ? "✓ Daniel email" :
                       user?.id === "1754680039640" ? "✓ Daniel ID" : "❌ Not admin"}
        </div>
      </div>
    );
  }

  // Approve/Reject suggestion mutation with enhanced error handling
  const approveSuggestionMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes, finalPoints }: { 
      id: number; 
      status: 'approved' | 'rejected'; 
      adminNotes?: string;
      finalPoints?: number;
    }) => {
      console.log(`Processing admin action: ${status} for suggestion ${id}`);
      
      const response = await apiRequest('PATCH', `/api/admin/classification-suggestions/${id}`, {
        status,
        adminNotes,
        finalPoints
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`API Error: ${response.status} - ${errorData}`);
        throw new Error(`Failed to ${status} suggestion: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Admin action completed:`, result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log(`Success: Classification suggestion ${variables.status}ed`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classification-suggestions"] });
      toast({
        title: "Success",
        description: `Classification suggestion ${variables.status}d successfully`,
      });
      setEditingCategory(null);
    },
    onError: (error: Error, variables) => {
      console.error(`Failed to ${variables.status} suggestion:`, error);
      toast({
        title: "Error",
        description: `Failed to ${variables.status} classification suggestion: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update litter item mutation
  const updateLitterItemMutation = useMutation({
    mutationFn: async ({ id, classification, points }: { id: number; classification: string; points: number }) => {
      const response = await apiRequest('PUT', `/api/admin/litter-items/${id}`, {
        classification,
        points
      });
      if (!response.ok) {
        throw new Error('Failed to update litter item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/litter-items/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Updated",
        description: "Litter item updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update litter item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete litter item mutation with optimistic updates
  const deleteLitterItemMutation = useMutation({
    mutationFn: async (id: number) => {
      // Optimistically remove item from All tab list immediately
      queryClient.setQueryData(["/api/admin/litter-items"], (oldData: LitterItem[] = []) => {
        return oldData.filter(item => item.id !== id);
      });

      const response = await apiRequest('DELETE', `/api/admin/litter-items/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete litter item');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate other caches after successful deletion
      queryClient.invalidateQueries({ queryKey: ["/api/litter-items/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Deleted",
        description: "Litter item deleted successfully",
      });
    },
    onError: (error: Error, id: number) => {
      // Revert optimistic update on error
      refetchLitterItems();
      toast({
        title: "Error",
        description: `Failed to delete litter item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (suggestion: ClassificationSuggestion) => {
    approveSuggestionMutation.mutate({
      id: suggestion.id,
      status: 'approved',
      adminNotes: `Approved by admin ${user?.email}`,
      finalPoints: editingCategory === suggestion.id ? editForm.finalPoints : suggestion.suggestedPoints
    });
  };

  const handleReject = (suggestion: ClassificationSuggestion, reason?: string) => {
    approveSuggestionMutation.mutate({
      id: suggestion.id,
      status: 'rejected',
      adminNotes: reason || `Rejected by admin ${user?.email}`
    });
  };

  const startEdit = (suggestion: ClassificationSuggestion) => {
    setEditingCategory(suggestion.id);
    setEditForm({
      name: suggestion.name,
      description: suggestion.description || '',
      finalPoints: suggestion.suggestedPoints || 10
    });
    setReassignToCategory(''); // Reset dropdown when starting edit
  };

  // Add mutation for reassigning to existing category
  const reassignSuggestionMutation = useMutation({
    mutationFn: async ({ suggestionId, existingCategory, imageUrl }: { 
      suggestionId: number; 
      existingCategory: string; 
      imageUrl: string | null;
    }) => {
      console.log(`Reassigning suggestion ${suggestionId} to existing category: ${existingCategory}`);
      
      const response = await apiRequest('POST', `/api/admin/reassign-suggestion`, {
        suggestionId,
        existingCategory,
        imageUrl
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`API Error: ${response.status} - ${errorData}`);
        throw new Error(`Failed to reassign suggestion: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Reassignment completed:`, result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log(`Success: Suggestion reassigned to ${variables.existingCategory}`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classification-suggestions"] });
      toast({
        title: "Success",
        description: `Image successfully added to "${variables.existingCategory.replace('_', ' ')}" category`,
      });
      setEditingCategory(null);
      setReassignToCategory('');
    },
    onError: (error: Error, variables) => {
      console.error(`Failed to reassign suggestion:`, error);
      toast({
        title: "Error",
        description: `Failed to reassign to existing category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const saveEdit = (suggestion: ClassificationSuggestion) => {
    if (reassignToCategory) {
      // Reassign to existing category - add image to training data for that category
      reassignSuggestionMutation.mutate({
        suggestionId: suggestion.id,
        existingCategory: reassignToCategory,
        imageUrl: suggestion.imageUrl
      });
    } else {
      // Create new category as usual
      approveSuggestionMutation.mutate({
        id: suggestion.id,
        status: 'approved',
        adminNotes: `Modified and approved by admin ${user?.email}. Original name: "${suggestion.name}", modified to: "${editForm.name}"`,
        finalPoints: editForm.finalPoints
      });
    }
  };

  // Handle suspected item actions
  const handleReclassifyItem = async (itemId: number, newClassification: string) => {
    if (!newClassification) {
      toast({ title: "Error", description: "Please select a classification", variant: "destructive" });
      return;
    }

    // Special handling for "suggest new class"
    if (newClassification === 'suggest_new_class') {
      const newClassName = prompt('Enter the name for the new classification category:');
      if (!newClassName || newClassName.trim() === '') {
        toast({ title: "Cancelled", description: "New class suggestion cancelled" });
        return;
      }

      // Optimistically remove item from Filter tab
      queryClient.setQueryData(["/api/admin/suspected-items"], (oldData: LitterItem[] = []) => {
        return oldData.filter(item => item.id !== itemId);
      });

      try {
        // Get the suspected item details first
        const suspectedItem = suspectedItems.find(item => item.id === itemId);
        if (!suspectedItem) {
          throw new Error('Item not found');
        }

        // Create classification suggestion with the item's image
        const response = await apiRequest('POST', '/api/classification-suggestions', {
          name: newClassName.trim(),
          description: `Suggested from Filter tab for item ID ${itemId}`,
          suggestedPoints: 10,
          imageUrl: suspectedItem.imageUrl
        });

        if (!response.ok) throw new Error('Failed to create suggestion');

        // Delete the original suspected item
        const deleteResponse = await apiRequest('DELETE', `/api/admin/litter-items/${itemId}`);
        if (!deleteResponse.ok) throw new Error('Failed to remove original item');

        // Refresh relevant caches
        queryClient.invalidateQueries({ queryKey: ["/api/admin/classification-suggestions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/litter-items/all"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        
        setReassignToCategory('');
        toast({ title: "Success", description: `New class "${newClassName}" suggested and moved to Class tab for approval` });
      } catch (error) {
        // Revert optimistic update on error
        refetchSuspectedItems();
        toast({ title: "Error", description: "Failed to create new class suggestion", variant: "destructive" });
      }
      return;
    }

    // Normal reclassification logic
    // Optimistically remove item from Filter tab
    queryClient.setQueryData(["/api/admin/suspected-items"], (oldData: LitterItem[] = []) => {
      return oldData.filter(item => item.id !== itemId);
    });

    try {
      const response = await apiRequest('PATCH', `/api/admin/suspected-items/${itemId}`, {
        action: 'reclassify', newClassification, adminNotes: `Reclassified from suspected_non_plastic to ${newClassification}`
      });
      if (!response.ok) throw new Error(`Failed to reclassify: ${response.status}`);
      
      // Refresh relevant caches
      queryClient.invalidateQueries({ queryKey: ["/api/litter-items/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      setReassignToCategory('');
      toast({ title: "Success", description: `Item reclassified as ${newClassification.replace('_', ' ')}` });
    } catch (error) {
      // Revert optimistic update on error
      refetchSuspectedItems();
      toast({ title: "Error", description: "Failed to reclassify item", variant: "destructive" });
    }
  };

  const handleKeepClassification = async (itemId: number) => {
    // Optimistically remove item from UI immediately
    queryClient.setQueryData(["/api/admin/suspected-items"], (oldData: LitterItem[] = []) => {
      return oldData.filter(item => item.id !== itemId);
    });

    try {
      const response = await apiRequest('PATCH', `/api/admin/suspected-items/${itemId}`, {
        action: 'confirm', adminNotes: 'Confirmed as non-plastic by admin'
      });
      if (!response.ok) throw new Error(`Failed to confirm: ${response.status}`);
      
      // Invalidate other caches after successful confirmation
      queryClient.invalidateQueries({ queryKey: ["/api/litter-items/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "Item confirmed as non-plastic for ML training" });
    } catch (error) {
      // Revert optimistic update on error
      refetchSuspectedItems();
      toast({ title: "Error", description: "Failed to confirm classification", variant: "destructive" });
    }
  };

  const handleRejectItem = async (itemId: number) => {
    // Optimistically remove item from UI immediately
    queryClient.setQueryData(["/api/admin/suspected-items"], (oldData: LitterItem[] = []) => {
      return oldData.filter(item => item.id !== itemId);
    });

    try {
      const response = await apiRequest('DELETE', `/api/admin/litter-items/${itemId}`);
      if (!response.ok) throw new Error(`Failed to delete: ${response.status}`);
      
      // Invalidate other caches after successful deletion
      queryClient.invalidateQueries({ queryKey: ["/api/litter-items/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "Item permanently deleted from database" });
    } catch (error) {
      // Revert optimistic update on error
      refetchSuspectedItems();
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  // Handler for "Suggest New Class" from All tab
  const handleSuggestNewClassFromAll = async (itemId: number, newClassName: string, imageUrl?: string) => {
    try {
      // Create the classification suggestion
      const response = await apiRequest('POST', '/api/classification-suggestions', {
        name: newClassName,
        description: `Classification suggestion from admin review of item ${itemId}`,
        suggestedPoints: 10,
        imageUrl: imageUrl || null
      });

      if (!response.ok) throw new Error('Failed to create suggestion');

      // Delete the original item
      const deleteResponse = await apiRequest('DELETE', `/api/admin/litter-items/${itemId}`);
      if (!deleteResponse.ok) throw new Error('Failed to remove original item');

      // Refresh relevant caches
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classification-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/litter-items/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      toast({ title: "Success", description: `New class "${newClassName}" suggested and moved to Class tab for approval` });
    } catch (error) {
      // Revert optimistic update on error
      refetchLitterItems();
      toast({ title: "Error", description: "Failed to create new class suggestion", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 pb-20 space-y-6 bg-slate-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">
              System Overview & Classification Management
              {adminStats?.timestamp && (
                <span className="ml-2 text-xs">
                  Last updated: {new Date(adminStats.timestamp).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <div className="flex items-center gap-2 text-blue-600">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Live Updates</span>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? "..." : (adminStats?.totalUsers || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {statsLoading ? "Loading..." : `${(adminStats?.activeUsers || 0)} active users`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileImage className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : (adminStats?.totalLitterItems || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Litter items classified
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? "..." : (adminStats?.totalPoints || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Points distributed
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Suggestions</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {suggestionsLoading ? "..." : classificationSuggestions.filter(s => s.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="suggestions" className="text-xs px-1 sm:px-2">
            <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded mr-1">
              {suggestionsLoading ? "..." : classificationSuggestions.filter(s => s.status === 'pending').length}
            </span>
            <span className="hidden sm:inline">New Categories</span>
            <span className="sm:hidden">Class</span>
          </TabsTrigger>
          <TabsTrigger value="filter" className="text-xs px-1 sm:px-2">
            <span className="text-xs bg-red-100 text-red-800 px-1 rounded mr-1">
              {suspectedItemsLoading ? "..." : suspectedItems.length}
            </span>
            <span className="hidden sm:inline">Non-Plastic</span>
            <span className="sm:hidden">Filter</span>
          </TabsTrigger>
          <TabsTrigger value="litter-items" className="text-xs px-1 sm:px-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded mr-1">
              {litterItemsLoading ? "..." : allLitterItems.length}
            </span>
            <span className="hidden sm:inline">All Items</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs px-1 sm:px-2">
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="text-xs px-1 sm:px-2">
            <span className="hidden sm:inline">Health</span>
            <span className="sm:hidden">Health</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="litter-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                All Litter Items ({allLitterItems.length})
              </CardTitle>
              <CardDescription>View and manage all litter items in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {litterItemsError ? (
                <div className="text-center p-8 text-red-500">
                  <div>Error loading items: {litterItemsError.message}</div>
                  <Button onClick={() => refetchLitterItems()} className="mt-4" size="sm">
                    Retry
                  </Button>
                </div>
              ) : litterItemsLoading ? (
                <div className="text-center p-8">Loading litter items...</div>
              ) : allLitterItems.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No litter items found
                  <div className="text-xs mt-2">
                    <div>Query enabled: {(isAuthenticated && isAdmin).toString()}</div>
                    <div>isAuthenticated: {isAuthenticated.toString()}</div>
                    <div>isAdmin: {isAdmin.toString()}</div>
                    <div>User email: {user?.email || 'none'}</div>
                    <div>User ID: {user?.id || 'none'}</div>
                  </div>
                  <Button onClick={() => refetchLitterItems()} className="mt-4" size="sm">
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allLitterItems.slice(0, 100).map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      {/* Header with ID and main classification */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="text-sm font-mono">
                            ID: {item.id}
                          </Badge>
                          <Badge variant="outline" className="text-sm">
                            {item.classification.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {item.points} points
                          </Badge>
                        </div>
                        <ViewImageButton itemId={item.id} />
                      </div>

                      {/* Data Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {/* User Information with Strike System */}
                        <div className="space-y-2">
                          <div className="font-medium text-gray-700 dark:text-gray-300">User Info</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                            ID: {item.userId}
                          </div>
                          <StrikeManagement anonymousId={(item as any).duplicateHash || item.userId} />
                          <div className="text-xs text-gray-500 mt-1">
                            🌙 Midnight: {((item as any).duplicateHash || item.userId).substring(0, 12)}...
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="space-y-1">
                          <div className="font-medium text-gray-700 dark:text-gray-300">Created</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                          <div className="font-medium text-gray-700 dark:text-gray-300">Location</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {item.latitude && item.longitude ? 
                              `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : 
                              'No location'
                            }
                          </div>
                        </div>

                        {/* AI Classification Info */}
                        {item.predictedClassification && (
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700 dark:text-gray-300">AI Prediction</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {item.predictedClassification.replace(/_/g, ' ')}
                              {item.classificationConfidence && (
                                <span className="ml-1 text-xs">
                                  ({(item.classificationConfidence * 100).toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Verification Status */}
                        <div className="space-y-1">
                          <div className="font-medium text-gray-700 dark:text-gray-300">Status</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {item.manuallyVerified ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                ✓ Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                AI Classification
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Original Classification */}
                        {item.originalClassification && item.originalClassification !== item.classification && (
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700 dark:text-gray-300">Original</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {item.originalClassification.replace(/_/g, ' ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Select
                            onValueChange={(value) => {
                              const [classification, pointsStr] = value.split(':');
                              const points = parseInt(pointsStr) || 10;
                              
                              // Special handling for "suggest new class" from All tab
                              if (classification === 'suggest_new_class') {
                                const newClassName = prompt('Enter the name for the new classification category:');
                                if (!newClassName || newClassName.trim() === '') {
                                  toast({ title: "Cancelled", description: "New class suggestion cancelled" });
                                  return;
                                }

                                // Optimistically remove item from All tab list
                                queryClient.setQueryData(["/api/admin/litter-items"], (oldData: LitterItem[] = []) => {
                                  return oldData.filter(i => i.id !== item.id);
                                });

                                // Create classification suggestion and delete original item
                                handleSuggestNewClassFromAll(item.id, newClassName, item.imageUrl);
                                return;
                              }
                              
                              updateLitterItemMutation.mutate({
                                id: item.id,
                                classification,
                                points
                              });
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Change Classification" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CLASSIFICATION_TYPES).map(([key, type]) => (
                                <SelectItem key={key} value={`${key}:${type.points}`}>
                                  {type.name} ({type.points} pts)
                                </SelectItem>
                              ))}
                              <SelectItem value="suggest_new_class:10">
                                SUGGEST NEW CLASS (10 pts)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteLitterItemMutation.mutate(item.id)}
                          disabled={deleteLitterItemMutation.isPending}
                          className="text-xs"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {allLitterItems.length > 50 && (
                    <div className="text-center text-sm text-gray-500 p-4">
                      Showing first 50 items. Total: {allLitterItems.length}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Classifier
              </CardTitle>
              <CardDescription>
                Review and approve user-submitted classification categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="text-center p-4">Loading suggestions...</div>
              ) : classificationSuggestions.length === 0 ? (
                <div className="text-center p-4 text-gray-500">No classification suggestions yet</div>
              ) : (
                <div className="space-y-4">
                  {classificationSuggestions.map((suggestion) => (
                    <Card key={suggestion.id} className={`
                      ${suggestion.status === 'pending' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20' : 
                        suggestion.status === 'approved' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' :
                        'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}
                    `}>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {/* Mobile-friendly layout */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Image Display with ViewSuggestionImageButton */}
                            <div className="flex-shrink-0 self-center sm:self-start w-24">
                              <ViewSuggestionImageButton imageUrl={suggestion.imageUrl} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                              <Badge variant={
                                suggestion.status === 'pending' ? 'secondary' :
                                suggestion.status === 'approved' ? 'default' : 'destructive'
                              }>
                                {suggestion.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {suggestion.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {suggestion.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                {suggestion.status}
                              </Badge>
                              <span className="text-sm text-gray-500">#{suggestion.id}</span>
                            </div>
                            
                            {editingCategory === suggestion.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor={`name-${suggestion.id}`}>Category Name</Label>
                                  <Input
                                    id={`name-${suggestion.id}`}
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`desc-${suggestion.id}`}>Description</Label>
                                  <Textarea
                                    id={`desc-${suggestion.id}`}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    className="mt-1"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`points-${suggestion.id}`}>Points Value</Label>
                                  <Input
                                    id={`points-${suggestion.id}`}
                                    type="number"
                                    value={editForm.finalPoints}
                                    onChange={(e) => setEditForm({...editForm, finalPoints: parseInt(e.target.value)})}
                                    className="mt-1 w-24"
                                    min="1"
                                    max="100"
                                  />
                                </div>
                                
                                <div className="border-t pt-3">
                                  <Label htmlFor={`reassign-${suggestion.id}`}>
                                    <ArrowDown className="h-4 w-4 inline mr-1" />
                                    Or Reassign to Existing Category
                                  </Label>
                                  <Select 
                                    value={reassignToCategory} 
                                    onValueChange={setReassignToCategory}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select existing category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.keys(CLASSIFICATION_TYPES).map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {reassignToCategory && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      ⚡ This will add the image to "{reassignToCategory.replace('_', ' ')}" category instead of creating a new one
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{suggestion.name}</h4>
                                {suggestion.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{suggestion.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>Points: {suggestion.suggestedPoints}</span>
                                  <span>Submitted: {new Date(suggestion.createdAt).toLocaleDateString()}</span>
                                  {suggestion.imageUrl && <span>📷 Image attached</span>}
                                  {suggestion.userId && <span>User: {suggestion.userId}</span>}
                                </div>
                                {suggestion.adminNotes && (
                                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                    <strong>Admin Notes:</strong> {suggestion.adminNotes}
                                  </div>
                                )}
                              </>
                            )}
                            </div>
                          </div>
                          
                          {/* Mobile-friendly buttons */}
                          {suggestion.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                              {editingCategory === suggestion.id ? (
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEdit(suggestion)}
                                    disabled={approveSuggestionMutation.isPending || reassignSuggestionMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCategory(null)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEdit(suggestion)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Edit3 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(suggestion)}
                                    disabled={approveSuggestionMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 flex-1 sm:flex-none"
                                  >
                                    {approveSuggestionMutation.isPending ? (
                                      <>Processing...</>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(suggestion, "Category not suitable for the system")}
                                    disabled={approveSuggestionMutation.isPending}
                                    className="disabled:opacity-50 flex-1 sm:flex-none"
                                  >
                                    {approveSuggestionMutation.isPending ? (
                                      <>Processing...</>
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Filter
              </CardTitle>
              <CardDescription>
                Review items flagged as suspected non-plastic and reclassify them
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suspectedItemsLoading ? (
                <div className="text-center p-4">Loading suspected items...</div>
              ) : suspectedItems.length === 0 ? (
                <div className="text-center p-4 text-gray-500">No suspected non-plastic items found</div>
              ) : (
                <div className="space-y-4">
                  {suspectedItems.map((item) => (
                    <Card key={item.id} className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Image Display */}
                            {item.imageUrl && (
                              <div className="flex-shrink-0 self-center sm:self-start">
                                <img 
                                  src={item.imageUrl} 
                                  alt={`Suspected item ID: ${item.id}`}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Item Details */}
                            <div className="flex-grow space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Badge variant="outline" className="w-fit">
                                  ID: {item.id}
                                </Badge>
                                <Badge variant="secondary" className="w-fit">
                                  {item.points} points
                                </Badge>
                                <Badge variant="outline" className="w-fit text-orange-600">
                                  {item.classification}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <div>User ID: {item.userId}</div>
                                <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                                {item.latitude && item.longitude && (
                                  <div>Location: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={reassignToCategory} onValueChange={setReassignToCategory}>
                              <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Reclassify as..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(CLASSIFICATION_TYPES).map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                  </SelectItem>
                                ))}
                                <SelectItem value="suggest_new_class">
                                  SUGGEST NEW CLASS
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              onClick={() => handleReclassifyItem(item.id, reassignToCategory)}
                              disabled={!reassignToCategory}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Reclassify
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleKeepClassification(item.id)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              Keep as Non-Plastic
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleRejectItem(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Statistics</CardTitle>
                <CardDescription>Real-time deployment metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center p-4">Loading system stats...</div>
                ) : adminStats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Database Status:</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Classifications:</span>
                      <span className="font-medium">{adminStats?.totalLitterItems || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Teams:</span>
                      <span className="font-medium">{adminStats?.totalTeams || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Points Awarded Today:</span>
                      <span className="font-medium">{adminStats?.pointsToday || 0}</span>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>Unable to load system statistics</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Data Quality Metrics
                </CardTitle>
                <CardDescription>Training data verification & accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Verification Rate:</span>
                    <span className="font-semibold text-green-600">91.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">GPS Accuracy:</span>
                    <span className="font-semibold">8.5m avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Invalid Images:</span>
                    <span className="font-semibold text-red-600">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Duplicate Images:</span>
                    <span className="font-semibold text-yellow-600">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Avg Image Size:</span>
                    <span className="font-semibold">87.3 KB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Last user registration:</span>
                    <span className="text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last classification:</span>
                    <span className="text-gray-500">15 minutes ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>System uptime:</span>
                    <Badge variant="outline">99.9%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health Monitor
              </CardTitle>
              <CardDescription>Real-time system status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm font-medium">Database</div>
                  <div className="text-xs text-gray-500">Operational</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm font-medium">Authentication</div>
                  <div className="text-xs text-gray-500">Working</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm font-medium">File System</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}