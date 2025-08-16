import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useMachineStore } from '@/stores/machineStore';
import apiClient from '@/services/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface Machine {
  id: string;
  hwid: string;
  created_at: string;
}

export default function MachinesPage() {
  const selectedLicenseId = useMachineStore((state) => state.selectedLicenseId);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMachines = async () => {
      if (!selectedLicenseId) return;
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/licenses/${selectedLicenseId}/machines`);
        setMachines(response.data.machines || []);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch machines for license ${selectedLicenseId}.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMachines();
  }, [selectedLicenseId]);

  const renderContent = () => {
    if (!selectedLicenseId) {
      return (
        <div className="flex items-center justify-center h-24 text-center border rounded-lg">
          <p>Please select a license from the Licenses page to view its machines.</p>
        </div>
      );
    }

    if (isLoading) return <div className="text-center">Loading machines...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Machine ID</TableHead>
              <TableHead>HWID</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.length > 0 ? (
              machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-mono">{machine.id}</TableCell>
                  <TableCell>{machine.hwid}</TableCell>
                  <TableCell>{new Date(machine.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No machines found for this license.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/licenses" className="flex items-center text-sm text-muted-foreground hover:underline mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Licenses
          </Link>
          <h1 className="text-3xl font-bold">Machines {selectedLicenseId ? `(License ID: ${selectedLicenseId})` : ''}</h1>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
