//import statements! react frontend & axios for API calls
import { useState, useEffect } from "react";
import axios from "axios";

//API base URL
const API = "https://localhost:3001/api";

//helper function to get auth headers with json web token from localStorage
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

function Navbar({ user, page, onNavigate, onLogout }) {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@1,600;1,700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <nav style={{
      background: "#0a0a0f", padding: "0 32px", height: "60px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid #1e1e2e",
    }}>
      <div onClick={() => user && onNavigate("dashboard")}
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ color: "white", fontFamily: "'Cormorant', serif", fontStyle: "italic", fontWeight: "700", fontSize: "22px" }}>
          SecureSend
        </span>
      </div>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => onNavigate("dashboard")} style={{
            background: page === "dashboard" ? "#1e1e2e" : "none", border: "none", borderRadius: "6px",
            color: page === "dashboard" ? "white" : "#6b7280", padding: "6px 14px", fontSize: "13px",
            fontWeight: page === "dashboard" ? "500" : "400", cursor: "pointer",
          }}>Documents</button>

          {user.role === "admin" && (
            <button onClick={() => onNavigate("admin")} style={{
              background: page === "admin" ? "#1e1e2e" : "none", border: "none", borderRadius: "6px",
              color: page === "admin" ? "white" : "#6b7280", padding: "6px 14px", fontSize: "13px",
              fontWeight: page === "admin" ? "500" : "400", cursor: "pointer",
            }}>Admin</button>
          )}

          <span style={{ color: "#6b7280", fontSize: "12px", padding: "4px 10px", border: "1px solid #1e1e2e", borderRadius: "20px", marginLeft: "8px" }}>
            {user.username}
            <span style={{ marginLeft: "6px", fontSize: "11px", color: user.role === "admin" ? "#f87171" : user.role === "guest" ? "#9ca3af" : "#60a5fa" }}>
              [{user.role}]
            </span>
          </span>

          <button onClick={onLogout} style={{
            background: "none", border: "1px solid #1e1e2e", borderRadius: "6px",
            color: "#6b7280", padding: "6px 12px", fontSize: "12px", cursor: "pointer",
          }}>Sign out</button>
        </div>
      )}
    </nav>
  );
}

function LoginPage({ onLogin, onNavigate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username || !password) { setError("All fields are required."); return; }
    try {
      const res = await axios.post(`${API}/login`, { username, password });
      localStorage.setItem("token", res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)" }}>
      <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ color: "white", fontFamily: "'Cormorant', serif", fontStyle: "italic", fontWeight: "700", fontSize: "28px", marginBottom: "8px" }}>Sign in</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>Access your secure HIPAA-protected documents</p>

        {error && <div style={{ background: "#1f0f0f", border: "1px solid #7f1d1d", borderRadius: "6px", padding: "10px 14px", color: "#f87171", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="your_username"
            style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••••••"
            style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
        </div>

        <button onClick={handleLogin} style={{ width: "100%", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", padding: "11px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
          Sign in
        </button>

        <p style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", marginTop: "20px" }}>
          No account?{" "}<span onClick={() => onNavigate("register")} style={{ color: "#3b82f6", cursor: "pointer" }}>Register</span>
        </p>

        <div style={{ marginTop: "24px", padding: "12px", background: "#0a0a0f", borderRadius: "6px", border: "1px solid #1e1e2e" }}>
          <p style={{ color: "#6b7280", fontSize: "11px", fontFamily: "monospace", marginBottom: "4px" }}>Demo credentials</p>
          <p style={{ color: "#9ca3af", fontSize: "11px", fontFamily: "monospace" }}>admin / Admin@12345!</p>
          <p style={{ color: "#9ca3af", fontSize: "11px", fontFamily: "monospace" }}>lawyer / Lawyer@12345! (acts as a user)</p>
          <p style={{ color: "#9ca3af", fontSize: "11px", fontFamily: "monospace" }}>doctor / Doctor@12345! (acts as a guest)</p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ onNavigate }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const pwStrength = (pw) => {
    let score = 0;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*]/.test(pw)) score++;
    return score;
  };

  const validate = () => {
    const e = {};
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) e.username = "3–20 characters, letters/numbers/underscore only";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.password.length < 12) e.password = "Minimum 12 characters required";
    else if (!/[A-Z]/.test(form.password)) e.password = "Must include at least one uppercase letter";
    else if (!/[a-z]/.test(form.password)) e.password = "Must include at least one lowercase letter";
    else if (!/[0-9]/.test(form.password)) e.password = "Must include at least one number";
    else if (!/[!@#$%^&*]/.test(form.password)) e.password = "Must include at least one special character (!@#$%^&*)";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      await axios.post(`${API}/register`, { username: form.username, email: form.email, password: form.password });
      setSuccess(true);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || "Registration failed" });
    }
  };

  const strength = pwStrength(form.password);
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#34d399"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];

  if (success) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)" }}>
      <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "48px 40px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <div style={{ color: "#34d399", fontSize: "36px", marginBottom: "16px" }}>✓</div>
        <h2 style={{ color: "white", fontSize: "22px", fontWeight: "600", marginBottom: "8px" }}>Account created</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>You can now sign in to SecureSend.</p>
        <button onClick={() => onNavigate("login")} style={{ width: "100%", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", padding: "11px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
          Go to sign in
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)", padding: "24px" }}>
      <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "440px" }}>
        <h2 style={{ color: "white", fontFamily: "'Cormorant', serif", fontStyle: "italic", fontWeight: "700", fontSize: "28px", marginBottom: "8px" }}>Create account</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>All documents are encrypted at rest</p>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Username</label>
          <input type="text" value={form.username} onChange={set("username")} placeholder="your_username"
            style={{ width: "100%", background: "#0a0a0f", border: `1px solid ${errors.username ? "#7f1d1d" : "#1e1e2e"}`, borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
          {errors.username ? <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px" }}>{errors.username}</p>
            : <p style={{ color: "#6b7280", fontSize: "11px", marginTop: "4px" }}>3–20 chars, letters/numbers/underscore</p>}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="you@lawfirm.com"
            style={{ width: "100%", background: "#0a0a0f", border: `1px solid ${errors.email ? "#7f1d1d" : "#1e1e2e"}`, borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
          {errors.email && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px" }}>{errors.email}</p>}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
          <input type="password" value={form.password} onChange={set("password")} placeholder="Min. 12 characters"
            style={{ width: "100%", background: "#0a0a0f", border: `1px solid ${errors.password ? "#7f1d1d" : "#1e1e2e"}`, borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
          {form.password && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength ? strengthColor : "#1e1e2e", transition: "background 0.2s" }} />)}
              </div>
              <p style={{ color: strengthColor, fontSize: "11px" }}>{strengthLabel}{strength < 4 ? " — needs uppercase, number, and !@#$%^&*" : " — all requirements met ✓"}</p>
            </div>
          )}
          {errors.password && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px" }}>{errors.password}</p>}
        </div>

        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Confirm password</label>
          <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••••••"
            style={{ width: "100%", background: "#0a0a0f", border: `1px solid ${errors.confirm ? "#7f1d1d" : "#1e1e2e"}`, borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
          {errors.confirm && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px" }}>{errors.confirm}</p>}
        </div>

        {errors.general && <p style={{ color: "#f87171", fontSize: "11px", marginBottom: "8px" }}>{errors.general}</p>}

        <button onClick={handleSubmit} style={{ width: "100%", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", padding: "11px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
          Create account
        </button>

        <p style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", marginTop: "20px" }}>
          Already have an account?{" "}<span onClick={() => onNavigate("login")} style={{ color: "#3b82f6", cursor: "pointer" }}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

function DashboardPage({ user }) {
  const isGuest = user.role === "guest";
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharingDoc, setSharingDoc] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");

  useEffect(() => {
    axios.get(`${API}/documents`, authHeaders())
      .then(res => setDocuments(res.data))
      .catch(err => console.error("Failed to load documents:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = e => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      await axios.post(`${API}/documents/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const res = await axios.get(`${API}/documents`, authHeaders());
      setDocuments(res.data);
      setSelectedFile(null);
      setShowUpload(false);
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await axios.get(`${API}/documents/${doc.id}/download`, {
        ...authHeaders(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert("Download failed");
    }
  };

  const handleShareClick = doc => { setSharingDoc(doc); setShareEmail(""); setShareRole("viewer"); };

  const handleShareSubmit = async () => {
    if (!shareEmail) return;
    try {
      await axios.post(`${API}/documents/${sharingDoc.id}/share`,
        { shareWith: shareEmail, role: shareRole },
        authHeaders()
      );
      const res = await axios.get(`${API}/documents`, authHeaders());
      setDocuments(res.data);
      setSharingDoc(null);
    } catch (err) {
      alert(err.response?.data?.error || "Share failed");
    }
  };

  return (
    <div style={{ padding: "40px 32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "white", fontFamily: "'Cormorant', serif", fontStyle: "italic", fontWeight: "700", fontSize: "28px", marginBottom: "4px" }}>Documents</h2>
          <p style={{ color: "#6b7280", fontSize: "13px" }}>All files are AES-256 encrypted at rest</p>
        </div>
        {!isGuest && (
          <button onClick={() => setShowUpload(v => !v)} style={{ background: showUpload ? "#1e1e2e" : "#3b82f6", color: "white", border: "1px solid #1e1e2e", borderRadius: "6px", padding: "10px 18px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
            {showUpload ? "Cancel" : "+ Upload document"}
          </button>
        )}
      </div>

      {isGuest && (
        <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#6b7280", fontSize: "13px" }}>
          You are signed in as a guest. You can view shared documents but cannot upload or share.
        </div>
      )}

      {showUpload && !isGuest && (
        <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Upload document</p>
          <div
            onClick={() => document.getElementById("fileInput").click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) setSelectedFile(file); }}
            style={{ border: "2px dashed #1e1e2e", borderRadius: "8px", padding: "32px", textAlign: "center", marginBottom: "16px", cursor: "pointer" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>↑</div>
            <div style={{ color: "white", fontWeight: "500", marginBottom: "4px" }}>{selectedFile ? selectedFile.name : "Drop file here or click to browse"}</div>
            <div style={{ color: "#6b7280", fontSize: "12px" }}>PDF, DOCX — max 50MB</div>
            <input id="fileInput" type="file" accept=".pdf,.docx" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
          <button onClick={handleUpload} disabled={!selectedFile} style={{ background: selectedFile ? "#3b82f6" : "#1e1e2e", color: selectedFile ? "white" : "#6b7280", border: "none", borderRadius: "6px", padding: "10px 18px", fontSize: "13px", fontWeight: "500", cursor: selectedFile ? "pointer" : "not-allowed", width: "100%" }}>
            {selectedFile ? "Upload & encrypt" : "Select a file first"}
          </button>
        </div>
      )}

      <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>Loading documents...</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>No documents yet. Upload your first document above.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                {["Document", "Shared with", "Your role", "Date", ""].map((h, i) => (
                  <th key={i} style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 20px", textAlign: "left", fontWeight: "500" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} style={{ borderBottom: "1px solid #1e1e2e" }}>
                  <td style={{ padding: "14px 20px", color: "white", fontSize: "14px" }}>{doc.name}</td>
                  <td style={{ padding: "14px 20px", color: "#9ca3af", fontSize: "13px" }}>
                    {doc.sharedWith?.length > 0 ? doc.sharedWith.map(s => s.username).join(", ") : "Nobody yet"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      fontSize: "11px", padding: "3px 8px", borderRadius: "20px", fontWeight: "500",
                      background: doc.role === "owner" ? "#0f2a1a" : doc.role === "editor" ? "#1a1a0f" : "#0f1a2a",
                      color: doc.role === "owner" ? "#34d399" : doc.role === "editor" ? "#fbbf24" : "#60a5fa",
                      border: `1px solid ${doc.role === "owner" ? "#34d399" : doc.role === "editor" ? "#fbbf24" : "#60a5fa"}`,
                    }}>{doc.role}</span>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: "13px" }}>{doc.date}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleDownload(doc)} style={{ background: "none", border: "1px solid #1e1e2e", borderRadius: "6px", color: "#9ca3af", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>
                        Download
                      </button>
                      {doc.role === "owner" && !isGuest && (
                        <button onClick={() => handleShareClick(doc)} style={{ background: "none", border: "1px solid #1e1e2e", borderRadius: "6px", color: "#9ca3af", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>
                          Share
                        </button>
                      )}
                      {doc.role === "owner" && (
                        <button
                          onClick={async () => {
                            if (!window.confirm("Delete this document?")) return;
                            await axios.delete(`${API}/documents/${doc.id}`, {                   
                              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                            });
                            const res = await axios.get(`${API}/documents`, authHeaders());
                            setDocuments(res.data);
                          }}
                          style={{ background: "none", border: "1px solid #7f1d1d", borderRadius: "6px", color: "#f87171", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sharingDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "32px", width: "100%", maxWidth: "420px" }}>
            <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>Share document</h3>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "24px" }}>{sharingDoc.name}</p>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Share with (username or email)</label>
              <input type="text" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="dr.johnson@hospital.com"
                style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: "#9ca3af", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Permission level</label>
              <select value={shareRole} onChange={e => setShareRole(e.target.value)}
                style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }}>
                <option value="viewer">Viewer — read only</option>
                <option value="editor">Editor — can edit</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setSharingDoc(null)} style={{ flex: 1, background: "none", border: "1px solid #1e1e2e", borderRadius: "6px", color: "#9ca3af", padding: "10px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleShareSubmit} disabled={!shareEmail} style={{ flex: 1, background: shareEmail ? "#3b82f6" : "#1e1e2e", border: "none", borderRadius: "6px", color: shareEmail ? "white" : "#6b7280", padding: "10px", fontSize: "13px", fontWeight: "500", cursor: shareEmail ? "pointer" : "not-allowed" }}>Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("users");
  const dotColor = { INFO: "#60a5fa", WARNING: "#fbbf24", ERROR: "#f87171", success: "#34d399" };

  useEffect(() => {
    axios.get(`${API}/users`, authHeaders()).then(res => setUsers(res.data));
    axios.get(`${API}/logs`, authHeaders()).then(res => setLogs(res.data));
  }, []);

  const toggleLock = async (id) => {
    await axios.patch(`${API}/users/${id}/lock`, {}, authHeaders());
    const [usersRes, logsRes] = await Promise.all([
      axios.get(`${API}/users`, authHeaders()),
      axios.get(`${API}/logs`, authHeaders()),
    ]);
    setUsers(usersRes.data);
    setLogs(logsRes.data);
  };

  // HIPAA compliance — export full audit log as downloadable file
  const handleExportLogs = async () => {
    try {
      const res = await axios.get(`${API}/logs/export`, {
        ...authHeaders(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "securesend_audit_log.txt";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    }
  };

  return (
    <div style={{ padding: "40px 32px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "white", fontFamily: "'Cormorant', serif", fontStyle: "italic", fontWeight: "700", fontSize: "28px", marginBottom: "4px" }}>Admin panel</h2>
      <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "28px" }}>Manage users and monitor security events</p>

      {/* Tabs + export button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["users", "logs"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#3b82f6" : "#1e1e2e", color: tab === t ? "white" : "#6b7280", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: tab === t ? "500" : "400", cursor: "pointer" }}>
              {t === "users" ? "Users" : "Security log"}
            </button>
          ))}
        </div>
        {/* HIPAA audit log export */}
        <button onClick={handleExportLogs} style={{ background: "none", border: "1px solid #1e1e2e", borderRadius: "6px", color: "#9ca3af", padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}>
          Export audit log
        </button>
      </div>

      {tab === "users" && (
        <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                {["Username", "Email", "Role", "Status", ""].map((h, i) => (
                  <th key={i} style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 20px", textAlign: "left", fontWeight: "500" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #1e1e2e" }}>
                  <td style={{ padding: "14px 20px", color: "white", fontSize: "14px" }}>{u.username}</td>
                  <td style={{ padding: "14px 20px", color: "#9ca3af", fontSize: "13px" }}>{u.email}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      fontSize: "11px", padding: "3px 8px", borderRadius: "20px", fontWeight: "500",
                      background: u.role === "admin" ? "#1a0f0f" : u.role === "user" ? "#0f1a2a" : "#0f0f1a",
                      color: u.role === "admin" ? "#f87171" : u.role === "user" ? "#60a5fa" : "#9ca3af",
                      border: `1px solid ${u.role === "admin" ? "#f87171" : u.role === "user" ? "#60a5fa" : "#6b7280"}`,
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: "14px 20px", color: u.status === "locked" ? "#f87171" : "#34d399", fontSize: "13px" }}>{u.status}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <button onClick={() => toggleLock(u.id)} style={{ background: "none", border: "1px solid #1e1e2e", borderRadius: "6px", color: u.status === "locked" ? "#34d399" : "#f87171", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>
                      {u.status === "locked" ? "Unlock" : "Lock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "logs" && (
        <div style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "8px 20px" }}>
          {logs.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>No log entries yet.</div>
          ) : logs.map((log, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 0", borderBottom: "1px solid #1e1e2e" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor[log.severity] || "#60a5fa", marginTop: "5px", flexShrink: 0 }} />
              <span style={{ color: "#6b7280", fontSize: "12px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <div>
                <span style={{ color: "white", fontSize: "12px", fontFamily: "monospace", fontWeight: "500" }}>{log.event}</span>
                <span style={{ color: "#6b7280", fontSize: "12px" }}> · {log.username} · {log.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  const handleLogin = (u) => { setUser(u); setPage("dashboard"); };
  const handleLogout = async () => {
    try { await axios.post(`${API}/logout`, {}, authHeaders()); } catch {}
    localStorage.removeItem("token");
    setUser(null);
    setPage("login");
  };

  return (
    <div style={{ background: "#0f0f1a", minHeight: "100vh" }}>
      <Navbar user={user} page={page} onNavigate={setPage} onLogout={handleLogout} />
      {page === "login"     && <LoginPage onLogin={handleLogin} onNavigate={setPage} />}
      {page === "register"  && <RegisterPage onNavigate={setPage} />}
      {page === "dashboard" && user && <DashboardPage user={user} />}
      {page === "admin"     && user && user.role === "admin" && <AdminPage />}
    </div>
  );
}