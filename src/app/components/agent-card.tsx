import { useState } from "react";
import { Bot, MoreVertical } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

interface AgentCardProps {
  agentId: string;
  name: string;
  status: "active" | "disabled";
  conversations?: number;
  lastActive?: string;
  onClick?: () => void;
  onDelete?: (agentId: string) => void;
  className?: string;
}

export function AgentCard({
  agentId,
  name,
  status,
  conversations,
  lastActive,
  onClick,
  onDelete,
  className,
}: AgentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if (showDeleteDialog) {
      // Prevent navigation when dialog is open
      e.stopPropagation();
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      try {
        onDelete(agentId);
        toast.success("Agent deleted successfully");
        setShowDeleteDialog(false);
      } catch (error) {
        console.error("Error deleting agent:", error);
        toast.error("Failed to delete agent");
      }
    } else {
      console.warn("onDelete callback not provided");
      toast.error("Delete functionality not available");
    }
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border hover:border-border-emphasis transition-all cursor-pointer group",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div
          className="relative z-10"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <h3 className="text-lg font-semibold mb-2">{name}</h3>

      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "flex items-center gap-1.5 text-sm",
            status === "active" ? "text-success" : "text-text-muted"
          )}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              status === "active" ? "bg-success" : "bg-text-muted"
            )}
          />
          {status === "active" ? "Active" : "Disabled"}
        </div>
      </div>

      {conversations !== undefined && (
        <div className="text-sm text-text-secondary">{conversations} conversations</div>
      )}

      {lastActive && (
        <div className="text-xs text-text-muted mt-2">Last trained {lastActive}</div>
      )}
    </div>
  );
}