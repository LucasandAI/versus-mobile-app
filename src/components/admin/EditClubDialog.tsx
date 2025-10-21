
import React from 'react';
import { Club } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { useClubForm } from '@/hooks/club/useClubForm';
import LogoUploadSection from './club-edit/LogoUploadSection';
import ClubEditForm from './club-edit/ClubEditForm';
import { Form } from '@/components/ui/form';
import { clubEditSchema, ClubEditFormValues } from '@/schemas/club-schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';

interface EditClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
}

const EditClubDialog: React.FC<EditClubDialogProps> = ({ 
  open, 
  onOpenChange, 
  club 
}) => {
  const form = useForm<ClubEditFormValues>({
    resolver: zodResolver(clubEditSchema),
    defaultValues: {
      name: club.name,
      bio: club.bio || 'A club for enthusiastic runners'
    }
  });

  const {
    logoPreview,
    handleLogoChange,
    handleSave,
    loading
  } = useClubForm(club, () => onOpenChange(false));

  const onSubmit = async (values: ClubEditFormValues) => {
    if (loading) return;
    
    try {
      await handleSave({
        ...values,
        logo: logoPreview
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update club",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Club Details</DialogTitle>
          <DialogDescription>Make changes to your club's profile here.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="py-4 space-y-6">
              <LogoUploadSection
                logoPreview={logoPreview}
                name={form.watch("name")}
                onLogoChange={handleLogoChange}
                disabled={loading}
              />
              
              <ClubEditForm
                form={form}
                disabled={loading}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClubDialog;
