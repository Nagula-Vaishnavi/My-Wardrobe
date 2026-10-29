import { useState } from "react";
import {
  Eye,
  EyeOff,
  Shirt,
  ArrowRight,
} from "lucide-react";

function Register({ onRegister, onNavigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!onRegister) {
      setError("Account registration is unavailable right now.");
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSuccess("Your account was created. Sign in to start building your wardrobe.");
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError.message || "Could not create your account. Please try again.");
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
            A WARDROBE THAT GETS YOU
          </span>

          <h1>
            Your clothes.
            <br />
            Your possibilities.
          </h1>

          <p>
            Bring the pieces you already own together
            and discover new ways to wear them.
          </p>
        </div>

        <span className="auth-brand-footer">
          A little more intention, every day.
        </span>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-container">
          <span className="auth-welcome">
            GET STARTED
          </span>

          <h2>Create your account.</h2>

          <p className="auth-subtitle">
            Let's make getting dressed a little easier.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="auth-label">
              Full name

              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                disabled={loading || Boolean(success)}
              />
            </label>

            <label className="auth-label">
              Email address

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading || Boolean(success)}
              />
            </label>

            <label className="auth-label">
              Password

              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading || Boolean(success)}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading || Boolean(success)}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label className="auth-label">
              Confirm password

              <div className="auth-password-wrap">
                <input
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  required
                  disabled={loading || Boolean(success)}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  disabled={loading || Boolean(success)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            {success && (
              <p className="auth-success" role="status">{success}</p>
            )}

            {success ? (
              <button
                type="button"
                className="auth-submit"
                onClick={() => onNavigate("login")}
              >
                Go to sign in
                <ArrowRight size={17} />
              </button>
            ) : (
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
                {!loading && <ArrowRight size={17} />}
              </button>
            )}
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onNavigate("login")}
              disabled={loading}
            >
              Sign in
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

export default Register;
