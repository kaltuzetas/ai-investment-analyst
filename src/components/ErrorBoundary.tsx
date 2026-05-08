import React from "react";

interface State { error: string | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(e: Error): State {
    return { error: e.message || "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
        fontFamily: "Georgia, serif", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24,
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>⚠</div>
          <div style={{ color: "#ff7070", fontSize: 13, fontFamily: "monospace", marginBottom: 12 }}>
            Что-то пошло не так
          </div>
          <div style={{
            background: "rgba(255,77,77,0.05)", border: "1px solid rgba(255,77,77,0.15)",
            borderRadius: 8, padding: "10px 16px", marginBottom: 24,
            color: "#666678", fontSize: 11, fontFamily: "monospace",
            textAlign: "left", wordBreak: "break-word",
          }}>
            {this.state.error}
          </div>
          <button
            onClick={this.reset}
            style={{
              background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
              color: "#c9a84c", borderRadius: 8, padding: "10px 28px",
              cursor: "pointer", fontSize: 13, fontFamily: "monospace",
            }}
          >
            Сбросить и попробовать снова
          </button>
        </div>
      </div>
    );
  }
}
