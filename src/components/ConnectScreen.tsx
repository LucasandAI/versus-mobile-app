import React, { useEffect, useState } from 'react';
import LoginForm from './auth/LoginForm';
import { clearAllAuthData } from '@/integrations/supabase/safeClient';
import { useApp } from '@/context/AppContext';
import { Check } from 'lucide-react';

const ConnectScreen: React.FC = () => {
  const { needsProfileCompletion } = useApp();
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  // Force logout when this component mounts to ensure clean testing state
  useEffect(() => {
    // Check if there's a force logout parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      clearAllAuthData().then(() => {
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, []);

  // Bullet points for the login page with numbers
  const features = [
    {
      number: '1',
      title: 'Create Your Club',
      description: 'Build a team of competitive runners'
    },
    {
      number: '2',
      title: 'Compete',
      description: 'Challenge other clubs in 7-day matches'
    },
    {
      number: '3',
      title: 'Climb the Ranks',
      description: 'Win matches to ascend through leagues'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col justify-center container-mobile px-4 py-8">
        {/* Top section with logo and tagline */}
        <div className="text-center space-y-3 mb-8">
          <div className="flex justify-center">
            {!logoLoaded && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                <div className="text-xs text-gray-400">Loading...</div>
              </div>
            )}
            <img 
              src="/lovable-uploads/97b51fd2-4445-4dab-9274-d2fd2e0b8bec.png" 
              alt="Versus Logo" 
              className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              loading="eager"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)}
            />
          </div>
          <div className="flex justify-center">
            <div className="w-10 h-0.5 bg-primary rounded-full"></div>
          </div>
          <h2 className="font-medium text-gray-700 mx-auto text-sm">
            The Competitive League for Runners
          </h2>
          
          {/* Feature bullet points with numbers */}
          <div className="mt-8 space-y-6 max-w-md mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {feature.number}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-md w-full mx-auto">
          <LoginForm />
        </div>
      </div>

      {/* Bottom links - positioned at the bottom of the screen */}
      <div className="py-4 text-center text-xs text-gray-500">
        <p>By continuing, you agree to our <a href="/terms" className="text-primary hover:underline">Terms</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a></p>
      </div>
    </div>
  );
};

export default ConnectScreen;
