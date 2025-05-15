
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getElections, getElectionResults, Election as ElectionType } from '@/services/electionService'; // Renamed Election to ElectionType to avoid conflict
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';

// Define a more specific type for the results we expect to display
// Represents a candidate object as returned by the getElectionResults API endpoint
interface CandidateFromServer {
  _id: string; // from MongoDB
  id: string;  // stringified _id, set by backend controller
  name: string;
  description: string;
  imageUrl?: string | null;
  votes: number; // vote count, calculated by backend controller
}

// Represents a candidate for display on the results page, with calculated percentage
interface CandidateResult extends CandidateFromServer {
  percentage: number;
}

interface ElectionResultDisplay extends Omit<ElectionType, 'candidates' | 'userHasVoted'> {
  candidates: CandidateResult[];
  totalVotes: number;
  winnerName?: string; // Winner will be calculated
  imageUrl?: string | null; // For election image, not candidate
}

// Mock data has been removed. Live data will be fetched.

const ResultsPage = () => {
  const [displayedResults, setDisplayedResults] = useState<ElectionResultDisplay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchAllResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allElections = await getElections();
        const relevantElections = allElections.filter(
          (election) => election.status === 'ended' || election.status === 'ongoing'
        );

        if (relevantElections.length === 0) {
          setDisplayedResults([]);
          setIsLoading(false);
          return;
        }

        const resultsPromises = relevantElections.map(async (election) => {
          try {
            const electionResultData = await getElectionResults(election.id);
            
            let winnerName = "N/A";
            let highestVotes = 0;
            let potentialWinners: CandidateFromServer[] = [];

            if (election.status === 'ongoing') {
              winnerName = "Awaiting final results";
            } else if (electionResultData.candidates && electionResultData.candidates.length > 0) {
              // First pass to find the highest number of votes
              electionResultData.candidates.forEach((c: CandidateFromServer) => {
                if (c.votes > highestVotes) {
                  highestVotes = c.votes;
                }
              });

              if (highestVotes === 0) {
                winnerName = electionResultData.totalVotes > 0 ? "N/A (No votes for candidates)" : "No votes cast";
              } else {
                // Second pass to find all candidates with the highest votes
                potentialWinners = electionResultData.candidates.filter((c: CandidateFromServer) => c.votes === highestVotes);
                if (potentialWinners.length === 1) {
                  winnerName = potentialWinners[0].name;
                } else if (potentialWinners.length > 1) {
                  winnerName = "Tie";
                } else {
                  // This case should ideally not be reached if highestVotes > 0
                  winnerName = "N/A"; 
                }
              }
            } else if (electionResultData.candidates?.length === 0) {
              winnerName = "No candidates";
            }


            const processedCandidates: CandidateResult[] = electionResultData.candidates?.map((candidate: CandidateFromServer) => ({
              ...candidate,
              id: candidate.id || candidate._id?.toString(), // Ensure id is string
              votes: candidate.votes || 0,
              percentage: electionResultData.totalVotes > 0 ? Number((((candidate.votes || 0) / electionResultData.totalVotes) * 100).toFixed(1)) : 0,
            })) || [];

            return {
              ...election, // Spreading basic election details like title, description, dates
              id: electionResultData.id || election.id,
              title: electionResultData.title || election.title,
              description: electionResultData.description || election.description,
              startDate: new Date(electionResultData.startDate || election.startDate),
              endDate: new Date(electionResultData.endDate || election.endDate),
              status: electionResultData.status || election.status,
              candidates: processedCandidates,
              totalVotes: electionResultData.totalVotes || 0,
              winnerName: winnerName,
              imageUrl: electionResultData.imageUrl || null, // Ensure imageUrl is part of the final object
            };
          } catch (fetchError) {
            console.error(`Failed to fetch results for election ${election.id}:`, fetchError);
            // Return a partial object or null to indicate failure for this specific election
            // This allows other election results to still be displayed
            return {
              ...election,
              id: election.id,
              title: election.title,
              description: `Failed to load results for this election. Error: ${(fetchError as Error).message}`,
              startDate: new Date(election.startDate),
              endDate: new Date(election.endDate),
              status: election.status,
              candidates: [],
              totalVotes: 0,
              winnerName: "Error",
              imageUrl: null, // ElectionType (election) doesn't have imageUrl; set to null for error case
              errorLoading: true // Custom flag
            } as ElectionResultDisplay & { errorLoading?: boolean };
          }
        });

        const allResults = await Promise.all(resultsPromises);
        // Filter out nulls if we chose to return null on error, or handle partial data
        setDisplayedResults(allResults.filter(r => r !== null) as ElectionResultDisplay[]); 

      } catch (e) {
        console.error("Failed to fetch elections or their results:", e);
        setError((e as Error).message || 'An unknown error occurred');
        setDisplayedResults([]);
      }
      setIsLoading(false);
    };

    fetchAllResults();
  }, []);

  // Function to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Function to get initials from a name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-8 text-blue-700 dark:text-blue-400">Election Results</h1>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg shadow">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-muted-foreground text-lg">Loading election results...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {
        !isLoading && error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Error Fetching Results</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )
      }
      {
        !isLoading && !error && displayedResults.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg shadow">
            <p className="text-muted-foreground text-lg">No election results to display at this time.</p>
            <p className="text-sm text-muted-foreground">Either no elections have ended, or there was an issue fetching data.</p>
          </div>
        )
      }
      {
        !isLoading && !error && displayedResults.length > 0 && displayedResults.map((election) => (
            <div key={election.id} className="space-y-6">
              <Card className="overflow-hidden shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-700 dark:text-blue-400">{election.title}</CardTitle>
                  <CardDescription>{(election as any).errorLoading ? <span className='text-red-500'>{election.description}</span> : election.description}</CardDescription>
                  <div className="text-sm text-muted-foreground mt-2">
                    <span>
                      {election.status === 'ended' ? `Ended on ${formatDate(new Date(election.endDate))}` : `Ends on ${formatDate(new Date(election.endDate))}`}
                       • {election.totalVotes} total votes
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Election Winner: 
                      <span className="ml-2 text-blue-700 dark:text-blue-400">{election.winnerName || 'N/A'}</span>
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <h3 className="text-md font-medium">All Candidates</h3>
                    
                    <div className="space-y-4">
                      {election.candidates
                        .sort((a, b) => b.votes - a.votes)
                        .map((candidate, index) => (
                          <div key={candidate.id} className="flex items-center">
                            <div className="mr-3">
                              <Avatar className={election.winnerName === candidate.name && !["Tie", "N/A", "Awaiting final results", "No votes cast", "No candidates", "N/A (No votes for candidates)"].includes(election.winnerName) ? "border-2 border-yellow-400" : ""}>
                                {candidate.imageUrl ? (
                                  <AvatarImage src={candidate.imageUrl} alt={candidate.name} />
                                ) : null}
                                <AvatarFallback className={election.winnerName === candidate.name && !["Tie", "N/A", "Awaiting final results", "No votes cast", "No candidates", "N/A (No votes for candidates)"].includes(election.winnerName) ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : ""}>
                                  {getInitials(candidate.name)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <div>
                                  <span className="text-sm font-medium">
                                    {candidate.name}
                                    {/* Show crown only if this candidate is the determined sole winner */}
                                    {election.winnerName === candidate.name && !["Tie", "N/A", "Awaiting final results", "No votes cast", "No candidates", "N/A (No votes for candidates)"].includes(election.winnerName) && <span className="ml-2">👑</span>}
                                  </span>
                                  {candidate.description && (
                                    <p className="text-xs text-muted-foreground">{candidate.description}</p>
                                  )}
                                </div>
                                <div className="text-sm text-right">
                                  <div className="font-medium">{candidate.percentage.toFixed(1)}%</div>
                                  <div className="text-xs text-muted-foreground">{candidate.votes} votes</div>
                                </div>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    index === 0 
                                      ? "bg-blue-600 dark:bg-blue-500" 
                                      : "bg-blue-300 dark:bg-blue-800"
                                  }`} 
                                  style={{ width: `${candidate.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
