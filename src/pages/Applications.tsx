import { useState, useEffect } from 'react';
import { MoreHorizontal } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import apiClient from '@/services/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

import { useApplicationStore } from '@/stores/applicationStore';

// Define the Application data type
interface Application {
  id: number;
  user_id: number;
  name: string;
  status: string;
}

// Define the schema for the create/edit form
const appFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  status: z.string(),
});

export default function ApplicationsPage() {
  // --- STATE MANAGEMENT ---
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for controlling dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State to hold the app being edited or deleted
  const [currentApp, setCurrentApp] = useState<Application | null>(null);

  const form = useForm<z.infer<typeof appFormSchema>>({
    resolver: zodResolver(appFormSchema),
  });

  // --- DATA FETCHING ---
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/applications/get_all');
      setApplications(response.data.applications || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch applications.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const { selectedAppId, setSelectedAppId } = useApplicationStore();

  // --- DIALOG HANDLERS ---
  const handleOpenCreateDialog = () => {
    setCurrentApp(null); // Ensure we are in "create" mode
    form.reset({ name: "", status: "active" });
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (app: Application) => {
    setCurrentApp(app); // Set the current app for "edit" mode
    form.reset({ name: app.name, status: app.status });
    setIsFormDialogOpen(true);
  };

  const handleOpenDeleteDialog = (app: Application) => {
    setCurrentApp(app);
    setIsDeleteDialogOpen(true);
  }

  // --- API CALLS ---
  const onFormSubmit = async (values: z.infer<typeof appFormSchema>) => {
    try {
      if (currentApp) { // EDIT MODE
        await apiClient.post('/applications/rename', { application_id: currentApp.id, name: values.name });
        await apiClient.post('/applications/set_status', { application_id: currentApp.id, status: values.status });
      } else { // CREATE MODE
        await apiClient.post('/applications/create', { name: values.name });
      }
      setIsFormDialogOpen(false);
      fetchApplications(); // Re-fetch data to show changes
    } catch (error) {
      console.error("Operation failed:", error);
      alert("Operation failed.");
    }
  };

  const onDeleteConfirm = async () => {
    if (!currentApp) return;
    try {
      await apiClient.post('/applications/delete', { application_id: currentApp.id });
      setIsDeleteDialogOpen(false);
      fetchApplications(); // Re-fetch data to show changes
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete application.");
    }
  };
  
  // --- RENDER LOGIC ---
  if (isLoading) return <div>Loading applications...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <Button onClick={handleOpenCreateDialog}>Create New</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Application ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length > 0 ? (
              applications.map((app) => (
                <TableRow 
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`cursor-pointer ${selectedAppId === app.id ? 'bg-muted/50' : ''}`}
                >
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>{app.status}</TableCell>
                  <TableCell>{app.id}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="w-8 h-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(app)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleOpenDeleteDialog(app)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">No applications found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- DIALOGS --- */}
      {/* Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentApp ? "Edit Application" : "Create New Application"}</DialogTitle>
            <DialogDescription>{currentApp ? "Rename your application or change its status." : "Give your new application a name."}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem><Label>Name</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              {currentApp && ( // Only show status field when editing
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem><Label>Status</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the application "{currentApp?.name}".</AlertDialogDescription>
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