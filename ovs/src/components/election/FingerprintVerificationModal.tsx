import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Fingerprint, Check, X, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserFingerprintStatus } from "../../services/userService";
import { startRegistration } from '@simplewebauthn/browser';

interface FingerprintVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (fingerprintData: string) => void;
}

const FingerprintVerificationModal = ({ open, onOpenChange, onSuccess }: FingerprintVerificationModalProps) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(true);

  // Check if WebAuthn is supported by the browser
  useEffect(() => {
    const checkWebAuthnSupport = () => {
      if (!window.PublicKeyCredential) {
        setIsBiometricSupported(false);
        setError('Your browser does not support WebAuthn/FIDO2 for fingerprint authentication.');
        return false;
      }

      return true;
    };

    checkWebAuthnSupport();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    const currentUser = useAuthStore.getState().user; // Get current user directly from store
    
    try {
      // Check if user exists and has an ID
      const userId = currentUser?.id || (currentUser as any)?._id;
      
      if (!currentUser || !userId) {
        console.error('FingerprintVerificationModal: currentUser or currentUser.id is missing.', currentUser);
        throw new Error("User not found or user ID is missing.");
      }

      // In a real implementation, you would fetch challenge from your server
      // For this demo, we'll create a simple challenge
      // Format the challenge according to WebAuthn API requirements
      const challengeArray = new Uint8Array([...Array(32)].map(() => Math.floor(Math.random() * 256)));
      
      // Convert challenge to base64 string as required by the API
      const challengeBase64 = btoa(String.fromCharCode(...challengeArray));
      
      // First, we need to create a credential (register) if one doesn't exist
      // This will trigger the fingerprint sensor on the device
      try {
        // Create registration options
        const regOptions = {
          challenge: challengeBase64,
          rp: {
            name: 'OVS Project',
            id: window.location.hostname
          },
          user: {
            id: btoa(userId), // Convert userId to base64
            name: currentUser.email || `user-${userId}`,
            displayName: currentUser.username || `User ${userId}`
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" as const }, // ES256
            { alg: -257, type: "public-key" as const } // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: 'platform' as const,
            userVerification: 'required' as const,
            residentKey: 'discouraged' as const, // Discourage passkey-like behavior
            requireResidentKey: false // For non-discoverable credential
          },
          attestation: 'none' as const
        };

        // Register the credential first (this will prompt for fingerprint)
        const registrationResult = await startRegistration({ optionsJSON: regOptions });
        
        // If startRegistration is successful, consider it verified for this modal's purpose.
        console.log('Fingerprint registration successful:', registrationResult);
        
        // Only call backend if fingerprint registration was successful
        await updateUserFingerprintStatus(userId, true);

        // Update local auth store
        useAuthStore.getState().updateUser({ 
          ...currentUser, 
          id: userId,
          isFingerprintVerified: true 
        });
        
        setVerified(true);
        
        toast({
          title: "Verification successful",
          description: "Your fingerprint has been verified",
        });
        
        setTimeout(() => {
          onOpenChange(false);
          if (onSuccess) onSuccess(JSON.stringify(registrationResult));
        }, 1000);
      } catch (authError) {
        console.error('WebAuthn authentication error:', authError);
        // User canceled or authentication failed - provide a friendly message
        throw new Error('Fingerprint verification could not be completed');
      }
    } catch (error) {
      console.error('Fingerprint verification error:', error);
      // Set a user-friendly error message
      setError("Verification process incomplete. Please try again.");
      toast({
        title: "Verification not completed",
        description: "Please try again when you're ready",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!verified) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fingerprint Verification Required</DialogTitle>
          <DialogDescription>
            You need to verify your identity before you can vote in this election.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          {verified ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-center text-green-600 dark:text-green-400 font-medium">Verification Successful!</p>
            </div>
          ) : !isBiometricSupported ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-center text-red-600 dark:text-red-400 font-medium">Biometric Authentication Not Supported</p>
              <p className="text-center text-sm">Your browser or device does not support fingerprint authentication.</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Fingerprint className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-center mb-4">
                Touch the fingerprint sensor on your device to verify your identity
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-md text-red-600 dark:text-red-400 text-sm text-center">
                  <AlertCircle className="h-4 w-4 inline-block mr-2" />
                  {error}
                </div>
              )}
              
              <div className="flex justify-center space-x-4 w-full">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={verifying}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleVerify} 
                  disabled={verifying || !isBiometricSupported} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {verifying ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                      Verifying...
                    </div>
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Verify Fingerprint
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FingerprintVerificationModal;
