import { useState, useEffect, useCallback } from "react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { baseTemplate } from "@/services/sandpack";
import { deleteProjectMessages } from "./useChatMessages";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

const STORAGE_KEY = "abstract0_projects";
const CURRENT_PROJECT_KEY = "abstract0_current_project";
const FILES_STORAGE_PREFIX = "abstract0_files_";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading projects:", e);
  }
  const defaultProject: Project = {
    id: generateId(),
    name: "my-project",
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultProject]));
  localStorage.setItem(CURRENT_PROJECT_KEY, defaultProject.id);
  return [defaultProject];
}

function loadCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}

function loadProjectFiles(projectId: string): SandpackFiles {
  try {
    const stored = localStorage.getItem(FILES_STORAGE_PREFIX + projectId);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading project files:", e);
  }
  return { ...baseTemplate };
}

function saveProjectFiles(projectId: string, files: SandpackFiles): void {
  try {
    localStorage.setItem(FILES_STORAGE_PREFIX + projectId, JSON.stringify(files));
  } catch (e) {
    console.error("Error saving project files:", e);
  }
}

function deleteProjectFiles(projectId: string): void {
  localStorage.removeItem(FILES_STORAGE_PREFIX + projectId);
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => loadCurrentProjectId());
  const [projectFiles, setProjectFiles] = useState<SandpackFiles>(() => {
    const id = loadCurrentProjectId();
    return id ? loadProjectFiles(id) : { ...baseTemplate };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (currentProjectId) {
      const files = loadProjectFiles(currentProjectId);
      setProjectFiles(files);
    }
  }, [currentProjectId]);

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0] || null;

  const createProject = useCallback((name: string) => {
    const newProject: Project = {
      id: generateId(),
      name: name.toLowerCase().replace(/\s+/g, "-"),
      createdAt: Date.now(),
    };
    saveProjectFiles(newProject.id, { ...baseTemplate });
    setProjects((prev) => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    setProjectFiles({ ...baseTemplate });
    return newProject;
  }, []);

  const selectProject = useCallback((id: string) => {
    if (currentProjectId) {
      saveProjectFiles(currentProjectId, projectFiles);
    }
    setCurrentProjectId(id);
  }, [currentProjectId, projectFiles]);

  const renameProject = useCallback((id: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: newName.toLowerCase().replace(/\s+/g, "-") } : p
      )
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    deleteProjectFiles(id);
    deleteProjectMessages(id);
    
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length === 0) {
        const defaultProject: Project = {
          id: generateId(),
          name: "my-project",
          createdAt: Date.now(),
        };
        saveProjectFiles(defaultProject.id, { ...baseTemplate });
        setCurrentProjectId(defaultProject.id);
        setProjectFiles({ ...baseTemplate });
        return [defaultProject];
      }
      if (id === currentProjectId) {
        setCurrentProjectId(filtered[0].id);
      }
      return filtered;
    });
  }, [currentProjectId]);

  const updateProjectFiles = useCallback((files: SandpackFiles) => {
    setProjectFiles(files);
    if (currentProjectId) {
      saveProjectFiles(currentProjectId, files);
    }
  }, [currentProjectId]);

  return {
    projects,
    currentProject,
    currentProjectId,
    projectFiles,
    createProject,
    selectProject,
    renameProject,
    deleteProject,
    updateProjectFiles,
  };
}
