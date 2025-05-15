import api from './api';

export interface Candidate {
  id: string;
  name: string;
  description: string;
  votes?: number;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  candidates: Candidate[];
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'ongoing' | 'ended';
  userHasVoted: boolean;
}

// Get all elections
export const getElections = async (): Promise<Election[]> => {
  try {
    const response = await api.get('/elections');
    
    // Convert string dates to Date objects
    return response.data.map((election: any) => ({
      ...election,
      startDate: new Date(election.startDate),
      endDate: new Date(election.endDate)
    }));
  } catch (error) {
    console.error('Error fetching elections:', error);
    throw error;
  }
};

// Get election by ID
export const getElectionById = async (id: string): Promise<Election> => {
  try {
    const response = await api.get(`/elections/${id}`);
    
    // Convert string dates to Date objects
    return {
      ...response.data,
      startDate: new Date(response.data.startDate),
      endDate: new Date(response.data.endDate)
    };
  } catch (error) {
    console.error(`Error fetching election ${id}:`, error);
    throw error;
  }
};

// Cast a vote
interface CastVotePayload {
  candidateId: string;
  fingerprintData?: string;
}

export const castVote = async (electionId: string, candidateId: string, fingerprintData?: string): Promise<void> => {
  try {
    const payload: CastVotePayload = { candidateId };
    if (fingerprintData) {
      payload.fingerprintData = fingerprintData;
    }
    await api.post(`/elections/${electionId}/vote`, payload);
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};

// Get election results
export const getElectionResults = async (electionId: string): Promise<any> => {
  try {
    const response = await api.get(`/elections/${electionId}/results`);
    return response.data;
  } catch (error) {
    console.error('Error fetching election results:', error);
    throw error;
  }
};

// Check if user has voted in an election
export const hasVoted = (election: Election): boolean => {
  return election.userHasVoted || false;
};

// --- Admin Functions ---

export interface CandidatePayload {
  name: string;
  description: string;
  imageUrl?: string; 
}

export interface CreateElectionPayload {
  title: string;
  description: string;
  imageUrl?: string;
  candidates: CandidatePayload[];
  startDate: string | Date; // Should be ISO string for backend
  endDate: string | Date;   // Should be ISO string for backend
}

export interface UpdateCandidatePayload extends CandidatePayload {
  id?: string; // For identifying existing candidates to update
}

export interface UpdateElectionPayload {
  title?: string;
  description?: string;
  imageUrl?: string;
  candidates?: UpdateCandidatePayload[];
  startDate?: string | Date; // Should be ISO string for backend
  endDate?: string | Date;   // Should be ISO string for backend
}

// Create a new election
export const createElection = async (electionData: CreateElectionPayload): Promise<Election> => {
  try {
    const response = await api.post('/elections', electionData);
    // Convert string dates to Date objects from response
    return {
      ...response.data,
      startDate: new Date(response.data.startDate),
      endDate: new Date(response.data.endDate),
    };
  } catch (error) {
    console.error('Error creating election:', error);
    throw error;
  }
};

// Update an existing election
export const updateElection = async (electionId: string, electionData: UpdateElectionPayload): Promise<Election> => {
  try {
    const processedCandidates = electionData.candidates?.map(candidate => {
      const { id, ...restOfCandidate } = candidate;
      // Only include the id if it's an existing candidate (not a temporary one)
      // and it looks like a MongoDB ObjectId (24 hex characters).
      // A simpler check for this temporary ID format is just to see if it starts with 'candidate-'.
      if (id && !id.startsWith('candidate-')) {
        return { id, ...restOfCandidate };
      }
      return restOfCandidate; // For new candidates, send no id, let backend generate it.
    });

    const payloadToSend: UpdateElectionPayload = {
      ...electionData,
      candidates: processedCandidates,
    };

    const response = await api.put(`/elections/${electionId}`, payloadToSend);
    // Convert string dates to Date objects from response
    return {
      ...response.data,
      startDate: new Date(response.data.startDate),
      endDate: new Date(response.data.endDate),
    };
  } catch (error) {
    console.error(`Error updating election ${electionId}:`, error);
    throw error;
  }
};

// Delete an election
export const deleteElection = async (electionId: string): Promise<void> => {
  try {
    await api.delete(`/elections/${electionId}`);
  } catch (error) {
    console.error(`Error deleting election ${electionId}:`, error);
    throw error;
  }
};
