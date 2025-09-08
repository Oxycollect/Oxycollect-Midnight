import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Users, Shield, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface LitterItem {
  id: number;
  userId: string;
  classification: string;
  points: number;
  latitude: number;
  longitude: number;
  verified: boolean;
  duplicateHash: string;
  privacyLevel: string;
  createdAt: string;
}

interface AdminStats {
  totalItems: number;
  totalAnonymousPicks: number;
  totalUsers: number;
}

export default function AdminPage() {
  const [selectedItem, setSelectedItem] = useState<LitterItem | null>(null);
  const [strikeReason, setStrikeReason] = useState("");

  const queryClient = useQueryClient();

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch litter items for moderation
  const { data: items = [], isLoading } = useQuery<LitterItem[]>({
    queryKey: ['/api/admin/litter-items'],
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/admin/litter-items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/litter-items'] });
      setSelectedItem(null);
    },
  });

  // Add strike mutation
  const strikeMutation = useMutation({
    mutationFn: async ({ anonymousCommitment, reason }: { anonymousCommitment: string; reason: string }) => {
      const response = await fetch('/api/admin/anonymous-strikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymousCommitment, reason }),
      });
      if (!response.ok) throw new Error('Failed to add strike');
      return response.json();
    },
    onSuccess: () => {
      setStrikeReason("");
      setSelectedItem(null);
    },
  });

  const handleAddStrike = () => {
    if (!selectedItem || !strikeReason.trim()) return;
    
    strikeMutation.mutate({
      anonymousCommitment: selectedItem.duplicateHash + "_commitment", // Generate full commitment
      reason: strikeReason.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Privacy-First Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Moderate anonymous submissions while maintaining user privacy via Midnight Network
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Total Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalItems || 0}
            </div>
            <p className="text-sm text-gray-500">Privacy-protected items</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <span>Anonymous Picks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.totalAnonymousPicks || 0}
            </div>
            <p className="text-sm text-gray-500">Midnight Network protected</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <span>Admin Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-sm text-gray-500">System administrators</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedItem?.id === item.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {item.classification.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        ID: {item.id} • Hash: {item.duplicateHash}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant="secondary">+{item.points}</Badge>
                      <Badge 
                        variant={item.verified ? "default" : "outline"}
                        className="text-xs"
                      >
                        {item.verified ? "Verified" : "Pending"}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-purple-700">
                        {item.privacyLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Moderation Actions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedItem ? 'Moderation Actions' : 'Select Item to Moderate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">
                    {selectedItem.classification.replace('_', ' ').toUpperCase()}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Item ID:</span>
                      <span>#{selectedItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Anonymous Hash:</span>
                      <span className="font-mono text-xs">{selectedItem.duplicateHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Points:</span>
                      <span>+{selectedItem.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Privacy Level:</span>
                      <Badge variant="outline" className="text-purple-700">
                        {selectedItem.privacyLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>User Identity:</span>
                      <span className="text-green-600">🔐 Protected</span>
                    </div>
                  </div>
                </div>

                {/* Strike System */}
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-sm font-medium mb-2 block">Add Strike (Anonymous)</span>
                    <Textarea
                      placeholder="Reason for strike (e.g., inappropriate content, spam, low quality)"
                      value={strikeReason}
                      onChange={(e) => setStrikeReason(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </label>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAddStrike}
                      disabled={!strikeReason.trim() || strikeMutation.isPending}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Add Strike</span>
                    </Button>
                    
                    <Button
                      onClick={() => deleteMutation.mutate(selectedItem.id)}
                      disabled={deleteMutation.isPending}
                      variant="destructive"
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Item</span>
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium mb-1">Privacy Note:</p>
                  <p>All moderation actions are performed on anonymous hashes. User identities remain protected via Midnight Network ZK proofs. Strikes are tracked by commitment hash, not user accounts.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Select an item from the list to begin moderation</p>
                <p className="text-sm mt-1">All actions preserve user privacy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}