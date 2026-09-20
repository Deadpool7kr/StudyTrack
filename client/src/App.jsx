import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpen, CheckCircle2, ClipboardList, LayoutDashboard, Menu, Plus, Search, X } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import About from './pages/About'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function useApi(resource) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/${resource}`)
      if (!res.ok) throw new Error('API request failed')
      setData(await res.json())
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [resource])
  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load }
}

export const AppContext = React.createContext(null)

function App() {
  const tasksApi = useApi('tasks')
  const notesApi = useApi('notes')
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [sidebar, setSidebar] = useState(false)
  const [toast, setToast] = useState('')
  const searchRef = useRef(null)

  useEffect(() => { setTasks(tasksApi.data) }, [tasksApi.data])
  useEffect(() => { setNotes(notesApi.data) }, [notesApi.data])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 2600)
      return () => clearTimeout(t)
    }
  }, [toast])

  const addTask = async (payload) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    })
    const item = await res.json()
    if (!res.ok) throw new Error(item.message || 'Unable to add task')
    setTasks(prev => [item, ...prev])
    setToast('Task added successfully')
  }

  const updateTask = async (id, payload) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    })
    const item = await res.json()
    if (!res.ok) throw new Error(item.message || 'Unable to update task')
    setTasks(prev => prev.map(t => t._id === id ? item : t))
    setToast('Task updated')
  }

  const deleteTask = async (id) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method:'DELETE'
    })
    if (!res.ok) throw new Error('Unable to delete task')
    setTasks(prev => prev.filter(t => t._id !== id))
    setToast('Task deleted')
  }

  const addNote = async (payload) => {
    const res = await fetch(`${API_BASE}/notes`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    })
    const item = await res.json()
    if (!res.ok) throw new Error(item.message || 'Unable to add note')
    setNotes(prev => [item, ...prev])
    setToast('Note added successfully')
  }

  const updateNote = async (id, payload) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    })
    const item = await res.json()
    if (!res.ok) throw new Error(item.message || 'Unable to update note')
    setNotes(prev => prev.map(n => n._id === id ? item : n))
    setToast('Note updated')
  }

  const deleteNote = async (id) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method:'DELETE'
    })
    if (!res.ok) throw new Error('Unable to delete note')
    setNotes(prev => prev.filter(n => n._id !== id))
    setToast('Note deleted')
  }

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length
    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
      progress: tasks.length
        ? Math.round(completed / tasks.length * 100)
        : 0
    }
  }, [tasks])

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
        reloadTasks:tasksApi.reload,
        reloadNotes:notesApi.reload,
        searchRef
      }}
    >
      <div className="app-shell">

        <aside className={`sidebar ${sidebar ? 'open' : ''}`}>
          <div className="brand">
            <div className="brand-mark">
              <CheckCircle2 size={22}/>
            </div>
            <div>
              <strong>StudyTrack</strong>
              <span>Student workspace</span>
            </div>
          </div>

          <nav>
            <NavItem
              to="/"
              icon={<LayoutDashboard size={18}/>}
              label="Dashboard"
              onClick={()=>setSidebar(false)}
            />

            <NavItem
              to="/tasks"
              icon={<ClipboardList size={18}/>}
              label="Tasks"
              onClick={()=>setSidebar(false)}
            />

            <NavItem
              to="/notes"
              icon={<BookOpen size={18}/>}
              label="Study Notes"
              onClick={()=>setSidebar(false)}
            />

            <NavItem
              to="/about"
              icon={<CheckCircle2 size={18}/>}
              label="About"
              onClick={()=>setSidebar(false)}
            />
          </nav>

          <div className="sidebar-foot">
            <span>Full Stack Development-I</span>
            <small>3040233448</small>
          </div>
        </aside>

        {sidebar && (
          <button
            className="mobile-overlay"
            onClick={()=>setSidebar(false)}
            aria-label="Close menu"
          />
        )}

        <main className="main">

          <header className="topbar">

            <button
              className="icon-btn mobile-menu"
              onClick={()=>setSidebar(true)}
            >
              <Menu size={20}/>
            </button>

            <div className="top-search">
              <Search size={17}/>
              <input
                ref={searchRef}
                placeholder="Search your workspace…"
              />
              <kbd>Ctrl K</kbd>
            </div>

            <Link className="quick-add" to="/tasks">
              <Plus size={17}/>
              Add Task
            </Link>

          </header>

          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard/>}/>
              <Route path="/tasks" element={<Tasks/>}/>
              <Route path="/notes" element={<Notes/>}/>
              <Route path="/about" element={<About/>}/>
            </Routes>
          </div>

        </main>

        {toast && <div className="toast">{toast}</div>}

      </div>
    </AppContext.Provider>
  )
}

function NavItem({to, icon, label, onClick}) {
  return (
    <NavLink
      end={to==='/'}
      to={to}
      onClick={onClick}
      className={({isActive}) =>
        isActive ? 'nav-item active' : 'nav-item'
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export default App