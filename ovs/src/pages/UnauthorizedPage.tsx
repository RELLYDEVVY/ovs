
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Unauthorized Access</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You do not have permission to access this page.
        </p>
        <Button onClick={() => navigate("/elections")}>
          Return to Elections
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
