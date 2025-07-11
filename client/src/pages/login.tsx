import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Loader2, User, Lock } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-gradient px-4">
      <div className="diamond-container">
        <div className="diamond-content">
          <h1 className="diamond-title">DWU IT Solutions</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            {/* Username Field */}
            <div className="diamond-input-wrapper">
              <div className="diamond-input-icon">
                <User size={16} />
              </div>
              <input
                type="text"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="diamond-input"
              />
            </div>

            {/* Password Field */}
            <div className="diamond-input-wrapper">
              <div className="diamond-input-icon">
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="diamond-input"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="diamond-button"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "LOGIN"
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}