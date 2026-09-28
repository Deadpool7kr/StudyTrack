import React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";

import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  LogOut,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Notes from "./pages/Notes";
import About from "./pages/About";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function useApi(resource, enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/${resource}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required");
        }

        throw new Error("API request failed");
      }

      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [resource, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export const AppContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Do not call protected APIs until the session check has completed
  // and a logged-in user is known. This prevents expected 401 requests
  // during the initial unauthenticated render.
  const apiEnabled = !authLoading && !!user;

  const tasksApi = useApi("tasks", apiEnabled);
  const notesApi = useApi("notes", apiEnabled);

  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sidebar, setSidebar] = useState(false);
  const [toast, setToast] = useState("");

  const searchRef = useRef(null);

  // Load tasks
  useEffect(() => {
    setTasks(tasksApi.data);
  }, [tasksApi.data]);

  // Load notes
  useEffect(() => {
    setNotes(notesApi.data);
  }, [notesApi.data]);

  // Check login session
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Not authenticated");
        }

        return r.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Google login completed
  const handleLogin = useCallback((loggedInUser) => {
    setUser(loggedInUser);
  }, []);

  // Logout
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  };

  // Toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => {
        setToast("");
      }, 2600);

      return () => clearTimeout(t);
    }
  }, [toast]);

  // Add task
  const addTask = async (payload) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const item = await res.json();

    if (!res.ok) {
      throw new Error(
        item.message || "Unable to add task"
      );
    }

    setTasks((prev) => [item, ...prev]);
    setToast("Task added successfully");
  };

  // Update task
  const updateTask = async (id, payload) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const item = await res.json();

    if (!res.ok) {
      throw new Error(
        item.message || "Unable to update task"
      );
    }

    setTasks((prev) =>
      prev.map((t) =>
        t._id === id ? item : t
      )
    );

    setToast("Task updated");
  };

  // Delete task
  const deleteTask = async (id) => {
    const res = await fetch(
      `${API_BASE}/tasks/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error("Unable to delete task");
    }

    setTasks((prev) =>
      prev.filter((t) => t._id !== id)
    );

    setToast("Task deleted");
  };

  // Add note
  const addNote = async (payload) => {
    const res = await fetch(`${API_BASE}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const item = await res.json();

    if (!res.ok) {
      throw new Error(
        item.message || "Unable to add note"
      );
    }

    setNotes((prev) => [item, ...prev]);
    setToast("Note added successfully");
  };

  // Update note
  const updateNote = async (id, payload) => {
    const res = await fetch(
      `${API_BASE}/notes/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const item = await res.json();

    if (!res.ok) {
      throw new Error(
        item.message || "Unable to update note"
      );
    }

    setNotes((prev) =>
      prev.map((n) =>
        n._id === id ? item : n
      )
    );

    setToast("Note updated");
  };

  // Delete note
  const deleteNote = async (id) => {
    const res = await fetch(
      `${API_BASE}/notes/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error("Unable to delete note");
    }

    setNotes((prev) =>
      prev.filter((n) => n._id !== id)
    );

    setToast("Note deleted");
  };

  // Statistics
  const stats = useMemo(() => {
    const completed = tasks.filter(
      (t) => t.completed
    ).length;

    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
      progress: tasks.length
        ? Math.round(
            (completed / tasks.length) * 100
          )
        : 0,
    };
  }, [tasks]);

  /*
    IMPORTANT:
    ALL React hooks are above these returns.

    This prevents:
    "Rendered more hooks than during the previous render"
  */

  if (authLoading) {
    return (
      <div className="auth-loading">
        Loading StudyTrack…
      </div>
    );
  }

  if (!user) {
    return (
      <Login onLogin={handleLogin} />
    );
  }

  if (!user.profileCompleted) {
    return (
      <ProfileSetup
        user={user}
        onComplete={setUser}
        onLogout={logout}
      />
    );
  }

  return (
    <AppContext.Provider
      value={{
        tasks,
        notes,
        stats,
        addTask,
        updateTask,
        deleteTask,
        addNote,
        updateNote,
        deleteNote,
        reloadTasks: tasksApi.reload,
        reloadNotes: notesApi.reload,
        searchRef,
      }}
    >
      <div className="app-shell">

        <aside
          className={`sidebar ${
            sidebar ? "open" : ""
          }`}
        >
          <div className="brand">

            <div className="brand-mark">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <strong>StudyTrack</strong>
              <span>Student workspace</span>
            </div>

          </div>

          <nav>

            <NavItem
              to="/"
              icon={
                <LayoutDashboard size={18} />
              }
              label="Dashboard"
              onClick={() =>
                setSidebar(false)
              }
            />

            <NavItem
              to="/tasks"
              icon={
                <ClipboardList size={18} />
              }
              label="Tasks"
              onClick={() =>
                setSidebar(false)
              }
            />

            <NavItem
              to="/notes"
              icon={
                <BookOpen size={18} />
              }
              label="Study Notes"
              onClick={() =>
                setSidebar(false)
              }
            />

            <NavItem
              to="/about"
              icon={
                <CheckCircle2 size={18} />
              }
              label="About"
              onClick={() =>
                setSidebar(false)
              }
            />

          </nav>

          <div className="sidebar-foot">
            <span>
              Full Stack Development-I
            </span>
            <small>
              3040233448
            </small>
          </div>

        </aside>

        {sidebar && (
          <button
            className="mobile-overlay"
            onClick={() =>
              setSidebar(false)
            }
            aria-label="Close menu"
          />
        )}

        <main className="main">

          <header className="topbar">

            <button
              className="icon-btn mobile-menu"
              onClick={() =>
                setSidebar(true)
              }
            >
              <Menu size={20} />
            </button>

            <div className="top-search">

              <Search size={17} />

              <input
                ref={searchRef}
                placeholder="Search your workspace…"
              />


            </div>

            <Link
              className="quick-add"
              to="/tasks"
            >
              <Plus size={17} />
              Add Task
            </Link>

            <div className="user-menu">

              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt=""
                />
              ) : (
                <div className="user-avatar">
                  {user.name?.charAt(0)}
                </div>
              )}

              <div className="user-info">
                <strong>
                  {user.name}
                </strong>

                <small>
                  {user.email}
                </small>
              </div>

              <button
                className="icon-btn"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>

            </div>

          </header>

          <div className="content">

            <Routes>

              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/tasks"
                element={<Tasks />}
              />

              <Route
                path="/notes"
                element={<Notes />}
              />

              <Route
                path="/about"
                element={<About />}
              />

            </Routes>

          </div>

        </main>

        {toast && (
          <div className="toast">
            {toast}
          </div>
        )}

      </div>
    </AppContext.Provider>
  );
}

function NavItem({
  to,
  icon,
  label,
  onClick,
}) {
  return (
    <NavLink
      end={to === "/"}
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        isActive
          ? "nav-item active"
          : "nav-item"
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default App;