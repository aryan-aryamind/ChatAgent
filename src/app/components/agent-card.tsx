import { useState } from "react";
import { Bot, MoreVertical, Shield, Eye, EyeOff, Clock, Trash2, Calendar } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "./ui/dropdown-menu";
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
import { format } from "date-fns";

interface AgentCardProps {
  agentId: string;
  name: string;
  status: "active" | "disabled" | "hidden";
  conversations?: number;
  lastActive?: string;
  ownerEmail?: string;
  ownerName?: string;
  createdAt?: string | Date;
  expiresAt?: string | Date | null;
  isAdminView?: boolean;
  onClick?: () => void;
  onDelete?: (agentId: string) => void;
  onStatusUpdate?: (agentId: string, newStatus: string) => void;
  onExtendExpiry?: (agentId: string) => void;
  image?: string;
  className?: string;
}

export function AgentCard({
  agentId,
  name,
  status,
  conversations,
  lastActive,
  ownerEmail,
  ownerName,
  createdAt,
  expiresAt,
  isAdminView = false,
  onClick,
  onDelete,
  onStatusUpdate,
  onExtendExpiry,
  className,
}: AgentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if (showDeleteDialog || isDeleting) {
      e.stopPropagation();
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[role='menuitem']")) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const handleConfirmDelete = async () => {
    if (onDelete && !isDeleting) {
      setIsDeleting(true);
      try {
        // CLOSE DIALOG FIRST and wait for the backdrop to clean up
        setShowDeleteDialog(false);
        
        // Increased delay (400ms) to allow dialog unmounting animation & body lock removal to finish
        // Radix animations typically take 200-300ms. If we unmount before this, the body lock STICKS.
        await new Promise(resolve => setTimeout(resolve, 400));
        
        await onDelete(agentId);
        toast.success("Agent deleted successfully");
      } catch (error: any) {
        console.error("Error deleting agent:", error);
        toast.error(error.message || "Failed to delete agent");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border hover:border-border-emphasis transition-all cursor-pointer group flex flex-col h-full",
        status === "hidden" && "opacity-75 grayscale-[0.5]",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] shadow-sm">
          <Bot className="h-6 w-6 text-white" />
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[100]">
              <DropdownMenuLabel>Chatbot Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {isAdminView && (
                <>
                  <DropdownMenuItem onClick={() => onStatusUpdate?.(agentId, status === "hidden" ? "active" : "hidden")}>
                    {status === "hidden" ? (
                      <><Eye className="mr-2 h-4 w-4" /> Show in List</>
                    ) : (
                      <><EyeOff className="mr-2 h-4 w-4" /> Hide from List</>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={cn(status === "disabled" ? "text-success" : "text-amber-600")}
                    onClick={() => onStatusUpdate?.(agentId, status === "disabled" ? "active" : "disabled")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {status === "disabled" ? "Enable Chatbot" : "Disable Chatbot"}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onExtendExpiry?.(agentId)}>
                    <Clock className="mr-2 h-4 w-4" /> Extend +30 Days
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                disabled={isDeleting}
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete Agent"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1">
        <h3 className="text-lg font-bold mb-1 truncate">{name}</h3>

        {isAdminView && ownerEmail && (
          <div className="mb-3">
            <div className="text-xs font-medium text-text-secondary truncate">{ownerName || "Unknown Creator"}</div>
            <div className="text-[10px] text-text-muted truncate">{ownerEmail}</div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {(() => {
            const isExpired = expiresAt && new Date() > new Date(expiresAt);
            const displayStatus = isExpired ? "expired" : status;
            
            return (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                  displayStatus === "active" ? "bg-success/10 text-success" :
                    (displayStatus === "hidden") ? "bg-amber-500/10 text-amber-500" :
                      "bg-red-500/10 text-red-500"
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    displayStatus === "active" ? "bg-success" :
                      (displayStatus === "hidden") ? "bg-amber-500" :
                        "bg-red-500"
                  )}
                />
                {displayStatus.toUpperCase()}
              </div>
            );
          })()}
        </div>

        <div className="space-y-1.5">
          {conversations !== undefined && (
            <div className="text-sm text-text-secondary flex items-center gap-2">
              <span className="font-medium text-foreground">{conversations}</span> conversations
            </div>
          )}

          {isAdminView && createdAt && (
            <div className="text-[11px] text-text-muted flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Created {format(new Date(createdAt), "MMM d, yyyy 'at' p")}
            </div>
          )}

          {expiresAt && (
            <div className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Expires {format(new Date(expiresAt), "MMM d, p")}
            </div>
          )}
        </div>
      </div>

      {!isAdminView && lastActive && (
        <div className="text-[10px] text-text-muted mt-4 pt-4 border-t border-border">
          Last trained {lastActive}
        </div>
      )}
    </div>
  );
}