
import React from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';

const ClubDetail: React.FC = () => {
  const { selectedClub } = useApp();

  if (!selectedClub) {
    return <LoadingState />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
