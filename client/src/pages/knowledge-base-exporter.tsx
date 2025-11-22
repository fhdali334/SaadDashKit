import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const exportSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  projectId: z.string().min(1, "Project ID is required"),
  environmentId: z.string().optional(),
  format: z.enum(["json", "txt"]),
});

type ExportFormValues = z.infer<typeof exportSchema>;

export default function KnowledgeBaseExporter() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      apiKey: "",
      projectId: "",
      environmentId: "",
      format: "json",
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (values: ExportFormValues) => {
      // Call the Voiceflow API to export knowledge base data
      return apiRequest("POST", "/api/knowledge-base/export", values);
    },
    onSuccess: (response) => {
      // Create download link
      const url = window.URL.createObjectURL(response);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knowledge-base-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Knowledge base data exported successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export knowledge base data",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: ExportFormValues) => {
    exportMutation.mutate(values);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex items-center gap-4 px-6 h-14">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/knowledge-base")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
          <h1 className="text-lg font-semibold">Knowledge Base Exporter</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Export Knowledge Base Data</CardTitle>
              <CardDescription>
                Export your Voiceflow knowledge base data in various formats.
                This will fetch all knowledge base files and documents from your Voiceflow project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voiceflow API Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VF.DM.xxxxx..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your Voiceflow API key (starts with VF.DM.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Project ID"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The ID of your Voiceflow project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="environmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Environment ID (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Environment ID"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Specify a Voiceflow environment ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Export Format</FormLabel>
                        <FormControl>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                value="json"
                                checked={field.value === "json"}
                                onChange={() => field.onChange("json")}
                              />
                              JSON
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                value="txt"
                                checked={field.value === "txt"}
                                onChange={() => field.onChange("txt")}
                              />
                              TXT
                            </label>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Choose the format for your exported knowledge base data
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={exportMutation.isPending}
                  >
                    {exportMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Knowledge Base
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">About Knowledge Base Export</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="mb-2">
                This exporter connects to your Voiceflow project and downloads all knowledge base files and documents.
              </p>
              <p className="mb-2">
                The export includes:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>All uploaded files and documents</li>
                <li>Metadata including file sizes and upload dates</li>
                <li>File type information</li>
                <li>Knowledge base structure and organization</li>
              </ul>
              <p className="mt-2">
                The exported data will be downloaded as a ZIP archive containing individual files in your chosen format.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
