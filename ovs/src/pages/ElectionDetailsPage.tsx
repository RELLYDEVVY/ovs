import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

import { ArrowLeft, Fingerprint } from 'lucide-react';
import FingerprintVerificationModal from '../components/election/FingerprintVerificationModal';
import { castVote as apiCastVote, getElectionById, getElectionResults } from '../services/electionService';
import type { Election, Candidate as ServiceCandidate } from '../services/electionService'; // Import Election type

interface CandidateWithVotes extends ServiceCandidate {
  // votes is already part of ServiceCandidate, make sure it's number
  votes: number;
}

interface ElectionResultsData {
  id: string;
  title: string;
  candidates: CandidateWithVotes[];
  totalVotes: number;
  // Potentially other fields like description, status, dates if returned by getElectionResults
}
import { useAuthStore } from '../store/useAuthStore';

const ElectionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, recordVote, hasUserVoted } = useAuthStore();
  const isUserVerified = useAuthStore(state => state.user?.isFingerprintVerified);
  const [election, setElection] = useState<Election | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState(false);
  const [electionResultsData, setElectionResultsData] = useState<ElectionResultsData | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElection = async () => {
      if (!id) {
        setError('Election ID is missing.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await getElectionById(id);
        setElection(data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch election details.');
        setElection(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElection();
  }, [id]);

  const userHasVoted = election ? hasUserVoted(election.id) : false;
  const isEnded = election?.status === 'ended';

  useEffect(() => {
    const fetchResults = async () => {
      if (election && (isEnded || userHasVoted)) { // Fetch results if ended or user has voted
        // We might only want to show full break-down if 'isEnded' is true.
        // If 'userHasVoted' and 'ongoing', a simple message is fine.
        // For now, let's fetch if ended, which is the main scenario for NaN%.
        if (isEnded) {
            setResultsLoading(true);
            setResultsError(null);
            try {
                const results = await getElectionResults(election.id);
                setElectionResultsData(results);
            } catch (err: any) {
                setResultsError(err.response?.data?.message || err.message || 'Failed to load election results.');
            } finally {
                setResultsLoading(false);
            }
        }
      }
    };

    if (election) { // Ensure election is loaded before trying to fetch results
        fetchResults();
    }
  }, [election, isEnded, userHasVoted]); // Re-run if election loads or its status changes related to voting/ending

  // Function to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Function to get initials from a name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const handleActualVoteSubmission = async (fingerprintData?: string) => {
    if (!election || !selectedCandidate) {
      toast({
        title: 'Error',
        description: 'Election or candidate not selected.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCastVote(election.id, selectedCandidate, fingerprintData);
      await recordVote(election.id, selectedCandidate); // Ensure recordVote is called correctly as per its new signature in store / context (though here it's primarily for client-side state update of votedElections)
      toast({
        title: 'Vote Submitted',
        description: 'Your vote has been recorded successfully.',
      });
      // Fetch updated user details to reflect isFingerprintVerified status if it changed
      await useAuthStore.getState().fetchUser(); 
      navigate('/elections');
    } catch (error: any) {
      toast({
        title: 'Vote Submission Failed',
        description: error.response?.data?.message || error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsFingerprintModalOpen(false); // Ensure modal is closed
    }
  };

  const handleFingerprintSuccessAndVote = async (fingerprintData: string) => {
    // This function is called by the modal on successful fingerprint 'verification'
    await handleActualVoteSubmission(fingerprintData);
  };

  const handleSubmitVote = () => {
    if (!selectedCandidate) {
      toast({
        title: 'Selection Required',
        description: 'Please select a candidate to vote',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'User not found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true); // Keep this to disable button immediately

    if (isUserVerified) {
      handleActualVoteSubmission(); // No fingerprint data needed
    } else {
      // If fingerprint is not verified, open the modal.
      // The actual vote submission will be triggered by handleFingerprintSuccessAndVote
      setIsFingerprintModalOpen(true);
      // setIsSubmitting remains true, button stays disabled.
      // If modal is cancelled, we need to set isSubmitting to false.
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-6xl text-center'>
        <p>Loading election details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-6xl text-center'>
        <h1 className='text-2xl font-bold mb-4'>Error</h1>
        <p className='mb-6 text-red-500'>{error}</p>
        <Button onClick={() => navigate('/elections')}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Elections
        </Button>
      </div>
    );
  }

  // If election not found after loading and no error explicitly stating ID missing (e.g. API returned 404)
  if (!election) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-6xl text-center'>
        <h1 className='text-2xl font-bold mb-4'>Election Not Found</h1>
        <p className='mb-6'>The election you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/elections')}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Elections
        </Button>
      </div>
    );
  }

  const canVote = election?.status === 'ongoing' && !userHasVoted;

  return (
    <>
      <FingerprintVerificationModal
        open={isFingerprintModalOpen}
        onOpenChange={(isOpen) => {
          setIsFingerprintModalOpen(isOpen);
          if (!isOpen) {
            // If modal is closed (e.g., by cancellation) and we were in submission process
            setIsSubmitting(false); 
          }
        }}
        onSuccess={handleFingerprintSuccessAndVote}
      />
      <div className='container mx-auto px-4 py-8 max-w-6xl'>
      {/* Back button */}
      <Button
        variant='ghost'
        onClick={() => navigate('/elections')}
        className='mb-6'
      >
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back to Elections
      </Button>

      {/* Election header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2 text-blue-700 dark:text-blue-400'>{election.title}</h1>
        <p className='text-lg mb-4'>{election.description}</p>
        <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
          <span>
            Status: <span className='font-medium capitalize'>{election.status}</span>
          </span>
          <span>
            Period: {formatDate(election.startDate)} - {formatDate(election.endDate)}
          </span>
          <span>{election.candidates.length} candidates</span>
        </div>
      </div>

      {/* Voting or Results section */}
      <Card className='shadow-md'>
        <CardHeader>
          <CardTitle className='text-xl'>
            {canVote
              ? 'Cast Your Vote'
              : isEnded
              ? 'Election Results'
              : userHasVoted
              ? 'Your Vote Has Been Recorded'
              : 'Election Information'}
          </CardTitle>
          <CardDescription>
            {canVote
              ? 'Select one candidate below'
              : isEnded
              ? 'Final results of the election'
              : userHasVoted
              ? 'Thank you for participating in this election'
              : 'This election has not started yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canVote ? (
            <div className='space-y-6'>
              <RadioGroup
                value={selectedCandidate || ''}
                onValueChange={setSelectedCandidate}
              >
                <div className='space-y-4'>
                  {election.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className='flex items-center space-x-3 border rounded-md p-4 hover:bg-muted/50 cursor-pointer'
                      onClick={() => setSelectedCandidate(candidate.id)}
                    >
                      <RadioGroupItem
                        value={candidate.id}
                        id={candidate.id}
                      />
                      <div className='flex flex-1 items-center space-x-3'>
                        <Avatar>
                          <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                        </Avatar>
                        <Label
                          htmlFor={candidate.id}
                          className='flex-1 cursor-pointer'
                        >
                          <div className='font-medium'>{candidate.name}</div>
                          {candidate.description && (
                            <div className='text-sm text-muted-foreground'>{candidate.description}</div>
                          )}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className='flex justify-end pt-4'>
                <Button
                  onClick={handleSubmitVote}
                  disabled={!selectedCandidate || isSubmitting}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  {isSubmitting ? (
                    <>
                      <div className='animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full'></div>
                      Processing...
                    </>
                  ) : canVote && !user?.isFingerprintVerified ? (
                    <>
                      <Fingerprint className='mr-2 h-4 w-4' />
                      Verify & Vote
                    </>
                  ) : (
                    'Submit Vote'
                  )}
                </Button>
              </div>
            </div>
          ) : isEnded ? (
            resultsLoading ? (
              <p>Loading results...</p>
            ) : resultsError ? (
              <p className='text-red-500'>{resultsError}</p>
            ) : electionResultsData ? (
              <div className='space-y-5'>
                <div className='space-y-4'>
                  {electionResultsData.candidates
                    .sort((a, b) => b.votes - a.votes)
                    .map((candidate, index) => {
                      const percentage = electionResultsData.totalVotes > 0 
                        ? (candidate.votes / electionResultsData.totalVotes) * 100 
                        : 0;
                      // Determine if this candidate is the sole winner for styling
                      const isWinner = electionResultsData.candidates.filter(c => c.votes === candidate.votes && c.votes === Math.max(...electionResultsData.candidates.map(c => c.votes))).length === 1 && candidate.votes > 0 && electionResultsData.candidates.every(c => c.id === candidate.id || c.votes < candidate.votes);

                      return (
                        <div key={candidate.id} className='flex items-center'>
                          <div className='mr-3'>
                            <Avatar className={isWinner ? 'border-2 border-yellow-400' : ''}>
                              <AvatarFallback className={isWinner ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}>
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className='flex-1'>
                            <div className='flex justify-between items-center mb-1'>
                              <div>
                                <span className='text-sm font-medium'>
                                  {candidate.name}
                                  {isWinner && <span className='text-yellow-500 ml-2'>👑</span>}
                                </span>
                                {candidate.description && (
                                  <p className='text-xs text-muted-foreground'>{candidate.description}</p>
                                )}
                              </div>
                              <div className='text-sm text-right'>
                                <div className='font-medium'>{percentage.toFixed(1)}%</div>
                                <div className='text-xs text-muted-foreground'>{candidate.votes} votes</div>
                              </div>
                            </div>
                            <div className='w-full bg-muted rounded-full h-2.5'>
                              <div
                                className={`h-2.5 rounded-full ${isWinner ? 'bg-blue-600 dark:bg-blue-500' : 'bg-blue-300 dark:bg-blue-800'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <p>Results are not yet available or could not be loaded.</p> // Fallback if resultsData is null but not loading/error
            )

          ) : userHasVoted ? (
            <div className='text-center py-6'>
              <p className='mb-4 text-lg'>
                Your vote has been recorded. Results will be available once the election ends.
              </p>
              <p className='text-sm text-muted-foreground'>Election ends on {formatDate(election.endDate)}</p>
            </div>
          ) : (
            <div className='text-center py-6'>
              <p className='mb-4 text-lg'>This election has not started yet.</p>
              <p className='text-sm text-muted-foreground'>Election starts on {formatDate(election.startDate)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default ElectionDetailsPage;
