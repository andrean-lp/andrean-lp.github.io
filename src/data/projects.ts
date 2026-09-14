import projectsData from './projects.json';

export interface Project {
  name: string;
  demoLink?: string;
  tags?: string[];
  description?: string;
  postLink?: string;
  demoLinkRel?: string;
  [key: string]: any;
}

export const projects: Project[] = Array.isArray(projectsData) 
  ? projectsData 
  : (projectsData.projects || []);
