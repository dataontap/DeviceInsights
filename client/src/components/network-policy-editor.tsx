import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Save, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PolicyContent {
  sectionTitle: string;
  sectionDescription: string;
  documentTitle: string;
  documentDescription: string;
  includedItems: string[];
  footerText: string;
}

interface NetworkPolicyData {
  title: string;
  subtitle: string;
  policyContent: PolicyContent;
  version: string;
}

export default function NetworkPolicyEditor() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState<NetworkPolicyData | null>(null);

  const { data: policyData, isLoading } = useQuery<{
    success: boolean;
    policy: NetworkPolicyData;
  }>({
    queryKey: ['/api/network-policy'],
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (policy: NetworkPolicyData) => {
      const response = await apiRequest("PUT", "/api/admin/network-policy", {
        ...policy,
        updatedBy: "admin"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/network-policy'] });
      setIsEditing(false);
      setEditedPolicy(null);
      toast({
        title: "Policy Updated",
        description: "Network policy has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update network policy",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading policy...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const policy = editedPolicy || policyData?.policy;

  if (!policy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No policy data available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const handleEdit = () => {
    setEditedPolicy(policyData!.policy);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedPolicy(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (editedPolicy) {
      updatePolicyMutation.mutate(editedPolicy);
    }
  };

  const handleAddIncludedItem = () => {
    if (editedPolicy) {
      setEditedPolicy({
        ...editedPolicy,
        policyContent: {
          ...editedPolicy.policyContent,
          includedItems: [...editedPolicy.policyContent.includedItems, "New item"]
        }
      });
    }
  };

  const handleRemoveIncludedItem = (index: number) => {
    if (editedPolicy) {
      const newItems = [...editedPolicy.policyContent.includedItems];
      newItems.splice(index, 1);
      setEditedPolicy({
        ...editedPolicy,
        policyContent: {
          ...editedPolicy.policyContent,
          includedItems: newItems
        }
      });
    }
  };

  const handleUpdateIncludedItem = (index: number, value: string) => {
    if (editedPolicy) {
      const newItems = [...editedPolicy.policyContent.includedItems];
      newItems[index] = value;
      setEditedPolicy({
        ...editedPolicy,
        policyContent: {
          ...editedPolicy.policyContent,
          includedItems: newItems
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Network Policy Management</CardTitle>
              <CardDescription>Edit and manage the device compatibility policy displayed to users</CardDescription>
            </div>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit} data-testid="button-edit-policy">
              Edit Policy
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={updatePolicyMutation.isPending} data-testid="button-save-policy">
                <Save className="w-4 h-4 mr-2" />
                {updatePolicyMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={updatePolicyMutation.isPending} data-testid="button-cancel-edit">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Main Title</Label>
          {isEditing ? (
            <Input
              id="title"
              value={editedPolicy?.title || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {...prev, title: e.target.value} : null)}
              data-testid="input-title"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.title}</p>
          )}
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          {isEditing ? (
            <Textarea
              id="subtitle"
              value={editedPolicy?.subtitle || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {...prev, subtitle: e.target.value} : null)}
              rows={2}
              data-testid="input-subtitle"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.subtitle}</p>
          )}
        </div>

        {/* Section Title */}
        <div className="space-y-2">
          <Label htmlFor="sectionTitle">Section Title</Label>
          {isEditing ? (
            <Input
              id="sectionTitle"
              value={editedPolicy?.policyContent.sectionTitle || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {
                ...prev,
                policyContent: {...prev.policyContent, sectionTitle: e.target.value}
              } : null)}
              data-testid="input-section-title"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.policyContent.sectionTitle}</p>
          )}
        </div>

        {/* Section Description */}
        <div className="space-y-2">
          <Label htmlFor="sectionDescription">Section Description</Label>
          {isEditing ? (
            <Textarea
              id="sectionDescription"
              value={editedPolicy?.policyContent.sectionDescription || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {
                ...prev,
                policyContent: {...prev.policyContent, sectionDescription: e.target.value}
              } : null)}
              rows={2}
              data-testid="input-section-description"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.policyContent.sectionDescription}</p>
          )}
        </div>

        {/* Document Title */}
        <div className="space-y-2">
          <Label htmlFor="documentTitle">Document Title</Label>
          {isEditing ? (
            <Input
              id="documentTitle"
              value={editedPolicy?.policyContent.documentTitle || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {
                ...prev,
                policyContent: {...prev.policyContent, documentTitle: e.target.value}
              } : null)}
              data-testid="input-document-title"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.policyContent.documentTitle}</p>
          )}
        </div>

        {/* Document Description */}
        <div className="space-y-2">
          <Label htmlFor="documentDescription">Document Description</Label>
          {isEditing ? (
            <Textarea
              id="documentDescription"
              value={editedPolicy?.policyContent.documentDescription || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {
                ...prev,
                policyContent: {...prev.policyContent, documentDescription: e.target.value}
              } : null)}
              rows={3}
              data-testid="input-document-description"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.policyContent.documentDescription}</p>
          )}
        </div>

        {/* Included Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>What's Included (Bullet Points)</Label>
            {isEditing && (
              <Button onClick={handleAddIncludedItem} variant="outline" size="sm" data-testid="button-add-item">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {policy.policyContent.includedItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                {isEditing ? (
                  <>
                    <Input
                      value={editedPolicy?.policyContent.includedItems[index] || ""}
                      onChange={(e) => handleUpdateIncludedItem(index, e.target.value)}
                      data-testid={`input-item-${index}`}
                    />
                    <Button
                      onClick={() => handleRemoveIncludedItem(index)}
                      variant="outline"
                      size="icon"
                      data-testid={`button-remove-item-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded flex-1">
                    <span className="mr-2">•</span>{item}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Text */}
        <div className="space-y-2">
          <Label htmlFor="footerText">Footer Text</Label>
          {isEditing ? (
            <Input
              id="footerText"
              value={editedPolicy?.policyContent.footerText || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {
                ...prev,
                policyContent: {...prev.policyContent, footerText: e.target.value}
              } : null)}
              data-testid="input-footer-text"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.policyContent.footerText}</p>
          )}
        </div>

        {/* Version */}
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          {isEditing ? (
            <Input
              id="version"
              value={editedPolicy?.version || ""}
              onChange={(e) => setEditedPolicy(prev => prev ? {...prev, version: e.target.value} : null)}
              data-testid="input-version"
            />
          ) : (
            <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">{policy.version}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
