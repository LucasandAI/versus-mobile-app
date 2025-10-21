
import { useClubDialogs } from './useClubDialogs';
import { useClubJoin } from './useClubJoin';
import { useAvailableClubs } from './useAvailableClubs';

export const useClubActions = () => {
  const {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen
  } = useClubDialogs();

  const { handleRequestToJoin, handleJoinClub } = useClubJoin();
  const { clubs: availableClubs, loading: clubsLoading } = useAvailableClubs();

  return {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
    handleRequestToJoin,
    handleJoinClub,
    availableClubs,
    clubsLoading
  };
};
