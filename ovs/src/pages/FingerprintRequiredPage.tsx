
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";

const FingerprintRequiredPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="text-center px-4 max-w-md">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <Fingerprint className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Fingerprint Verification Required</h1>
        <p className="text-muted-foreground mb-6">
          You need to verify your fingerprint before accessing this feature. Please contact an administrator to verify your fingerprint.
        </p>
        <div className="space-y-3">
          <Button className="w-full" onClick={() => navigate("/elections")}>
            Return to Elections
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FingerprintRequiredPage;
