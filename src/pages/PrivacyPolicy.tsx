import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/shared/AppHeader';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Privacy Policy" 
        onBack={handleBack}
      />
      <div className="container-mobile pt-20 pb-16">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">1. Information We Collect</h3>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us, such as when you create an account, join a club, or log running distance.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">2. How We Use Your Information</h3>
            <p className="text-gray-700 mb-4">
              We use the information we collect to provide, maintain, and improve our services, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
              <li>Managing your account and club memberships</li>
              <li>Tracking match progress and league standings</li>
              <li>Enabling communication between club members</li>
              <li>Sending notifications about matches and club activities</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">3. Running Data</h3>
            <p className="text-gray-700 mb-4">
              Your running data, including distance and workout information, is used solely for the purpose of club matches and personal tracking. We do not sell this data to third parties.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">4. Apple Health Integration</h3>
            <p className="text-gray-700 mb-4">
              When you connect Apple Health, we only access running workout data that you explicitly authorize. This data remains secure and is used only for match participation.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">5. Information Sharing</h3>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties, except as described in this policy or with your consent.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">6. Data Security</h3>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">7. Your Rights</h3>
            <p className="text-gray-700 mb-4">
              You have the right to access, update, or delete your personal information. You can do this through your account settings or by contacting us.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">8. Contact Us</h3>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@versus.run" className="text-primary font-medium">support@versus.run</a>.
            </p>

            <p className="text-sm text-gray-500 mt-8 mb-8">
              Last updated: June 23, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
