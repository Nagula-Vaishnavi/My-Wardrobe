import { useState } from "react";
import { Eye, EyeOff, Shirt, ArrowRight } from "lucide-react";
import { apiRequest } from "../utils/api";

function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const responseBody = await apiRequest("/auth/login", {
        method: "POST",
        auth: false,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const responseText = typeof responseBody === "string"
        ? responseBody
        : JSON.stringify(responseBody ?? "");

      if (!responseText.trim()) {
        throw new Error("The server did not return a login token.");
      }

      // Handle either a plain JWT or a JSON-quoted JWT string.
      let token = responseText.trim();

      if (token.startsWith('"') && token.endsWith('"')) {
        try {
          token = JSON.parse(token);
        } catch {
          throw new Error("The server returned an invalid login token.");
        }
      }

      if (!token || token.split(".").length !== 3) {
        throw new Error(
          "The login response is not a valid JWT. Check the backend login response."
        );
      }

      // Pass the token and email to App.jsx.
      // App.jsx stores the token and loads the wardrobe.
      await onLogin({
        email: email.trim(),
        token,
      });
    } catch (error) {
      console.error("Login error:", error);

      if (error.message === "Failed to fetch") {
        setError(
          "Cannot connect to the backend. Make sure Spring Boot is running."
        );
      } else {
        setError(
          error.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <div className="auth-logo">
          <span className="auth-logo-mark">
            <Shirt size={20} />
          </span>
          <span>mywardrobe</span>
        </div>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">
            YOUR PERSONAL WARDROBE
          </span>

          <h1>
            Less wondering.
            <br />
            More wearing.
          </h1>

          <p>
            Rediscover what you own.
            Find combinations you love.
            Get dressed with confidence.
          </p>
        </div>

        <span className="auth-brand-footer">
          A little more intention, every day.
        </span>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-container">
          <span className="auth-welcome">
            WELCOME BACK
          </span>

          <h2>Good to see you again.</h2>

          <p className="auth-subtitle">
            Sign in to pick up where you left off.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="auth-label">
              Email address

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </label>

            <label className="auth-label">
              Password

              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => onNavigate("register")}
              disabled={loading}
            >
              Create one
            </button>
          </p>

          <p className="auth-legal">
            Your wardrobe, your style, your space.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
