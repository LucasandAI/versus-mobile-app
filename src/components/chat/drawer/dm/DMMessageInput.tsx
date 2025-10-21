
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DMMessageInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
  userId: string;
  conversationId: string;
}

const DMMessageInput: React.FC<DMMessageInputProps> = ({
  onSendMessage,
  isSending,
  userId,
  conversationId
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = () => {
    if (message.trim() && !isSending) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Auto focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [conversationId]); // Re-focus when conversation changes
  
  return (
    <div className="p-2 border-t relative">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isSending}
          rows={1}
        />
        <Button 
          size="icon" 
          className="rounded-full h-9 w-9 shrink-0" 
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(DMMessageInput);
