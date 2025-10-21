
import { useState } from 'react';

export const useClubDialogs = () => {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [createClubDialogOpen, setCreateClubDialogOpen] = useState(false);

  return {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
  };
};
