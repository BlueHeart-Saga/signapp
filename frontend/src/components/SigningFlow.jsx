// components/SigningFlow.jsx
import React, { useState } from 'react';
import OTPVerificationStep from './OTPVerificationStep';
import DocumentPreviewStep from './DocumentPreviewStep';
import SigningSuccessStep from './SigningSuccessStep';

const SigningFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [email] = useState('user@example.com');
  
  // Sample document fields
  const fields = [
    { id: 1, type: 'signature', label: 'Your Signature', x: 100, y: 200, width: 200, height: 80 },
    { id: 2, type: 'date', label: 'Date', x: 400, y: 200, width: 120, height: 40 },
    { id: 3, type: 'text', label: 'Full Name', x: 100, y: 320, width: 250, height: 40 },
    { id: 4, type: 'text', label: 'Company Name', x: 400, y: 320, width: 250, height: 40 }
  ];

  const handleOTPVerify = (otp) => {
    console.log('OTP verified:', otp);
    setCurrentStep(2);
  };

  const handleOTPResend = () => {
    console.log('Resending OTP...');
  };

  const handleSignComplete = () => {
    setCurrentStep(3);
  };

  const handleFieldClick = (field) => {
    console.log('Field clicked:', field);
  };

  return (
    <div className="signing-flow-container">
      {currentStep === 1 && (
        <OTPVerificationStep
          email={email}
          onVerify={handleOTPVerify}
          onResend={handleOTPResend}
        />
      )}

      {currentStep === 2 && (
        <DocumentPreviewStep
          document={{ title: "Sample Document" }}
          fields={fields}
          onSignComplete={handleSignComplete}
          onFieldClick={handleFieldClick}
        />
      )}

      {currentStep === 3 && (
        <SigningSuccessStep
          onClose={() => console.log('Close')}
          onNewSign={() => setCurrentStep(1)}
        />
      )}
    </div>
  );
};

export default SigningFlow;