import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { DiatomLogo } from "@/components/diatom-logo";
import iconClean from "@assets/icon-clean.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, User, Leaf, Camera, Users, Award, ExternalLink, Eye, EyeOff, Info } from "lucide-react";
import { SiGoogle, SiGithub, SiX } from "react-icons/si";

interface AuthMethods {
  email: boolean;
  google: boolean;
  github: boolean;
  twitter: boolean;
}

interface AppVersion {
  version: string;
  versionName?: string;
  buildDate: string;
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Anonymous session creation
  const createAnonymousSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/anonymous/create-session', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create anonymous session');
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('anonymousSessionId', data.sessionId);
      // Redirect to anonymous classification page
      setLocation("/anonymous");
    }
  });

  // Check available auth methods
  const { data: authMethods } = useQuery<AuthMethods>({
    queryKey: ['/api/auth/methods'],
  });

  // Get app version info
  const { data: versionInfo } = useQuery<AppVersion>({
    queryKey: ['/api/version'],
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: { 
      email: string; 
      password: string; 
      displayName?: string;
      firstName?: string; 
      lastName?: string; 
      isSignUp?: boolean;
      termsAccepted?: boolean;
      privacyPolicyAccepted?: boolean;
      ageConfirmed?: boolean;
    }) => {
      const endpoint = credentials.isSignUp ? '/api/auth/register' : '/api/auth/login';
      const response = await apiRequest('POST', endpoint, credentials);
      return response.json();
    },
    onSuccess: (userData) => {
      // Update the auth context
      queryClient.setQueryData(['/api/auth/user'], userData);
      
      toast({
        title: "Welcome to Oxy Collect!",
        description: `Hi ${userData.displayName || userData.firstName || 'there'}! Ready to start your environmental impact journey?`,
      });
      
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: async (resetEmail: string) => {
      const response = await apiRequest('POST', '/api/auth/reset-password-request', { 
        email: resetEmail
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions. (CHECK JUNK FOLDER)",
        variant: "default",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    passwordResetMutation.mutate(resetEmail.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For sign-up, validate terms acceptance
    if (isSignUp && (!termsAccepted || !privacyAccepted || !ageConfirmed)) {
      toast({
        title: "Terms Required",
        description: "Please accept all terms to create your account.",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && !firstName.trim()) {
      toast({
        title: "First name required",
        description: "Please enter your first name to create an account",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password: password.trim(),
      displayName: displayName.trim() || undefined,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      isSignUp: isSignUp,
      termsAccepted: isSignUp ? termsAccepted : undefined,
      privacyPolicyAccepted: isSignUp ? privacyAccepted : undefined,
      ageConfirmed: isSignUp ? ageConfirmed : undefined
    }, {
      onSuccess: () => {
        // Trigger PWA update check when user logs in
        if (typeof window !== 'undefined' && (window as any).triggerPWAUpdateCheck) {
          (window as any).triggerPWAUpdateCheck();
        }
      }
    });
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm dark:border-gray-700">
            <CardHeader className="space-y-4 text-center">
              <div className="flex justify-center">
                <img src={iconClean} alt="Oxy Collect" className="w-16 h-16" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Join Oxy Collect
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                Start your environmental impact journey with AI-powered litter classification
              </p>
            </CardHeader>
            
            <CardContent>
              {/* Toggle between Login and Sign Up */}
              <div className="text-center mb-6">
                <div className="flex border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                      !isSignUp 
                        ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                      isSignUp 
                        ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-teal-200 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-teal-200 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 dark:bg-gray-700 dark:text-white pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent dark:hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                        <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Display Name</span>
                      </Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="How you'd like others to see you"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="border-teal-200 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">This is how your name appears on leaderboards and teams</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                          <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>First Name</span>
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="border-teal-200 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-200">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="border-teal-200 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Terms Acceptance for Sign Up */}
                    <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Required Agreements</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="terms" 
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                          />
                          <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            I have read and accept the{" "}
                            <a
                              href="/terms"
                              target="_blank"
                              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline inline-flex items-center"
                            >
                              Terms of Service
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="privacy" 
                            checked={privacyAccepted}
                            onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                          />
                          <label htmlFor="privacy" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            I have read and accept the{" "}
                            <a
                              href="https://oxycollect.org/privacy"
                              target="_blank"
                              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline inline-flex items-center"
                            >
                              Privacy Policy
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="age" 
                            checked={ageConfirmed}
                            onCheckedChange={(checked) => setAgeConfirmed(checked === true)}
                          />
                          <label htmlFor="age" className="text-sm text-gray-700 dark:text-gray-300">
                            I confirm that I am at least 13 years old
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-6 text-lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending 
                    ? (isSignUp ? "Creating Account..." : "Signing In...") 
                    : (isSignUp ? "Create Account" : "Sign In")
                  }
                </Button>
              </form>
              
              {/* Anonymous Tracking Option */}
              <div className="mt-4 flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => createAnonymousSessionMutation.mutate()}
                  disabled={createAnonymousSessionMutation.isPending}
                  className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  {createAnonymousSessionMutation.isPending ? "Starting..." : "Track Anonymously"}
                </Button>
              </div>
              
              {!isSignUp && (
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline h-auto p-0"
                  >
                    Forgot your password?
                  </Button>
                </div>
              )}

              {/* Password Reset Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Reset Password</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmail("");
                        }}
                      >
                        ×
                      </Button>
                    </div>
                    
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div>
                        <Label htmlFor="resetEmail">Email Address</Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="Enter your email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="border-teal-200 focus:border-teal-500"
                          required
                        />
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        We'll send you a link to reset your password.
                      </p>
                      
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmail("");
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                          disabled={passwordResetMutation.isPending}
                        >
                          {passwordResetMutation.isPending ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>{isSignUp ? "By creating an account, you're joining the environmental cleanup movement!" : "Welcome back to your environmental impact journey!"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Hero Section */}
        <div className="lg:pl-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
              Transform Environmental Cleanup with AI
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              Join the world's largest community using artificial intelligence to classify litter, 
              earn rewards, and create real environmental impact through citizen science.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <Camera className="w-6 h-6 text-teal-600 dark:text-teal-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Classification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Advanced CNN model identifies plastic types with 91%+ accuracy</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <Award className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">OXY Tokens</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Earn rewards for verified cleanup activities</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Team Collaboration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Join teams and compete in environmental challenges</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              <Leaf className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Real Impact</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contributing to open environmental research and cleanup data</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-xl">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">Ready to make a difference?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Join thousands of environmental heroes using AI and blockchain technology 
              to fight plastic pollution. Every photo you take helps train our AI and 
              creates a cleaner world.
            </p>
          </div>

          {/* App Version Info */}
          {versionInfo && (
            <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Oxy Collect v{versionInfo.version} • {new Date(versionInfo.buildDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}