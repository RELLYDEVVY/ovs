import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CountdownTimer from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Edit, Plus, Trash, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
// import { User as UserType } from '@/contexts/AuthContext'; // Replaced by AdminUser from userService
import { useAuthStore } from '@/store/useAuthStore';
import { getAllUsers, AdminUser, deleteUser as deleteUserService, updateUserRole as updateUserRoleService, updateUserFingerprintStatus as updateUserFingerprintStatusService } from '@/services/userService';
import { 
  getElections, 
  Election as ElectionType, 
  createElection, 
  updateElection, 
  deleteElection as deleteElectionService, // Alias to avoid conflict with component state/handlers
  CreateElectionPayload, 
  UpdateElectionPayload 
} from '@/services/electionService';
import ElectionFormModal from '@/components/election/ElectionFormModal';
import DeleteConfirmationDialog from '@/components/election/DeleteConfirmationDialog';


type ElectionFormData = {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  candidates: Array<{
    id: string;
    name: string;
    description: string;
  }>;
};

// Separate component for table rows
const UserTableRows = ({
  usersLoading,
  usersError,
  users,
  toggleAdminStatus,
  toggleFingerprintStatus,
  handleDeleteUser
}: {
  usersLoading: boolean;
  usersError: string | null;
  users: AdminUser[];
  toggleAdminStatus: (id: string) => void;
  toggleFingerprintStatus: (id: string) => void;
  handleDeleteUser: (id: string) => void;
}) => {
  if (usersLoading) {
    return (
      <tr key="loading">
        <td colSpan={5} className="text-center py-4">Loading users...</td>
      </tr>
    );
  }

  if (usersError) {
    return (
      <tr key="error">
        <td colSpan={5} className="text-center py-4 text-red-500">{usersError}</td>
      </tr>
    );
  }

  if (users.length === 0) {
    return (
      <tr key="empty">
        <td colSpan={5} className="text-center py-4">No users found.</td>
      </tr>
    );
  }

  return (
    <>
      {users.map((user) => {
        if (!user || typeof user.id === 'undefined') {
          console.warn('UserTableRows: Encountered a user with undefined id. This may cause issues.', user);
          // Fallback key for this problematic case to satisfy React, though the root issue is data
          return (
            <tr key={Math.random()}>
              <td colSpan={5} className="text-center py-4 text-orange-500">User data incomplete (missing ID)</td>
            </tr>
          );
        }
        return (
          <tr key={user.id} className="border-t">
            <td className="px-4 py-3">{user.username}</td>
            <td className="px-4 py-3">{user.email}</td>
            <td className="px-4 py-3">
              <div className="flex items-center">
                <Button
                  variant={user.role === 'admin' ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAdminStatus(user.id)}
                >
                  <span className="ml-2">{user.role === 'admin' ? "Revoke Admin" : "Make Admin"}</span>
                </Button>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center">
                <button
                  onClick={() => toggleFingerprintStatus(user.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${user.isFingerprintVerified ? 'bg-blue-600' : 'bg-input'}`}
                  role="switch"
                  aria-checked={user.isFingerprintVerified}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${user.isFingerprintVerified ? 'translate-x-6' : 'translate-x-0.5'}`}
                  />
                </button>
                <span className="ml-2">{user.isFingerprintVerified ? 'Verified' : 'Not Verified'}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                <Trash className="mr-2 h-4 w-4" /> Delete
              </Button>
            </td>
          </tr>
        );
      })}
    </>
  );
};

const AdminPanel = () => {
  const { user: authUser, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("elections");
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  const [elections, setElections] = useState<ElectionType[]>([]);
  const [electionsLoading, setElectionsLoading] = useState(true);
  const [electionsError, setElectionsError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentElection, setCurrentElection] = useState<any>(null);
  const [electionToDelete, setElectionToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
        setUsersError(null);
      } catch (err) {
        console.error("Failed to load users:", err);
        setUsersError("Failed to load users. Please try again later.");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
    const fetchElections = async () => {
      try {
        setElectionsLoading(true);
        const fetchedElections = await getElections();
        setElections(fetchedElections);
        setElectionsError(null);
      } catch (err) {
        console.error("Failed to load elections:", err);
        setElectionsError("Failed to load elections. Please try again later.");
      } finally {
        setElectionsLoading(false);
      }
    };

    fetchElections();
  }, []);

  // Function to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Function to calculate time remaining
  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    if (endDate < now) return "Ended";
    
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days remaining`;
  };

  // Function to toggle admin status with optimistic update
  const toggleAdminStatus = async (userId: string) => {
    const originalUsers = [...users];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const originalUser = users[userIndex];
    const newRole = originalUser.role === 'admin' ? 'user' : 'admin';

    // Optimistic UI update
    setUsers(prevUsers => 
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    try {
      const updatedUser = await updateUserRoleService(userId, newRole);
      // Update with data from backend in case it modified something else
      setUsers(prevUsers => 
        prevUsers.map(user => (user.id === userId ? updatedUser : user))
      );
      toast({
        title: "Admin Status Updated",
        description: `User is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`,
      });
    } catch (error) {
      console.error('Failed to update admin status:', error);
      // Revert UI change on error
      setUsers(originalUsers);
      toast({
        title: "Error Updating Admin Status",
        description: (error as Error)?.message || "Could not update admin status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to toggle fingerprint verification status
  const toggleFingerprintStatus = async (userId: string) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User ID is missing.',
        variant: 'destructive',
      });
      return;
    }

    // Find the user in our local state
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      toast({
        title: 'Error',
        description: 'User not found.',
        variant: 'destructive',
      });
      return;
    }

    // Get current status and determine new status
    const currentUser = users[userIndex];
    const newStatus = !currentUser.isFingerprintVerified;
    
    try {
      // First update the API
      await updateUserFingerprintStatusService(userId, newStatus);
      
      // Then update local state
      const updatedUsers = users.map(user =>
        user.id === userId
          ? { ...user, isFingerprintVerified: newStatus }
          : user
      );
      setUsers(updatedUsers);
      
      // If this is the current user, update auth store
      if (authUser && authUser.id === userId) {
        // Force a direct update to the store
        useAuthStore.setState(state => ({
          ...state,
          user: state.user ? {
            ...state.user,
            isFingerprintVerified: newStatus
          } : null
        }));
      }
      
      toast({
        title: "Status Updated",
        description: `User verification status set to ${newStatus ? 'Verified' : 'Not Verified'}.`,
      });
    } catch (error) {
      console.error('Failed to update fingerprint status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
    }
  };

  // Function to delete a user with optimistic update
  const handleDeleteUser = async (userId: string) => {
    if (typeof userId === 'undefined') {
      console.error('handleDeleteUser: userId is undefined. Cannot proceed.');
      toast({
        title: "Error",
        description: "Cannot delete user: User ID is missing.",
        variant: "destructive",
      });
      return;
    }

    const originalUsers = [...users];
    // Optimistic UI update
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

    try {
      await deleteUserService(userId);
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      // Revert UI change on error
      setUsers(originalUsers);
      toast({
        title: "Error Deleting User",
        description: (error as Error)?.message || "Could not delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle saving (creating or updating) an election
  const handleSaveElection = async (data: ElectionFormData) => {
    const payload: CreateElectionPayload | UpdateElectionPayload = {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      // Ensure candidates are in the correct payload format
      candidates: data.candidates.map(c => ({ name: c.name, description: c.description, id: c.id.startsWith('new-') ? undefined : c.id })),
      // imageUrl: data.imageUrl, // Add if you have imageUrl in form
    };

    try {
      if (currentElection) { // Editing existing election
        await updateElection(currentElection.id, payload as UpdateElectionPayload);
        toast({
          title: "Election updated",
          description: "The election has been updated successfully",
        });
      } else { // Creating new election
        await createElection(payload as CreateElectionPayload);
        toast({
          title: "Election created",
          description: "The election has been created successfully",
        });
      }
      // Refetch elections to show changes
      const fetchedElections = await getElections();
      setElections(fetchedElections);
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false); 
      setCurrentElection(null); // Reset current election
    } catch (error) {
      console.error('Failed to save election:', error);
      toast({
        title: "Error saving election",
        description: (error as Error)?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleActualDeleteElection = async (electionId: string) => {
    const originalElections = [...elections];
    // Optimistic UI update
    setElections(prevElections => prevElections.filter(election => election.id !== electionId));
    setIsDeleteDialogOpen(false); // Close dialog immediately
    setElectionToDelete(null);

    try {
      await deleteElectionService(electionId);
      toast({
        title: "Election Deleted",
        description: "The election has been successfully deleted from the server.",
      });
    } catch (error) {
      console.error('Failed to delete election:', error);
      // Revert UI change on error
      setElections(originalElections);
      toast({
        title: "Error Deleting Election",
        description: (error as Error)?.message || "Could not delete election. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to open the edit modal with current election data
  const openEditModal = (election: any) => {
    setCurrentElection({
      id: election.id,
      title: election.title,
      description: election.description,
      candidates: election.candidates.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
      })),
      startDate: election.startDate.toISOString().split('T')[0],
      endDate: election.endDate.toISOString().split('T')[0]
    });
    setIsEditModalOpen(true);
  };

  // Function to open the delete confirmation dialog
  const openDeleteDialog = (electionId: string) => {
    setElectionToDelete(electionId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-400">Admin Panel</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{elections.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{elections.filter(e => e.status === "ongoing").length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.filter(u => u.isFingerprintVerified).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Elections Tab */}
        <TabsContent value="elections">
          {electionsLoading && <div key="elections-loading" className="text-center py-10">Loading elections...</div>}
          {electionsError && <div key="elections-error" className="text-center py-10 text-red-500">Error: {electionsError}</div>}
          {!electionsLoading && !electionsError && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400">All Elections</h2>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Election
                </Button>
              </div>

              {elections.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg shadow">
                  <p className="text-muted-foreground">No elections found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {elections.map((election) => (
                    <Card key={election.id} className="overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-blue-700 dark:text-blue-400">{election.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">{election.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="mr-1.5 h-3.5 w-3.5" />
                            <span>{election.candidates.length} candidates</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <CountdownTimer endDate={election.endDate} className="text-xs" />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(election.startDate)} - {formatDate(election.endDate)}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEditModal(election)}
                          className="text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20"
                          onClick={() => openDeleteDialog(election.id)}
                        >
                          <Trash className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400">User Management</h2>
          </div>

          <div className="rounded-md border overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Admin Status</th>
                    <th className="px-4 py-3 text-left font-medium">Fingerprint Status</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <UserTableRows
                    usersLoading={usersLoading}
                    usersError={usersError}
                    users={users}
                    toggleAdminStatus={toggleAdminStatus}
                    toggleFingerprintStatus={toggleFingerprintStatus}
                    handleDeleteUser={handleDeleteUser}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Election Modal */}
      <ElectionFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleSaveElection}
        mode="create"
      />
      
      {/* Edit Election Modal */}
      <ElectionFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialData={currentElection}
        onSubmit={handleSaveElection}
        mode="edit"
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Election"
        description="Are you sure you want to delete this election? This action cannot be undone."
        onConfirm={() => electionToDelete && handleActualDeleteElection(electionToDelete)}
      />
    </div>
  );
};

export default AdminPanel;
