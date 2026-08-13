import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Plus } from "lucide-react";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { getProjectsModuleData } from "../actions/projects";
import { ProjectsShell } from "../../../components/projects/projects-shell";
import { ProjectsAiInsights } from "../../../components/projects/projects-extra";
import { EmptyState } from "../../../components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ProjectsOverviewPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getProjectsModuleData();
  const cards = [
    ["Active projects", data.stats.activeProjects, "/projects/list"],
    ["Completed projects", data.stats.completedProjects, "/projects/list"],
    ["Overdue tasks", data.stats.overdueTasks, "/projects/tasks"],
    ["Today's tasks", data.stats.todayTasks, "/projects/tasks"],
    ["Upcoming deadlines", data.stats.upcomingDeadlines, "/projects/calendar"],
    ["Team productivity", `${data.stats.teamProductivity}%`, "/projects/reports"],
    ["Project progress", `${data.stats.averageProgress}%`, "/projects/list"],
  ] as const;

  return (
    <ProjectsShell
      title="Projects Overview"
      description="Track status, progress, deadlines, and delivery across your workspace."
      actions={
        <Link href="/projects/list">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Create project
          </Button>
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, href]) => (
          <Link key={title} href={href} className="block">
            <Card className="h-full transition hover:border-primary/35">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Live workspace metric</CardDescription>
              </CardHeader>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {data.stats.activeProjects === 0 ? (
        <EmptyState preset="projects" />
      ) : (
        <ProjectsAiInsights stats={data.stats} />
      )}
    </ProjectsShell>
  );
}
