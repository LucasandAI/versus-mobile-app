
import React from 'react';
import { JoinRequest } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import JoinRequestButtons from './JoinRequestButtons';
import { formatDistanceToNow } from 'date-fns';

interface JoinRequestItemProps {
  request: JoinRequest;
  onApprove: () => void;
  onDeny: () => void;
  isClubFull: boolean;
  isProcessing: boolean;
}

const JoinRequestItem: React.FC<JoinRequestItemProps> = ({
  request,
  onApprove,
  onDeny,
  isClubFull,
  isProcessing
}) => {
  const formattedDate = formatDistanceToNow(
    new Date(request.createdAt),
    { addSuffix: true }
  );

  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <UserAvatar name={request.userName} image={request.userAvatar} size="sm" />
        <div>
          <p className="font-medium">{request.userName}</p>
          <p className="text-xs text-gray-500">
            Requested {formattedDate}
          </p>
        </div>
      </div>
      <JoinRequestButtons
        request={request}
        onApprove={onApprove}
        onDeny={onDeny}
        isClubFull={isClubFull}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default JoinRequestItem;
