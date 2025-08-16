import { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface LicenseExpirationProps {
  licenseId: number;
  expiresAt: string | null;
}

export default function LicenseExpiration({ licenseId, expiresAt }: LicenseExpirationProps) {
  const [isExpired, setIsExpired] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkExpiration = async () => {
      if (!expiresAt) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/licenses/${licenseId}/is_expired`);
        setIsExpired(response.data.expired);
      } catch (error) {
        console.error(`Failed to check expiration for license ${licenseId}:`, error);
        // Handle error case, maybe set a default state
        setIsExpired(null);
      }
      setIsLoading(false);
    };

    checkExpiration();
  }, [licenseId, expiresAt]);

  if (expiresAt === null) {
    return <span style={{ color: 'green' }}>Never</span>;
  }

  if (isLoading) {
    return <span>Loading...</span>;
  }

  const date = new Date(expiresAt).toLocaleDateString();

  if (isExpired === null || isExpired === undefined) {
    return <span>{date}</span>;
  }

  return (
    <span key={isExpired ? 'expired' : 'not-expired'} style={{ color: isExpired ? 'red' : 'green' }}>
      {date}
    </span>
  );
}
