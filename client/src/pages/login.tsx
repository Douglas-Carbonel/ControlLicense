import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      <div className="relative">
        {/* Login Tab */}
        <div className="login-tab px-8 py-3 mb-4 rounded-t-lg">
          <h1 className="text-slate-800 font-semibold text-lg tracking-wide">
            USER LOGIN
          </h1>
        </div>
        
        {/* Login Card */}
        <div className="login-card p-8 w-full max-w-md min-w-[400px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 login-icon">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="login-input w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 login-icon">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="login-input w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>

            {/* Remember Me & Login Button Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="border-neutral-gray data-[state=checked]:bg-sage-green data-[state=checked]:border-sage-green"
                />
                <label
                  htmlFor="remember"
                  className="text-sm login-text select-none cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="login-button px-8 py-2 text-sm font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "LOGIN"
                )}
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}