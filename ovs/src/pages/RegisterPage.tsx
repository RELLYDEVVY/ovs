
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please check your password and try again",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await register(email, password, 'user', name);
      toast({
        title: "Registration Successful!",
        description: "Your account has been created.",
      });
      navigate('/elections'); // Navigate to elections page on successful registration
    } catch (error: any) {
      let toastTitle = "Registration Failed";
      let toastDescription = "An unexpected error occurred. Please try again.";
      let redirectToLogin = false;

      if (error.isAxiosError && error.response && error.response.data) {
        const backendError = error.response.data;
        if (backendError.message === "User already exists") {
          const fieldKey = backendError.errors ? Object.keys(backendError.errors)[0] : null;
          toastDescription = fieldKey && backendError.errors[fieldKey] 
            ? backendError.errors[fieldKey] 
            : "This email or username is already taken.";
          redirectToLogin = true;
        } else if (backendError.message && typeof backendError.message === 'string') {
          toastDescription = backendError.message;
          // Optionally append more details from backendError.errors
          if (backendError.errors) {
            const firstErrorField = Object.keys(backendError.errors)[0];
            if (firstErrorField && backendError.errors[firstErrorField]) {
              toastDescription += `: ${backendError.errors[firstErrorField]}`;
            }
          }
        }
      } else if (error.message) {
        toastDescription = error.message;
      }

      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive",
      });

      if (redirectToLogin) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground text-center w-full">
            <span>Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
