import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useApplicationStore } from '@/stores/applicationStore';
import { useMachineStore } from '@/stores/machineStore';
import apiClient from '@/services/apiClient';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import LicenseExpiration from '@/components/shared/LicenseExpiration';

// --- TYPE AND SCHEMA DEFINITIONS ---
interface License {
  id: number;
  application_id: number;
  license_key: string;
  tier: number;
  max_allowed_machines: number;
  created_at: string;
  expires_at: string | null;
  flags: string[];
}

const licenseFormSchema = z.object({
  license_key: z.string().optional(),
  tier: z.coerce.number().min(0),
  max_allowed_machines: z.coerce.number().min(0).optional(),
  flags: z.string().optional(),
  duration_seconds: z.coerce.number().min(0).optional(),
});

type LicenseFormValues = z.infer<typeof licenseFormSchema>;

export default function LicensesPage() {
  const selectedAppId = useApplicationStore((state) => state.selectedAppId);
  const { selectedLicenseId, setSelectedLicenseId } = useMachineStore();

  // --- STATE MANAGEMENT ---
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentLicense, setCurrentLicense] = useState<License | null>(null);

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
  });

  // --- DATA FETCHING ---
  const fetchLicenses = async () => {
    if (!selectedAppId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/applications/${selectedAppId}/licenses`);
      setLicenses(response.data.licenses || []);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch licenses for application ${selectedAppId}.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [selectedAppId]);

  // --- DIALOG HANDLERS ---
  const handleOpenCreateDialog = () => {
    setCurrentLicense(null);
    form.reset({ license_key: "", tier: 0, max_allowed_machines: 1, flags: "", duration_seconds: 0 });
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (license: License) => {
    setCurrentLicense(license);
    form.reset({
      tier: license.tier,
      max_allowed_machines: license.max_allowed_machines,
      flags: license.flags.join(', '),
      duration_seconds: 0,
    });
    setIsFormDialogOpen(true);
  };

  const handleOpenDeleteDialog = (license: License) => {
    setCurrentLicense(license);
    setIsDeleteDialogOpen(true);
  };

  // --- API CALLS ---
  const onFormSubmit = async (values: LicenseFormValues) => {
    try {
      if (currentLicense) { // EDIT MODE
        // --- CORRECTED SEQUENTIAL LOGIC ---
        // We now await each request one by one to avoid a race condition.
        if (values.tier !== currentLicense.tier) {
          await apiClient.post('/licenses/set_tier', { license_id: currentLicense.id, tier: values.tier });
        }
        if (values.max_allowed_machines !== currentLicense.max_allowed_machines) {
          await apiClient.post('/licenses/set_max_machines', { license_id: currentLicense.id, max_machines: values.max_allowed_machines });
        }
        if (values.flags !== currentLicense.flags.join(', ')) {
          const flagsArray = values.flags ? values.flags.split(',').map(f => f.trim()).filter(f => f) : [];
          await apiClient.post('/licenses/set_flags', { license_id: currentLicense.id, flags: flagsArray });
        }
        if (values.duration_seconds && values.duration_seconds > 0) {
          await apiClient.post('/licenses/set_duration', { license_id: currentLicense.id, duration_seconds: values.duration_seconds });
        }
        // --- END OF CORRECTION ---
      } else { // CREATE MODE
        if (!selectedAppId || !values.license_key) return;
        await apiClient.post('/licenses/create', {
          application_id: selectedAppId,
          license_key: values.license_key,
          tier: values.tier,
        });
      }
      setIsFormDialogOpen(false);
      fetchLicenses(); // Re-fetch data to show changes
    } catch (error) {
      console.error("Operation failed:", error);
      alert("Operation failed.");
    }
  };

  const onDeleteConfirm = async () => {
    if (!currentLicense) return;
    try {
      await apiClient.post('/licenses/delete', { license_id: currentLicense.id });
      setIsDeleteDialogOpen(false);
      fetchLicenses();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete application.");
    }
  };

  const renderContent = () => {
    if (!selectedAppId) {
      return (
        <div className="flex items-center justify-center h-24 text-center border rounded-lg">
          <p>Please select an application from the Applications page to view its licenses.</p>
        </div>
      );
    }
    if (isLoading) return <div className="text-center">Loading licenses...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Key</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Max Machines</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.length > 0 ? (
              licenses.map((license) => (
                <TableRow key={license.id} onClick={() => setSelectedLicenseId(license.id)} className={selectedLicenseId === license.id ? 'bg-muted/50' : ''}>
                  <TableCell className="font-mono">{license.license_key}</TableCell>
                  <TableCell>{license.tier}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {license.flags.length > 0 ? (
                        license.flags.map((flag) => (<Badge key={flag} variant="secondary">{flag}</Badge>))
                      ) : (<span className="text-xs text-muted-foreground">No flags</span>)}
                    </div>
                  </TableCell>
                  <TableCell>{license.max_allowed_machines}</TableCell>
                  <TableCell>{new Date(license.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><LicenseExpiration licenseId={license.id} expiresAt={license.expires_at} /></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="w-8 h-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(license)}>Edit</DropdownMenuItem>
                        
                        <DropdownMenuItem className="text-red-600" onClick={() => handleOpenDeleteDialog(license)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (<TableRow><TableCell colSpan={7} className="h-24 text-center">No licenses found for this application.</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/applications" className="flex items-center text-sm text-muted-foreground hover:underline mb-2"><ArrowLeft className="w-4 h-4 mr-1" />Back to Applications</Link>
          <h1 className="text-3xl font-bold">Licenses {selectedAppId ? `(App ID: ${selectedAppId})` : ''}</h1>
        </div>
        <Button onClick={handleOpenCreateDialog} disabled={!selectedAppId}>Create License</Button>
      </div>

      {renderContent()}

      {/* --- DIALOGS --- */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentLicense ? "Edit License" : "Create New License"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 py-4">
              {!currentLicense && (
                <FormField control={form.control} name="license_key" render={({ field }) => (
                  <FormItem><Label>License Key</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              <FormField control={form.control} name="tier" render={({ field }) => (
                <FormItem><Label>Tier</Label><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {currentLicense && (
                <>
                  <FormField control={form.control} name="max_allowed_machines" render={({ field }) => (
                    <FormItem><Label>Max Allowed Machines</Label><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="flags" render={({ field }) => (
                    <FormItem><Label>Flags (comma-separated)</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="duration_seconds" render={({ field }) => (
                    <FormItem><Label>Add Duration (in seconds)</Label><FormControl><Input type="number" placeholder="e.g., 86400 for 1 day" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </>
              )}
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete license "{currentLicense?.license_key}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}