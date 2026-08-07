import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Invitation,
  Workspace,
  WorkspaceMemberWithProfile,
  WorkspaceMembership,
  WorkspaceRole,
} from "@repo/types";
import { slugifyWorkspaceName } from "@repo/types/workspace";
import { createServerClient } from "./server";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
type MemberRow = Database["public"]["Tables"]["workspace_members"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: row.role as Exclude<WorkspaceRole, "owner">,
    status: row.status,
    invitedBy: row.invited_by,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMemberWithProfile(
  row: MemberRow,
  profile: ProfileRow | undefined,
): WorkspaceMemberWithProfile {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role as WorkspaceRole,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    email: profile?.email ?? null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export async function listUserWorkspaces(
  userId: string,
  client?: SupabaseClient<Database>,
): Promise<WorkspaceMembership[]> {
  const supabase = client ?? (await createServerClient());

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("id, role, workspace_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (membershipError) {
    throw new Error(`Failed to load workspaces: ${membershipError.message}`);
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const workspaceIds = memberships.map((row) => row.workspace_id);
  const { data: workspaces, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .in("id", workspaceIds);

  if (workspaceError) {
    throw new Error(`Failed to load workspaces: ${workspaceError.message}`);
  }

  const workspaceMap = new Map(
    (workspaces ?? []).map((row) => [row.id, mapWorkspace(row)]),
  );

  return memberships
    .map((row) => {
      const workspace = workspaceMap.get(row.workspace_id);
      if (!workspace) {
        return null;
      }

      return {
        membershipId: row.id,
        role: row.role as WorkspaceRole,
        workspace,
      } satisfies WorkspaceMembership;
    })
    .filter((item): item is WorkspaceMembership => item !== null);
}

export async function userHasWorkspace(
  userId: string,
  client?: SupabaseClient<Database>,
): Promise<boolean> {
  const supabase = client ?? (await createServerClient());
  const { count, error } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to check workspace membership: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

export async function getWorkspaceById(
  workspaceId: string,
  client?: SupabaseClient<Database>,
): Promise<Workspace | null> {
  const supabase = client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load workspace: ${error.message}`);
  }

  return data ? mapWorkspace(data) : null;
}

export async function createWorkspaceForUser(input: {
  name: string;
  userId: string;
}): Promise<Workspace> {
  const supabase = await createServerClient();
  const baseSlug = slugifyWorkspaceName(input.name);
  const slug = `${baseSlug}-${input.userId.slice(0, 8)}`;

  const { data, error } = await supabase.rpc("create_workspace", {
    workspace_name: input.name,
    workspace_slug: slug,
  });

  if (error) {
    if (error.message.includes("WORKSPACE_LIMIT_REACHED")) {
      throw new Error("You can create only one workspace.");
    }
    throw new Error(error.message);
  }

  return mapWorkspace(data);
}

export async function updateWorkspaceSettings(input: {
  workspaceId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}): Promise<Workspace> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update({
      name: input.name,
      slug: input.slug,
      logo_url: input.logoUrl,
    })
    .eq("id", input.workspaceId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That slug is already taken.");
    }
    throw new Error(error.message);
  }

  return mapWorkspace(data);
}

export async function listWorkspaceMembers(
  workspaceId: string,
  client?: SupabaseClient<Database>,
): Promise<WorkspaceMemberWithProfile[]> {
  const supabase = client ?? (await createServerClient());
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load members: ${error.message}`);
  }

  if (!members || members.length === 0) {
    return [];
  }

  const userIds = members.map((row) => row.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profileError) {
    throw new Error(`Failed to load member profiles: ${profileError.message}`);
  }

  const profileMap = new Map((profiles ?? []).map((row) => [row.id, row]));

  return members.map((row) => mapMemberWithProfile(row, profileMap.get(row.user_id)));
}

export async function createInvitation(input: {
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  invitedBy: string;
}): Promise<Invitation> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      workspace_id: input.workspaceId,
      email: input.email.toLowerCase(),
      role: input.role,
      invited_by: input.invitedBy,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapInvitation(data);
}

export async function listWorkspaceInvitations(
  workspaceId: string,
  client?: SupabaseClient<Database>,
): Promise<Invitation[]> {
  const supabase = client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load invitations: ${error.message}`);
  }

  return (data ?? []).map(mapInvitation);
}

export async function getMembershipRole(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load membership: ${error.message}`);
  }

  return (data?.role as WorkspaceRole | undefined) ?? null;
}

export async function transferWorkspaceOwnership(input: {
  workspaceId: string;
  newOwnerUserId: string;
}): Promise<Workspace> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("transfer_workspace_ownership", {
    target_workspace_id: input.workspaceId,
    new_owner_user_id: input.newOwnerUserId,
  });

  if (error) {
    if (error.message.includes("FORBIDDEN")) {
      throw new Error("Only the owner can transfer ownership.");
    }
    if (error.message.includes("TARGET_NOT_MEMBER")) {
      throw new Error("That user is not a member of this workspace.");
    }
    if (error.message.includes("TARGET_ALREADY_OWNS_WORKSPACE")) {
      throw new Error("That member already owns another workspace.");
    }
    if (error.message.includes("INVALID_TRANSFER_TARGET")) {
      throw new Error("Select a different member.");
    }
    throw new Error(error.message);
  }

  return mapWorkspace(data);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("delete_workspace", {
    target_workspace_id: workspaceId,
  });

  if (error) {
    if (error.message.includes("FORBIDDEN")) {
      throw new Error("Only the owner can delete this workspace.");
    }
    throw new Error(error.message);
  }
}
