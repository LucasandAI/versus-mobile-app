
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { AuthMode, SignupFormValues, ProfileFormValues } from '@/types/auth';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadAvatar } from '@/components/profile/edit-profile/uploadAvatar';
import AvatarSection from '@/components/profile/edit-profile/AvatarSection';
import SocialLinksSection from '@/components/profile/edit-profile/SocialLinksSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

// Sign-up form schema with password confirmation
const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reset password email schema
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

// OTP verification schema
const verifyOtpSchema = z.object({
  otp: z.string().length(6, { message: 'Please enter all 6 digits' }),
});

// New password schema
const newPasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile completion schema
const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  bio: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

const LoginForm: React.FC = () => {
  const { signIn, needsProfileCompletion, setNeedsProfileCompletion } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState(''); // Store email for verification
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetPasswordStep, setResetPasswordStep] = useState<'email' | 'verify' | 'newPassword'>('email');
  const [resetEmail, setResetEmail] = useState('');
  
  // Form keys to force re-render when needed
  const [formKey, setFormKey] = useState(Date.now());
  
  // Profile form state
  const [avatar, setAvatar] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  
  // Social media links
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [tiktok, setTiktok] = useState('');

  // Email verification form
  const emailVerificationForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Effect to check if we need to show the profile completion form
  useEffect(() => {
    const checkProfileCompletionStatus = async () => {
      // Check if we have an authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if the user has a profile in the users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('[LoginForm] Error checking user profile:', error);
        }
        
        // If we have an auth session but no user profile, the user needs to complete their profile
        if (!userProfile && session.user) {
          console.log('[LoginForm] User authenticated but profile not found, showing profile completion');
          setAuthMode('profile-completion');
          setUserId(session.user.id);
        }
      }
    };
    
    // If needsProfileCompletion is true from the context, set the auth mode
    if (needsProfileCompletion) {
      checkProfileCompletionStatus();
    }
  }, [needsProfileCompletion]);

  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Verify OTP form
  const verifyOtpForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // New password form - adding mode: "onChange" for better validation experience
  const newPasswordForm = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: "onChange", // This enables validation as the user types
  });

  // Reset forms when dialog opens/closes or steps change
  useEffect(() => {
    if (isResetDialogOpen) {
      // Reset all forms when dialog opens
      resetPasswordForm.reset();
      verifyOtpForm.reset();
      newPasswordForm.reset();
    }
  }, [isResetDialogOpen, resetPasswordStep]); 

  // Special effect to reset the new password form when moving to that step
  useEffect(() => {
    if (resetPasswordStep === 'newPassword') {
      console.log('[LoginForm] Moving to newPassword step, resetting form');
      setFormKey(Date.now()); // Force re-render
      newPasswordForm.reset({
        password: '',
        confirmPassword: '', // Explicitly reset confirmPassword
      });
    }
  }, [resetPasswordStep, newPasswordForm]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      console.log('[LoginForm] Local preview URL created:', previewUrl);
      setAvatar(previewUrl);
      setAvatarFile(file);
      setPreviewKey(Date.now());
    }
  };

  // Reset loading state after 10 seconds to prevent getting stuck
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setError('Operation is taking longer than expected. Please try again.');
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Sign-up form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Profile completion form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: '',
    },
  });

  const handleLogin = async (values: LoginFormValues) => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[LoginForm] Submitting login form with email:', values.email);
      const user = await signIn(values.email, values.password);
      
      if (user) {
        console.log('[LoginForm] Sign-in successful:', user.id);
        // The navigation will be handled by the auth state change listener
      } else {
        console.error('[LoginForm] Login failed: No user returned');
        setError("Login failed. Please check your credentials and try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[LoginForm] Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setIsResetDialogOpen(true);
    setResetPasswordStep('email');
    resetPasswordForm.reset();
    verifyOtpForm.reset();
    newPasswordForm.reset();
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email);
      
      if (error) throw error;
      
      setResetEmail(values.email);
      setResetPasswordStep('verify');
      toast({
        title: "Verification code sent",
        description: "Please check your email for a 6-digit verification code"
      });
    } catch (error) {
      console.error('[LoginForm] Password reset error:', error);
      toast({
        title: "Could not send verification code",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (values: VerifyOtpFormValues) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: values.otp,
        type: 'recovery'
      });
      
      if (error) throw error;
      
      setResetPasswordStep('newPassword');
      toast({
        title: "Code verified",
        description: "Please set your new password"
      });
    } catch (error) {
      console.error('[LoginForm] OTP verification error:', error);
      toast({
        title: "Invalid verification code",
        description: error instanceof Error ? error.message : "Please check and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (values: NewPasswordFormValues) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });
      
      if (error) throw error;
      
      setIsResetDialogOpen(false);
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You can now log in with your new password."
      });
    } catch (error) {
      console.error('[LoginForm] Password update error:', error);
      toast({
        title: "Failed to update password",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      console.log('[LoginForm] Submitting signup form with email:', values.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        // Check if the error is about the user already existing
        if (error.message && error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('already')) {
          throw new Error('This email address is already registered. Please use a different email or try logging in.');
        }
        throw error;
      }

      if (data.user) {
        console.log('[LoginForm] Signup successful, user:', data.user.id);
        setUserId(data.user.id);
        setSignupEmail(values.email);
        
        // Check if email confirmation is required
        if (data.session) {
          // User is authenticated immediately, proceed to profile completion
          setAuthMode('profile-completion');
          setNeedsProfileCompletion(true);
          
          toast({
            title: "Sign-up successful",
            description: "Please complete your profile",
          });
        } else {
          // Email confirmation is required
          setAuthMode('email-verification');
          toast({
            title: "Check your email",
            description: "We've sent you a 6-digit verification code.",
          });
        }
      }
    } catch (error) {
      console.error('[LoginForm] Signup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupEmail = async (values: VerifyOtpFormValues) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: signupEmail,
        token: values.otp,
        type: 'signup'
      });
      
      if (error) throw error;
      
      if (data.user) {
        setUserId(data.user.id);
        setAuthMode('profile-completion');
        setNeedsProfileCompletion(true);
        
        toast({
          title: "Email verified",
          description: "Please complete your profile"
        });
      }
    } catch (error) {
      console.error('[LoginForm] Email verification error:', error);
      toast({
        title: "Invalid verification code",
        description: error instanceof Error ? error.message : "Please check and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail
      });
      
      if (error) throw error;
      
      toast({
        title: "Verification code sent",
        description: "Please check your email for a new 6-digit code"
      });
    } catch (error) {
      console.error('[LoginForm] Resend verification error:', error);
      toast({
        title: "Could not resend code",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCompletion = async (values: ProfileFormValues) => {
    if (isLoading || !userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[LoginForm] Starting profile completion for user:', userId);
      
      let avatarUrl = '';
      
      // Upload avatar if provided
      if (avatarFile) {
        console.log('[LoginForm] Uploading avatar file');
        const uploadedUrl = await uploadAvatar(userId, avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          console.log('[LoginForm] Avatar uploaded successfully:', uploadedUrl);
        }
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: values.name,
          bio: values.bio || '',
          avatar: avatarUrl || '/placeholder.svg',
          instagram: instagram || null,
          linkedin: linkedin || null,
          twitter: twitter || null,
          facebook: facebook || null,
          website: website || null,
          tiktok: tiktok || null,
        });
      
      if (profileError) {
        console.error('[LoginForm] Profile creation error:', profileError);
        throw profileError;
      }
      
      console.log('[LoginForm] Profile created successfully');
      setNeedsProfileCompletion(false);
      
      toast({
        title: "Profile completed",
        description: "Welcome to Versus! Your profile has been set up successfully.",
      });
    } catch (error) {
      console.error('[LoginForm] Profile completion error:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete profile');
      toast({
        title: "Profile completion failed",
        description: error instanceof Error ? error.message : "An error occurred while setting up your profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    // Email verification form
    if (authMode === 'email-verification') {
      return (
        <Form {...emailVerificationForm}>
          <form onSubmit={emailVerificationForm.handleSubmit(handleVerifySignupEmail)} className="space-y-6">
            <h2 className="text-xl font-bold text-center">Verify Your Email</h2>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">
                Enter the 6-digit verification code sent to <span className="font-semibold">{signupEmail}</span>
              </p>
            </div>
            
            <FormField
              control={emailVerificationForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || emailVerificationForm.watch('otp')?.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </div>
            
            <div className="text-center text-sm">
              <Button 
                variant="link" 
                type="button"
                className="p-0 h-auto text-sm"
                onClick={handleResendVerificationCode}
                disabled={isLoading}
              >
                Didn't receive a code? Send again
              </Button>
            </div>
            
            <div className="text-center text-sm">
              <Button 
                variant="link" 
                type="button"
                className="p-0 h-auto text-sm"
                onClick={() => setAuthMode('signup')}
                disabled={isLoading}
              >
                Back to sign up
              </Button>
            </div>
          </form>
        </Form>
      );
    }

    if (authMode === 'profile-completion') {
      return (
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(handleProfileCompletion)} className="space-y-6">
            <h2 className="text-xl font-bold text-center">Complete Your Profile</h2>
            
            <AvatarSection
              name={profileForm.watch('name') || ""}
              avatar={avatar}
              handleAvatarChange={handleAvatarChange}
              previewKey={previewKey}
            />
            
            <div className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        type="text"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio <span className="text-gray-500 text-xs italic">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Say something about yourself (optional)"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <SocialLinksSection
              instagram={instagram}
              setInstagram={setInstagram}
              linkedin={linkedin}
              setLinkedin={setLinkedin}
              twitter={twitter}
              setTwitter={setTwitter}
              facebook={facebook}
              setFacebook={setFacebook}
              website={website}
              setWebsite={setWebsite}
              tiktok={tiktok}
              setTiktok={setTiktok}
            />
            
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </Form>
      );
    }

    return (
      <Tabs defaultValue="login" value={authMode} onValueChange={(value) => setAuthMode(value as AuthMode)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <Button 
                  variant="link" 
                  type="button" 
                  className="p-0 h-auto text-sm" 
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot password?
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('signup')}>Sign up</Button></p>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="signup">
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signupForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('login')}>Log in</Button></p>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    );
  };

  const renderResetPasswordForm = () => {
    switch (resetPasswordStep) {
      case 'email':
        return (
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <FormField
                control={resetPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </div>
            </form>
          </Form>
        );
        
      case 'verify':
        return (
          <Form {...verifyOtpForm}>
            <form onSubmit={verifyOtpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">
                  Enter the 6-digit verification code sent to <span className="font-semibold">{resetEmail}</span>
                </p>
              </div>
              
              <FormField
                control={verifyOtpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetPasswordStep('email')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || verifyOtpForm.watch('otp')?.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </div>
              
              <div className="text-center text-sm pt-2">
                <Button 
                  variant="link" 
                  type="button"
                  className="p-0 h-auto text-sm"
                  onClick={() => resetPasswordForm.handleSubmit(handleResetPassword)()}
                  disabled={isLoading}
                >
                  Didn't receive a code? Send again
                </Button>
              </div>
            </form>
          </Form>
        );
        
      case 'newPassword':
        return (
          <Form {...newPasswordForm} key={formKey}>
            <form onSubmit={newPasswordForm.handleSubmit(handleSetNewPassword)} className="space-y-4">
              <FormField
                control={newPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetPasswordStep('verify')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || 
                    !newPasswordForm.formState.isValid || 
                    newPasswordForm.watch('password') !== newPasswordForm.watch('confirmPassword')}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Form>
        );
    }
  };

  return (
    <div className="w-full max-w-md">
      {renderForm()}
      
      <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
        if (!open && !isLoading) setIsResetDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resetPasswordStep === 'email' && 'Reset Password'}
              {resetPasswordStep === 'verify' && 'Enter Verification Code'}
              {resetPasswordStep === 'newPassword' && 'Create New Password'}
            </DialogTitle>
            <DialogDescription>
              {resetPasswordStep === 'email' && 'Enter your email address to receive a verification code.'}
              {resetPasswordStep === 'verify' && 'Enter the 6-digit code that was sent to your email.'}
              {resetPasswordStep === 'newPassword' && 'Create a new password for your account.'}
            </DialogDescription>
          </DialogHeader>
          
          {renderResetPasswordForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginForm;
