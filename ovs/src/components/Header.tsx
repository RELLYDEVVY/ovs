import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, CheckCircle, XCircle, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

const Header = () => {
  // Use a more direct subscription to the store that will force re-renders
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const loading = useAuthStore(state => state.loading);
  
  // This will update whenever ANY part of the store changes
  const [isOpen, setIsOpen] = useState(false);
  
  // Get the verification status directly from user object each render
  const isFingerprintVerified = user?.isFingerprintVerified;

  useEffect(() => {
    console.log('[Header.tsx] Fingerprint status (direct from user):', isFingerprintVerified);
  }, [isFingerprintVerified]);

  if (!user) return null;

  return (
    <header className="bg-background sticky top-0 z-10 w-full border-b shadow-md">
      <div className="w-full py-3 px-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/elections" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          Election Platform
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/elections" className="hover:text-blue-600 dark:hover:text-blue-400">
            Elections
          </Link>
          <Link to="/results" className="hover:text-blue-600 dark:hover:text-blue-400">
            Results
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" className="hover:text-blue-600 dark:hover:text-blue-400">
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* Fingerprint verification status - visible on all views */}
          <div className="flex items-center gap-1">
            {isFingerprintVerified ? (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-xs text-green-500">Verified</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-red-500" />
                <span className="text-xs text-red-500">Not Verified</span>
              </>
            )}
          </div>

          <ThemeToggle />

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-full p-1">
              <UserCircle className="h-6 w-6" />
            </div>
            <span className="hidden md:inline" title={user.username}>{truncateText(user.username, 15)}</span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex" 
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </Button>

          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex items-center gap-2 px-2">
                  <div className="flex items-center bg-muted rounded-full p-1">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <span title={user.username}>{truncateText(user.username, 20)}</span>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Link 
                    to="/elections" 
                    className="px-2 py-2 hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Elections
                  </Link>
                  <Link 
                    to="/results" 
                    className="px-2 py-2 hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Results
                  </Link>
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="px-2 py-2 hover:bg-muted rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
                
                <div className="flex flex-col space-y-3 mt-auto">                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
