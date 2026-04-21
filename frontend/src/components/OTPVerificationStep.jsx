// components/OTPVerificationStep.jsx
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, ArrowRight, Shield } from 'lucide-react';

const OTPVerificationStep = ({ email, onVerify, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits are filled
    if (newOtp.every(digit => digit !== '')) {
      const otpString = newOtp.join('');
      setIsVerified(true);
      onVerify(otpString);
    }
  };

  const handleResend = () => {
    setTimer(30);
    onResend();
  };

  const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to{' '}
            <span className="font-semibold text-blue-600">
              {maskEmail(email)}
            </span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step 1 of 3</span>
            <span className="text-sm text-gray-500">Verification</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: isVerified ? '100%' : '33%' }}
            />
          </div>
        </div>

        {/* OTP Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Enter the verification code
          </label>
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digit && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                disabled={isVerified}
              />
            ))}
          </div>
        </div>

        {/* Timer and Resend */}
        <div className="text-center mb-8">
          {timer > 0 ? (
            <p className="text-gray-500">
              Resend code in <span className="font-semibold">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Resend Verification Code
            </button>
          )}
        </div>

        {/* Verification Status */}
        {isVerified && (
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg mb-6 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">Identity verified successfully</span>
          </div>
        )}

        {/* Guidance */}
        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-blue-800 mb-2">Security Tips:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Never share your verification code with anyone</li>
            <li>• The code expires in 10 minutes</li>
            <li>• Check your spam folder if you haven't received the email</li>
          </ul>
        </div>

        {/* Next Button */}
        <button
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
            isVerified
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isVerified}
        >
          {isVerified ? (
            <>
              Continue to Document Preview
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          ) : (
            'Enter Verification Code to Continue'
          )}
        </button>
      </div>
    </div>
  );
};

export default OTPVerificationStep;
