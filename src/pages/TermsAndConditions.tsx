import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/shared/AppHeader';

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Terms & Conditions" 
        onBack={handleBack}
      />
      <div className="container-mobile pt-20 pb-16">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">Terms of Service</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-700 mb-4">
              By accessing and using Versus, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">2. Use License</h3>
            <p className="text-gray-700 mb-4">
              Permission is granted to temporarily use Versus for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">3. User Accounts</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">4. Running Data</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of all running data you provide to Versus. We may use this data to provide and improve our services.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">5. Club Participation</h3>
            <p className="text-gray-700 mb-4">
              By joining clubs and participating in matches, you agree to engage respectfully with other users and follow community guidelines.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">6. Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              Versus shall not be liable for any damages arising from the use or inability to use the service.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">7. Changes to Terms</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Users will be notified of significant changes.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">8. Contact Us</h3>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms & Conditions, please contact us at{' '}
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

export default TermsAndConditions;
