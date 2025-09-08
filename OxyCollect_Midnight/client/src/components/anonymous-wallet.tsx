import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Shield, Key, Copy, RefreshCw, Coins, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnonymousIdentity {
  publicHash: string;
  balance: string;
  totalActions: number;
  memberSince: Date;
  lastActive: Date;
}

interface AnonymousWalletProps {
  sessionId?: string;
}

export default function AnonymousWallet({ sessionId }: AnonymousWalletProps) {
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string>('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load existing anonymous identity from localStorage
  useEffect(() => {
    const savedIdentity = localStorage.getItem('anonymousIdentity');
    if (savedIdentity) {
      try {
        const parsed = JSON.parse(savedIdentity);
        setIdentity(parsed);
        // Refresh stats from server
        refreshStats(parsed.publicHash);
      } catch (e) {
        console.error('Failed to parse saved identity:', e);
      }
    }
  }, []);

  // Create new anonymous identity
  const createAnonymousIdentity = async (withRecovery = false) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/anonymous/create-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableRecovery: withRecovery, sessionId })
      });
      
      const result = await response.json();
      
      if (result.identity) {
        setIdentity(result.identity);
        localStorage.setItem('anonymousIdentity', JSON.stringify(result.identity));
        
        if (result.recovery) {
          setRecoveryPhrase(result.recovery.recoveryPhrase);
          setShowRecovery(true);
          
          toast({
            title: "🔐 Anonymous Wallet Created!",
            description: "Save your recovery phrase to restore your tokens later",
            variant: "default",
          });
        } else {
          toast({
            title: "🌙 Session Wallet Created!",
            description: "Your tokens will be available during this session only",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Failed to create identity:', error);
      toast({
        title: "Creation Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Recover anonymous identity
  const recoverIdentity = async () => {
    if (!recoveryInput.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/anonymous/recover-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryPhrase: recoveryInput.trim() })
      });
      
      const result = await response.json();
      
      if (result.identity) {
        setIdentity(result.identity);
        localStorage.setItem('anonymousIdentity', JSON.stringify(result.identity));
        setRecoveryInput('');
        
        toast({
          title: "🔄 Wallet Recovered!",
          description: `${result.identity.balance} OXY tokens restored`,
          variant: "default",
        });
      } else {
        toast({
          title: "Recovery Failed",
          description: "Invalid recovery phrase",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      toast({
        title: "Recovery Error",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh stats from server
  const refreshStats = async (publicHash: string) => {
    try {
      const response = await fetch(`/api/anonymous/stats/${publicHash}`);
      if (response.ok) {
        const stats = await response.json();
        const updatedIdentity = { ...identity, ...stats };
        setIdentity(updatedIdentity);
        localStorage.setItem('anonymousIdentity', JSON.stringify(updatedIdentity));
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied!`,
      description: "Saved to clipboard",
      variant: "default",
    });
  };

  if (!identity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Anonymous Environmental Wallet
          </CardTitle>
          <CardDescription>
            Earn OXY tokens for environmental actions without compromising privacy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="recover">Recover Existing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-3">
                <Button 
                  onClick={() => createAnonymousIdentity(false)}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Session Only (Most Private)
                </Button>
                
                <Button 
                  onClick={() => createAnonymousIdentity(true)}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  With Recovery Phrase (Recommended)
                </Button>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Session Only:</strong> Tokens available during browser session only. Most private option.
                  <br />
                  <strong>With Recovery:</strong> Get a 12-word phrase to restore your tokens on any device.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="recover" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="recovery">12-Word Recovery Phrase</Label>
                <Input
                  id="recovery"
                  placeholder="Enter your recovery phrase..."
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                />
                <Button 
                  onClick={recoverIdentity}
                  disabled={isLoading || !recoveryInput.trim()}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recover Wallet
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recovery Phrase Display */}
      {showRecovery && recoveryPhrase && (
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">🔑 Your Recovery Phrase (Save This!):</div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                {recoveryPhrase}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(recoveryPhrase, 'Recovery Phrase')}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRecovery(false)}
                >
                  I've Saved It
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-600" />
              Anonymous Environmental Wallet
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refreshStats(identity.publicHash)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Privacy-protected environmental rewards • No KYC required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Display */}
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {identity.balance}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Environmental Tokens
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{identity.totalActions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Environmental Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.floor((Date.now() - new Date(identity.memberSince).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
            </div>
          </div>

          {/* Anonymous ID */}
          <div>
            <Label className="text-xs">Anonymous ID</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1">
                {identity.publicHash.substring(0, 16)}...
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(identity.publicHash, 'Anonymous ID')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Privacy Features */}
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="font-medium mb-1">🛡️ Complete Privacy Protection:</div>
              <div className="space-y-1">
                • No personal information stored or required
                • Tokens linked to anonymous cryptographic hash only
                • Actions tracked without identity exposure
                • Ready for governance voting & environmental trading
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}