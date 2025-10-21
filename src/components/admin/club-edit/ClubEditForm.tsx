
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClubEditFormValues } from "@/schemas/club-schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface ClubEditFormProps {
  form: UseFormReturn<ClubEditFormValues>;
  disabled?: boolean;
}

const ClubEditForm = ({ form, disabled }: ClubEditFormProps) => {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Club Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter club name" 
                disabled={disabled} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Club Bio</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter club bio"
                rows={4}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ClubEditForm;
