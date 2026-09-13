import { redirect } from "next/navigation";
import { getAuthProvider, getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/flags");

  const provider = getAuthProvider();
  const users = await provider.listSelectableUsers();

  return (
    <div className="card" style={{ maxWidth: 440, margin: "48px auto" }}>
      <div className="stack" style={{ marginBottom: 20 }}>
        <h1>Sign in</h1>
        <span className="subtle">
          Mock identities for local development. Auth provider:{" "}
          <span className="badge mono">{provider.name}</span>
        </span>
      </div>
      {users.length > 0 ? (
        <LoginForm users={users} />
      ) : (
        <p className="error">
          The configured auth provider has no selectable users. Set AUTH_PROVIDER=mock for
          local development.
        </p>
      )}
    </div>
  );
}
