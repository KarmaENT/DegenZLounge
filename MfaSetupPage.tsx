import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const MfaSetupPage: React.FC = () => {
  const { setupMfa, user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  
  const handleSetupMfa = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await setupMfa('totp');
      setQrCode(result.provisioning_uri);
      setSecret(result.secret);
      setShowVerification(true);
    } catch (err: any) {
      setError(err.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyMfa = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would verify the code here
      // For this example, we'll just simulate success
      setSuccess(true);
      setTimeout(() => {
        navigate('/settings');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify MFA code');
    } finally {
      setLoading(false);
    }
  };
  
  if (user?.mfa_enabled) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          MFA Already Enabled
        </h2>
        <p className="text-gray-600 mb-6">
          You already have Multi-Factor Authentication enabled for your account.
        </p>
        <div className="flex justify-center">
          <Link
            to="/settings"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to Settings
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Setup Two-Factor Authentication
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          MFA has been successfully enabled for your account. Redirecting to settings...
        </div>
      ) : showVerification ? (
        <div>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).
            </p>
            
            <div className="flex justify-center mb-4">
              {qrCode && <QRCodeSVG value={qrCode} size={200} />}
            </div>
            
            {secret && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">
                  If you can't scan the QR code, enter this secret key manually:
                </p>
                <div className="p-2 bg-gray-100 rounded-md font-mono text-center break-all">
                  {secret}
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleVerifyMfa}
              disabled={loading || verificationCode.length !== 6}
              className={`w-full px-4 py-2 text-white rounded-md ${
                loading || verificationCode.length !== 6
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify and Enable'}
            </button>
            
            <button
              onClick={() => setShowVerification(false)}
              className="w-full mt-2 px-4 py-2 text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-6">
            Two-factor authentication adds an extra layer of security to your account. Once enabled, you'll need to enter a verification code from your authenticator app when signing in.
          </p>
          
          <button
            onClick={handleSetupMfa}
            disabled={loading}
            className={`w-full px-4 py-2 text-white rounded-md ${
              loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
          </button>
          
          <Link
            to="/settings"
            className="block text-center mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Back to Settings
          </Link>
        </div>
      )}
    </div>
  );
};

export default MfaSetupPage;
