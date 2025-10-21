import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debugHealthKitConnection, checkHealthKitSchema } from '@/hooks/health/healthDebug';
import { useApp } from '@/context/AppContext';

export function HealthKitDebug() {
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
      // First check the schema
      const schemaResult = await checkHealthKitSchema();
      
      if (!schemaResult.success) {
        setError(schemaResult.error || 'Failed to check schema');
        setResult({ schemaCheck: schemaResult });
        return;
      }

      // Then test the connection
      const debugResult = await debugHealthKitConnection(currentUser.id);
      setResult({
        schema: schemaResult.schema,
        connectionTest: debugResult
      });
      
      if (!debugResult.success) {
        setError(debugResult.error || 'Connection test failed');
      }
    } catch (err) {
      console.error('Debug error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>HealthKit Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={runDebug} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Running Tests...' : 'Run HealthKit Debug'}
          </Button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium text-red-700">Error:</p>
              <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          
          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-700">Schema Check</h3>
                <pre className="mt-2 text-sm text-blue-600 overflow-x-auto">
                  {JSON.stringify(result.schema || result.schemaCheck, null, 2)}
                </pre>
              </div>
              
              {result.connectionTest && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-700">Connection Test</h3>
                  <pre className="mt-2 text-sm text-green-600 overflow-x-auto">
                    {JSON.stringify(
                      result.connectionTest, 
                      (key, value) => key === 'samples' ? '[Samples data...]' : value,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
