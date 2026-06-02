import { defineStore } from "pinia";
import { ref } from "vue";

const STORAGE_KEY = "musicHub.artistProjects.v1";
const MS_DAY = 24 * 60 * 60 * 1000;

const daysFromNow = (days) => new Date(Date.now() + days * MS_DAY).toISOString();
const timestampFromNow = (days) => new Date(Date.now() + days * MS_DAY).toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));
const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildDefaultCollaborators = (owner = "Project Owner") => [
  {
    id: makeId("collaborator"),
    name: owner,
    role: "Project Owner",
  },
  {
    id: makeId("collaborator"),
    name: "Creative Lead",
    role: "Creative",
  },
  {
    id: makeId("collaborator"),
    name: "Operations Lead",
    role: "Operations",
  },
];

const buildDefaultLinks = (artistSlug, projectId) => [
  {
    id: makeId("link"),
    type: "files",
    label: "Review Files",
    description: "Masters, artwork, and delivery folders",
    route: "/files",
    cta: "Open Files",
  },
  {
    id: makeId("link"),
    type: "calendar",
    label: "Schedule",
    description: "Sessions, approvals, and launch deadlines",
    route: "/calendar",
    cta: "Open Calendar",
  },
  {
    id: makeId("link"),
    type: "notes",
    label: "Notes",
    description: "Working notes, approvals, and feedback",
    route: "/notes",
    cta: "Open Notes",
  },
  {
    id: makeId("link"),
    type: "team",
    label: "Collaborators",
    description: "People assigned to this project",
    route: "/team",
    cta: "Open Team",
  },
  {
    id: makeId("link"),
    type: "timeline",
    label: "Timeline",
    description: "Milestones and release sequencing",
    route: "/timeline",
    cta: "Open Timeline",
  },
  {
    id: makeId("link"),
    type: "self",
    label: "Project Board",
    description: "Return to the artist project board",
    route: `/artists/${artistSlug}/projects/${projectId}`,
    cta: "Copy Project Link",
  },
];

const buildDefaultActivity = (projectName, owner) => [
  {
    id: makeId("activity"),
    title: "Project seeded",
    detail: `${projectName} workspace was initialized for ${owner}.`,
    timestamp: timestampFromNow(-4),
  },
  {
    id: makeId("activity"),
    title: "Timeline aligned",
    detail: "Deadlines and milestone dates were mapped to the current release window.",
    timestamp: timestampFromNow(-2),
  },
];

const normalizeMilestones = (milestones = []) =>
  milestones.map((milestone, index) => ({
    id: milestone.id || `m${index + 1}`,
    title: milestone.title || `Milestone ${index + 1}`,
    due_date: milestone.due_date || daysFromNow(index + 1),
    done: Boolean(milestone.done),
    owner: milestone.owner || "Unassigned",
  }));

const buildProject = (artistSlug, project) => {
  const milestones = normalizeMilestones(project.milestones || []);
  const completedMilestones = milestones.filter((item) => item.done).length;
  const tasks = project.tasks || {
    completed: completedMilestones,
    total: Math.max(milestones.length, completedMilestones),
  };
  const totalTasks = Math.max(Number(tasks.total) || 0, milestones.length, 1);
  const completedTasks = Math.min(Number(tasks.completed) || completedMilestones, totalTasks);
  const progress = project.progress ?? Math.round((completedTasks / totalTasks) * 100);

  return {
    id: project.id || makeId("proj"),
    name: project.name || "Untitled Project",
    category: project.category || "Release",
    status: project.status || "planning",
    priority: project.priority || "medium",
    progress,
    owner: project.owner || "Project Owner",
    description: project.description || "Project workspace",
    brief:
      project.brief ||
      "Use this workspace to coordinate cross-functional execution, milestones, and approvals.",
    nextMilestone:
      project.nextMilestone || milestones.find((item) => !item.done)?.title || "Release ready",
    deadline: project.deadline || daysFromNow(21),
    launchWindow: project.launchWindow || "TBD",
    budget: project.budget || "$0",
    health: project.health || "on-track",
    tasks: {
      completed: completedTasks,
      total: totalTasks,
    },
    milestones,
    collaborators: clone(
      project.collaborators || buildDefaultCollaborators(project.owner || "Project Owner"),
    ),
    links: clone(project.links || buildDefaultLinks(artistSlug, project.id || makeId("proj-link"))),
    activity: clone(
      project.activity ||
        buildDefaultActivity(project.name || "Project", project.owner || "Project Owner"),
    ),
    updated_at: project.updated_at || new Date().toISOString(),
    created_at: project.created_at || new Date().toISOString(),
  };
};

const syncTaskProgressToMilestones = (project) => {
  const totalTasks = Math.max(
    Number(project.tasks?.total) || project.milestones.length || 1,
    project.milestones.length,
    1,
  );
  const completedMilestones = project.milestones.filter((item) => item.done).length;
  const completedTasks = project.milestones.length
    ? Math.round((completedMilestones / project.milestones.length) * totalTasks)
    : 0;

  project.tasks = {
    completed: Math.min(completedTasks, totalTasks),
    total: totalTasks,
  };

  return project;
};

const recalculateProject = (project) => {
  const milestones = normalizeMilestones(project.milestones || []);
  const totalTasks = Math.max(
    Number(project.tasks?.total) || milestones.length || 1,
    milestones.length,
    1,
  );
  const milestoneCompleted = milestones.filter((item) => item.done).length;
  const completed = Math.min(Number(project.tasks?.completed) || milestoneCompleted, totalTasks);

  project.milestones = milestones;
  project.tasks = {
    completed,
    total: totalTasks,
  };
  project.progress = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  project.nextMilestone = milestones.find((item) => !item.done)?.title || "Release ready";
  project.updated_at = new Date().toISOString();

  if (project.progress >= 100) {
    project.status = "completed";
    project.health = "ready";
  }

  return project;
};

const getSeedProjects = (artistSlug, artistName = "Artist") => [
  buildProject(artistSlug, {
    id: "proj-1",
    name: "Midnight Dreams EP",
    category: "Release",
    status: "active",
    progress: 75,
    deadline: daysFromNow(30),
    launchWindow: "Late March",
    updated_at: daysFromNow(-1),
    owner: "Sarah Chen",
    priority: "high",
    budget: "$48,000",
    health: "on-track",
    description: `Finalize masters, artwork, and sequencing for ${artistName}'s EP release window.`,
    brief:
      "This project covers final production, packaging, DSP delivery, and launch prep for the EP release.",
    nextMilestone: "Approve final master",
    tasks: { completed: 18, total: 24 },
    milestones: [
      {
        id: "m1",
        title: "Finalize tracklist",
        due_date: daysFromNow(-5),
        done: true,
        owner: "A&R",
      },
      {
        id: "m2",
        title: "Approve final master",
        due_date: daysFromNow(1),
        done: false,
        owner: "Artist",
      },
      {
        id: "m3",
        title: "Distribution handoff",
        due_date: daysFromNow(8),
        done: false,
        owner: "Ops",
      },
      {
        id: "m4",
        title: "Pre-save campaign live",
        due_date: daysFromNow(14),
        done: false,
        owner: "Marketing",
      },
    ],
    collaborators: [
      { id: "c1", name: "Sarah Chen", role: "Project Owner" },
      { id: "c2", name: "Theo Battaglia", role: "Executive" },
      { id: "c3", name: "Jordan Lee", role: "Marketing" },
    ],
    activity: [
      {
        id: "a1",
        title: "Master revisions delivered",
        detail: "Mix notes were consolidated and returned to engineering.",
        timestamp: timestampFromNow(-3),
      },
      {
        id: "a2",
        title: "Artwork route approved",
        detail: "Cover direction locked for distribution packaging.",
        timestamp: timestampFromNow(-2),
      },
      {
        id: "a3",
        title: "Pre-save launch drafted",
        detail: "Marketing team built the first pass of launch copy.",
        timestamp: timestampFromNow(-1),
      },
    ],
  }),
  buildProject(artistSlug, {
    id: "proj-2",
    name: "Music Video Production",
    category: "Creative",
    status: "planning",
    progress: 25,
    deadline: daysFromNow(45),
    launchWindow: "Mid April",
    updated_at: daysFromNow(-2),
    owner: "Mike Johnson",
    priority: "medium",
    budget: "$82,000",
    health: "watch",
    description: "Coordinate treatment, production calendar, and post workflow.",
    brief:
      "This project organizes concept development, crew booking, production, and edit approvals for the hero video.",
    nextMilestone: "Lock shoot treatment",
    tasks: { completed: 5, total: 20 },
    milestones: [
      {
        id: "m1",
        title: "Lock shoot treatment",
        due_date: daysFromNow(3),
        done: false,
        owner: "Creative",
      },
      {
        id: "m2",
        title: "Book location permits",
        due_date: daysFromNow(10),
        done: false,
        owner: "Production",
      },
      {
        id: "m3",
        title: "Finalize crew roster",
        due_date: daysFromNow(15),
        done: false,
        owner: "Production",
      },
      {
        id: "m4",
        title: "Principal photography",
        due_date: daysFromNow(23),
        done: false,
        owner: "Director",
      },
    ],
  }),
  buildProject(artistSlug, {
    id: "proj-3",
    name: "Launch Campaign Sprint",
    category: "Marketing",
    status: "review",
    progress: 88,
    deadline: daysFromNow(9),
    launchWindow: "Release week",
    updated_at: daysFromNow(-1),
    owner: "Alex Rivera",
    priority: "high",
    budget: "$27,500",
    health: "at-risk",
    description: "Finalize rollout copy, assets, and ad sequencing ahead of release week.",
    brief:
      "This sprint captures release-week paid media, copy approvals, social rollout, and partner coordination.",
    nextMilestone: "Approve paid media budget",
    tasks: { completed: 14, total: 16 },
    milestones: [
      {
        id: "m1",
        title: "Finalize campaign calendar",
        due_date: daysFromNow(-4),
        done: true,
        owner: "Marketing",
      },
      {
        id: "m2",
        title: "Approve paid media budget",
        due_date: daysFromNow(2),
        done: false,
        owner: "Finance",
      },
      {
        id: "m3",
        title: "Deliver influencer kit",
        due_date: daysFromNow(4),
        done: false,
        owner: "Marketing",
      },
      {
        id: "m4",
        title: "Launch day command center",
        due_date: daysFromNow(9),
        done: false,
        owner: "Ops",
      },
    ],
  }),
];

export const useArtistProjectsStore = defineStore("artistProjects", () => {
  const projectsByArtist = ref({});
  const initialized = ref(false);

  const persist = () => {
    if (!canUseStorage()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsByArtist.value));
  };

  const migrateProjects = () => {
    let didChange = false;

    Object.entries(projectsByArtist.value).forEach(([artistSlug, projects]) => {
      if (!Array.isArray(projects)) {
        projectsByArtist.value[artistSlug] = [];
        didChange = true;
        return;
      }

      const normalized = projects.map((project) => {
        const nextProject = buildProject(artistSlug, project);
        if (JSON.stringify(nextProject) !== JSON.stringify(project)) {
          didChange = true;
        }
        return nextProject;
      });

      projectsByArtist.value[artistSlug] = normalized;
    });

    if (didChange) {
      persist();
    }
  };

  const hydrate = () => {
    if (initialized.value) return;
    initialized.value = true;
    if (!canUseStorage()) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          projectsByArtist.value = parsed;
        }
      }
      migrateProjects();
    } catch (error) {
      console.error("Failed to load artist project cache:", error);
    }
  };

  const ensureArtistSeed = (artistSlug, artistName = "Artist") => {
    hydrate();
    if (!artistSlug) return;

    if (!projectsByArtist.value[artistSlug]) {
      projectsByArtist.value[artistSlug] = getSeedProjects(artistSlug, artistName);
      persist();
      return;
    }

    const normalized = projectsByArtist.value[artistSlug].map((project) =>
      buildProject(artistSlug, project),
    );
    projectsByArtist.value[artistSlug] = normalized;
    persist();
  };

  const getProjectsForArtist = (artistSlug) => {
    hydrate();
    if (!artistSlug) return [];
    if (!projectsByArtist.value[artistSlug]) {
      return [];
    }
    return projectsByArtist.value[artistSlug];
  };

  const getProject = (artistSlug, projectId) => {
    const projects = getProjectsForArtist(artistSlug);
    return projects.find((project) => String(project.id) === String(projectId)) || null;
  };

  const createProject = (artistSlug, project) => {
    if (!artistSlug) return null;

    ensureArtistSeed(artistSlug);

    const base = project || {};
    const id = `proj-${Date.now()}`;
    const dueDays = Math.max(1, Number.parseInt(base.due_days || 21, 10) || 21);

    const newProject = buildProject(artistSlug, {
      id,
      name: (base.name || "Untitled Project").trim(),
      category: base.category || "Release",
      status: base.status || "planning",
      owner: base.owner || "Project Owner",
      priority: base.priority || "medium",
      description: base.description || "New project created from artist workspace.",
      brief: base.brief || "Use this page to align scope, milestones, resources, and stakeholders.",
      launchWindow: base.launchWindow || "TBD",
      budget: base.budget || "$0",
      health: base.health || "on-track",
      deadline: daysFromNow(dueDays),
      progress: 0,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      nextMilestone: "Define scope and owners",
      tasks: { completed: 0, total: 12 },
      milestones: clone(
        base.milestones || [
          {
            id: "m1",
            title: "Define scope and owners",
            due_date: daysFromNow(2),
            done: false,
            owner: "Project Owner",
          },
          {
            id: "m2",
            title: "Align delivery timeline",
            due_date: daysFromNow(7),
            done: false,
            owner: "Operations",
          },
          {
            id: "m3",
            title: "Lock resources",
            due_date: daysFromNow(12),
            done: false,
            owner: "Creative Lead",
          },
        ],
      ),
    });

    newProject.activity.unshift({
      id: makeId("activity"),
      title: "Project created",
      detail: `${newProject.name} was created in the artist workspace.`,
      timestamp: new Date().toISOString(),
    });

    projectsByArtist.value[artistSlug] = [newProject, ...getProjectsForArtist(artistSlug)];

    persist();
    return newProject;
  };

  const addActivity = (artistSlug, projectId, entry) => {
    const project = getProject(artistSlug, projectId);
    if (!project) return null;

    project.activity = [
      {
        id: makeId("activity"),
        title: entry?.title || "Updated project",
        detail: entry?.detail || "",
        timestamp: new Date().toISOString(),
      },
      ...(project.activity || []),
    ].slice(0, 20);

    project.updated_at = new Date().toISOString();
    persist();
    return project;
  };

  const updateProject = (artistSlug, projectId, updates = {}) => {
    const project = getProject(artistSlug, projectId);
    if (!project) return null;

    Object.assign(project, updates);
    recalculateProject(project);
    persist();
    return project;
  };

  const toggleMilestone = (artistSlug, projectId, milestoneId) => {
    const project = getProject(artistSlug, projectId);
    if (!project) return null;

    const milestone = (project.milestones || []).find((item) => item.id === milestoneId);
    if (!milestone) return null;

    milestone.done = !milestone.done;
    syncTaskProgressToMilestones(project);
    recalculateProject(project);
    addActivity(artistSlug, projectId, {
      title: milestone.done ? "Milestone completed" : "Milestone reopened",
      detail: milestone.title,
    });
    return project;
  };

  const addMilestone = (artistSlug, projectId, milestone = {}) => {
    const project = getProject(artistSlug, projectId);
    if (!project) return null;

    project.milestones.unshift({
      id: makeId("milestone"),
      title: (milestone.title || "New milestone").trim(),
      due_date: milestone.due_date || daysFromNow(7),
      done: false,
      owner: milestone.owner || project.owner || "Unassigned",
    });

    project.tasks.total = Math.max(project.tasks.total + 1, project.milestones.length);
    syncTaskProgressToMilestones(project);
    recalculateProject(project);
    addActivity(artistSlug, projectId, {
      title: "Milestone added",
      detail: milestone.title || "New milestone",
    });
    return project;
  };

  const deleteMilestone = (artistSlug, projectId, milestoneId) => {
    const project = getProject(artistSlug, projectId);
    if (!project) return null;

    const milestone = project.milestones.find((item) => item.id === milestoneId);
    if (!milestone) return null;

    project.milestones = project.milestones.filter((item) => item.id !== milestoneId);
    project.tasks.total = Math.max(project.milestones.length, project.tasks.total - 1, 1);
    syncTaskProgressToMilestones(project);
    recalculateProject(project);
    addActivity(artistSlug, projectId, {
      title: "Milestone removed",
      detail: milestone.title,
    });
    return project;
  };

  return {
    projectsByArtist,
    ensureArtistSeed,
    getProjectsForArtist,
    getProject,
    createProject,
    updateProject,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
    addActivity,
  };
});
