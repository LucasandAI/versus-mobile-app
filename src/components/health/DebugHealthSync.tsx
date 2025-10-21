import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { debugHealthKitConnection } from '@/hooks/health/healthDebug';
import { useApp } from '@/context/AppContext';

export function DebugHealthSync() {
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    if (!currentUser?.id) {
      setError('No user logged in');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const debugResult = await debugHealthKitConnection(currentUser.id);
      setResult(debugResult);
      
      if (!debugResult.success) {
        setError(debugResult.error || 'Debug failed');
      }
    } catch (err) {
      console.error('Debug error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">HealthKit Debug</h2>
      
      <div className="space-y-2">
        <Button 
          onClick={runDebug} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Running...' : 'Run HealthKit Debug'}
        </Button>
        
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-bold">Error:</p>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-gray-100 border border-gray-300 rounded">
            <p className="font-bold">Debug Results:</p>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
