import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Fingerprint, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/store/useAuthStore"; // Import useAuthStore
import { updateUserFingerprintStatus } from "../../services/userService"; // Added import

interface FingerprintVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (fingerprintData: string) => void;
}

const FingerprintVerificationModal = ({ open, onOpenChange, onSuccess }: FingerprintVerificationModalProps) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    const currentUser = useAuthStore.getState().user; // Get current user directly from store
    
    try {
      // Simulate WebAuthn verification - in a real app, this would use the WebAuthn API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check for either id or _id in the user object
      const userId = currentUser?.id || (currentUser as any)?._id;
      
      if (currentUser && userId) {
        // Call backend to update fingerprint status
        await updateUserFingerprintStatus(userId, true);

        // Update local auth store - ensure we're using the correct id format
        useAuthStore.getState().updateUser({ 
          ...currentUser, 
          id: userId, // Ensure id is set correctly
          isFingerprintVerified: true 
        }); 
        setVerified(true);
        
        toast({
          title: "Verification successful",
          description: "Your fingerprint has been verified",
        });
        
        setTimeout(() => {
          onOpenChange(false);
          if (onSuccess) onSuccess("simulated_fingerprint_data_123"); // Pass simulated data
        }, 1000);
      } else {
        console.error('FingerprintVerificationModal: currentUser or currentUser.id is missing.', currentUser);
        throw new Error("User not found or user ID is missing.");
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: (error instanceof Error && error.message) || "Please try again later",
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
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Fingerprint className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-center mb-6">
                Touch the fingerprint sensor on your device to verify your identity
              </p>
              
              <div className="flex justify-center space-x-4 w-full">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={verifying}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleVerify} disabled={verifying} className="bg-blue-600 hover:bg-blue-700">
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
