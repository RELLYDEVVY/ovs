import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '@/components/CountdownTimer';
import { Clock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import FingerprintVerificationModal from '@/components/election/FingerprintVerificationModal';
import { getElections, Election, hasVoted } from '../services/electionService';

// We'll use real data from the API instead of mock data

const ElectionsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch elections from the API
  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        const data = await getElections();
        setElections(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch elections:', err);
        setError('Failed to load elections. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  // Check if user has voted in an election
  const checkHasVoted = (election: Election): boolean => {
    return hasVoted(election);
  };

  // Filter elections based on active tab
  const filteredElections =
    activeTab === 'all' ? elections : elections.filter((election) => election.status === activeTab);

  // Function to format date for display with time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Function to calculate time remaining (simple version)
  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    if (endDate < now) return 'Ended';

    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days remaining`;
  };

  const handleVoteClick = (electionId: string) => {
    // If user is not verified, show verification modal
    if (user && !user.isFingerprintVerified) {
      setSelectedElection(electionId);
      setIsVerificationModalOpen(true);
      return;
    }

    // Otherwise, navigate to election details
    navigate(`/elections/${electionId}`);
  };

  const handleVerificationSuccess = () => {
    if (selectedElection) {
      toast({
        title: 'Verification successful',
        description: 'You can now vote in this election',
      });

      // Navigate to the election details page
      navigate(`/elections/${selectedElection}`);
    }
  };

  // Get button text based on election status and user vote status
  const getButtonText = (election: Election) => {
    if (checkHasVoted(election)) {
      return election.status === 'ended' ? 'View Results' : 'Awaiting Results';
    }

    if (election.status === 'ongoing') {
      return 'Vote Now';
    } else if (election.status === 'upcoming') {
      return 'Coming Soon';
    } else {
      return 'View Results';
    }
  };

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-blue-700 dark:text-blue-400'>Elections</h1>
      </div>

      <Tabs
        defaultValue='all'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='mb-6'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='ongoing'>Ongoing</TabsTrigger>
          <TabsTrigger value='upcoming'>Upcoming</TabsTrigger>
          <TabsTrigger value='ended'>Ended</TabsTrigger>
        </TabsList>

        <TabsContent
          value={activeTab}
          className='mt-0'
        >
          {loading ? (
            <div className='text-center py-12 bg-muted/30 rounded-lg shadow'>
              <p className='text-muted-foreground'>Loading elections...</p>
            </div>
          ) : error ? (
            <div className='text-center py-12 bg-red-100 rounded-lg shadow'>
              <p className='text-red-500'>{error}</p>
            </div>
          ) : filteredElections.length === 0 ? (
            <div className='text-center py-12 bg-muted/30 rounded-lg shadow'>
              <p className='text-muted-foreground'>No elections found</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredElections.map((election) => (
                <Card
                  key={election.id}
                  className='overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow flex flex-col'
                >
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-xl text-blue-700 dark:text-blue-400'>{election.title}</CardTitle>
                    <CardDescription className='line-clamp-2'>{election.description}</CardDescription>
                  </CardHeader>
                  <CardContent className='pb-2 flex-grow'>
                    <div className='flex flex-col space-y-2'>
                      <div className='flex items-center text-sm text-muted-foreground'>
                        <User className='mr-2 h-4 w-4' />
                        <span>{election.candidates.length} candidates</span>
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        <CountdownTimer endDate={election.endDate} className="text-sm" />
                      </div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        {formatDate(election.startDate)} - {formatDate(election.endDate)}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={election.status === 'ongoing' && !checkHasVoted(election) ? 'default' : 'outline'}
                      className={`w-full ${
                        election.status === 'ongoing' && !checkHasVoted(election) ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                      disabled={election.status === 'upcoming'}
                      onClick={() => handleVoteClick(election.id)}
                    >
                      {getButtonText(election)}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Fingerprint Verification Modal */}
      <FingerprintVerificationModal
        open={isVerificationModalOpen}
        onOpenChange={setIsVerificationModalOpen}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default ElectionsPage;
