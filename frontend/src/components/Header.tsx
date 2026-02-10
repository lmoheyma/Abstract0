import { ChevronDown, Check, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import AbstractLogo from "@/components/AbstractLogo";
import BackendStatus from "@/components/BackendStatus";
import type { Project } from "@/hooks/useProjects";

interface HeaderProps {
  projectsState: {
    projects: Project[];
    currentProject: Project | null;
    createProject: (name: string) => Project;
    selectProject: (id: string) => void;
    renameProject: (id: string, newName: string) => void;
    deleteProject: (id: string) => void;
  };
}

const Header = ({ projectsState }: HeaderProps) => {
  const { toast } = useToast();
  const [newProjectName, setNewProjectName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { projects, currentProject, createProject, selectProject, renameProject, deleteProject } = projectsState;

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName("");
      setIsNewProjectOpen(false);
      toast({ title: "Project created", description: `Project "${newProjectName}" created successfully.` });
    }
  };

  const handleRenameProject = () => {
    if (projectToRename && renameValue.trim()) {
      renameProject(projectToRename.id, renameValue.trim());
      setProjectToRename(null);
      setRenameValue("");
      setIsRenameOpen(false);
      toast({ title: "Project renamed", description: `Project renamed to "${renameValue}".` });
    }
  };

  const handleDeleteProject = () => {
    if (!projectToDelete) return;
    deleteProject(projectToDelete.id);
    toast({ title: "Project deleted", description: `Project "${projectToDelete.name}" has been deleted.` });
    setProjectToDelete(null);
  };

  const openRenameDialog = (project: Project) => {
    setProjectToRename(project);
    setRenameValue(project.name);
    setIsRenameOpen(true);
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <AbstractLogo className="w-7 h-7" />
          <span className="font-semibold text-foreground tracking-tight">Abstract0</span>
        </div>

        <div className="h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 hover:text-foreground hover:bg-accent">
              <span className="text-sm">{currentProject?.name || "No project"}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {projects.map((project) => (
              <DropdownMenuItem key={project.id} className="flex items-center justify-between group" onClick={() => selectProject(project.id)}>
                <span className="flex-1">{project.name}</span>
                <div className="flex items-center gap-1">
                  {currentProject?.id === project.id && <Check className="h-4 w-4 text-primary" />}
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); openRenameDialog(project); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {projects.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsNewProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New project...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>Enter a name for your new project.</DialogDescription>
            </DialogHeader>
            <Input placeholder="project-name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateProject()} />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>Enter a new name for the project.</DialogDescription>
            </DialogHeader>
            <Input placeholder="new-name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRenameProject()} />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleRenameProject} disabled={!renameValue.trim()}>Rename</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <BackendStatus />
      </div>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};

export default Header;
