import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash, Upload } from 'lucide-react';

type Candidate = {
  id: string;
  name: string;
  description: string;
};

type ElectionFormData = {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  candidates: Candidate[];
};

const defaultFormData: ElectionFormData = {
  title: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  startTime: '12:00',
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endTime: '12:00',
  candidates: [],
};

interface ElectionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ElectionFormData | null;
  onSubmit: (data: ElectionFormData) => void;
  mode: 'create' | 'edit';
}

const ElectionFormModal = ({ open, onOpenChange, initialData = null, onSubmit, mode }: ElectionFormModalProps) => {
  const [formData, setFormData] = useState<ElectionFormData>(defaultFormData);

  // Update formData when initialData changes or modal opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Ensure initialData has candidates array and time fields
        let startTime = '12:00';
        let endTime = '12:00';
        
        // If initialData comes from an existing election with ISO date strings
        if (initialData.startDate && initialData.startDate.includes('T')) {
          const startDateTime = new Date(initialData.startDate);
          startTime = startDateTime.toTimeString().slice(0, 5); // Format: HH:MM
          initialData.startDate = startDateTime.toISOString().split('T')[0];
        }
        
        if (initialData.endDate && initialData.endDate.includes('T')) {
          const endDateTime = new Date(initialData.endDate);
          endTime = endDateTime.toTimeString().slice(0, 5); // Format: HH:MM
          initialData.endDate = endDateTime.toISOString().split('T')[0];
        }
        
        const data = {
          ...initialData,
          startTime: initialData.startTime || startTime,
          endTime: initialData.endTime || endTime,
          candidates: initialData.candidates || [],
        };
        setFormData(data);
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addCandidate = () => {
    const newCandidate: Candidate = {
      id: `candidate-${Date.now()}`,
      name: '',
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      candidates: [...prev.candidates, newCandidate],
    }));
  };

  const removeCandidate = (index: number) => {
    const updatedCandidates = [...formData.candidates];
    updatedCandidates.splice(index, 1);
    setFormData((prev) => ({ ...prev, candidates: updatedCandidates }));
  };

  const updateCandidate = (index: number, field: keyof Candidate, value: string) => {
    const updatedCandidates = [...formData.candidates];
    updatedCandidates[index] = { ...updatedCandidates[index], [field]: value };
    setFormData((prev) => ({ ...prev, candidates: updatedCandidates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'Election details are required',
        variant: 'destructive',
      });
      return;
    }

    // Combine date and time for comparison
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`);
    
    // Check if end date/time is after start date/time
    if (endDateTime <= startDateTime) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    // Validate candidates
    if (formData.candidates.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one candidate is required',
        variant: 'destructive',
      });
      return;
    }

    // Check if all candidates have names
    const invalidCandidates = formData.candidates.filter((c) => !c.name.trim());
    if (invalidCandidates.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'All candidates must have names',
        variant: 'destructive',
      });
      return;
    }

    // Combine date and time for submission
    const combinedData = {
      ...formData,
      startDate: `${formData.startDate}T${formData.startTime}:00`,
      endDate: `${formData.endDate}T${formData.endTime}:00`
    };
    onSubmit(combinedData);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Election' : 'Edit Election'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' ? 'Fill in the details below to create a new election.' : 'Modify the details of the existing election below.'}
            </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='space-y-6 py-4'
        >
          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Election Details</h3>

            <div className='grid gap-3'>
              <Label htmlFor='title'>Election Title</Label>
              <Input
                id='title'
                name='title'
                value={formData.title}
                onChange={handleChange}
                placeholder='Enter election title'
                required
              />
            </div>

            <div className='grid gap-3'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder='Enter election description'
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='grid gap-3'>
                <Label htmlFor='startDate'>Start Date</Label>
                <div className='flex gap-2'>
                  <Input
                    id='startDate'
                    name='startDate'
                    type='date'
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className='flex-1'
                  />
                  <Input
                    id='startTime'
                    name='startTime'
                    type='time'
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className='w-24'
                  />
                </div>
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='endDate'>End Date</Label>
                <div className='flex gap-2'>
                  <Input
                    id='endDate'
                    name='endDate'
                    type='date'
                    value={formData.endDate}
                    className='flex-1'
                    onChange={handleChange}
                    required
                  />
                  <Input
                    id='endTime'
                    name='endTime'
                    type='time'
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className='w-24'
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>Candidates</h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addCandidate}
                className='text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              >
                <Plus className='mr-2 h-4 w-4' />
                Add Candidate
              </Button>
            </div>

            {formData.candidates.length === 0 ? (
              <div className='text-center py-6 bg-muted/30 rounded-lg'>
                <p className='text-sm text-muted-foreground'>No candidates added yet</p>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={addCandidate}
                  className='mt-2 text-blue-600'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Your First Candidate
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                {formData.candidates.map((candidate, index) => (
                  <div
                    key={candidate.id}
                    className='border rounded-md p-4 space-y-3'
                  >
                    <div className='flex justify-between items-center'>
                      <h4 className='font-medium'>Candidate {index + 1}</h4>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeCandidate(index)}
                        className='text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
                      >
                        <Trash className='h-4 w-4' />
                      </Button>
                    </div>

                    <div className='grid gap-3'>
                      <Label htmlFor={`candidate-name-${index}`}>Name</Label>
                      <Input
                        id={`candidate-name-${index}`}
                        value={candidate.name}
                        onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                        placeholder='Candidate name'
                        required
                      />
                    </div>

                    <div className='grid gap-3'>
                      <Label htmlFor={`candidate-description-${index}`}>Description</Label>
                      <Textarea
                        id={`candidate-description-${index}`}
                        value={candidate.description}
                        onChange={(e) => updateCandidate(index, 'description', e.target.value)}
                        placeholder='Brief description'
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-blue-600 hover:bg-blue-700'
            >
              {mode === 'create' ? 'Create Election' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ElectionFormModal;
