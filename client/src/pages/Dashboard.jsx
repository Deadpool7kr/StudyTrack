import { useContext, useMemo } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, ListTodo } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppContext } from '../App'

export default function Dashboard(){
 const {tasks, stats}=useContext(AppContext)
 const upcoming=useMemo(()=>[...tasks].filter(t=>!t.completed).sort((a,b)=>new Date(a.dueDate||'9999')-new Date(b.dueDate||'9999')).slice(0,5),[tasks])
 return <>
  <section className="hero"><div><span className="eyebrow">STUDENT PRODUCTIVITY</span><h1>Plan your study.<br/><em>Finish with confidence.</em></h1><p>Keep assignments, study notes and deadlines in one focused workspace.</p></div><div className="hero-card"><div className="ring"><span>{stats.progress}%</span></div><div><strong>Overall progress</strong><small>{stats.completed} of {stats.total} tasks completed</small></div></div></section>
  <section className="stats-grid">
   <Stat icon={<ListTodo/>} label="Total tasks" value={stats.total}/><Stat icon={<CheckCircle2/>} label="Completed" value={stats.completed}/><Stat icon={<Clock3/>} label="Pending" value={stats.pending}/><Stat icon={<CalendarDays/>} label="Progress" value={`${stats.progress}%`}/>
  </section>
  <section className="section-head"><div><span className="eyebrow">UP NEXT</span><h2>Upcoming tasks</h2></div><Link to="/tasks" className="text-link">View all <ArrowRight size={16}/></Link></section>
  <div className="task-list">{upcoming.length ? upcoming.map(t=><TaskPreview key={t._id} task={t}/>) : <Empty/>}</div>
 </>
}
function Stat({icon,label,value}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><small>{label}</small><strong>{value}</strong></div></div>}
function TaskPreview({task}){return <div className="preview-row"><div className="task-dot"/><div className="preview-main"><strong>{task.title}</strong><span>{task.subject||'General'} · {task.priority} priority</span></div><time>{task.dueDate?new Date(task.dueDate).toLocaleDateString(undefined,{day:'2-digit',month:'short'}):'No date'}</time></div>}
function Empty(){return <div className="empty"><CheckCircle2 size={28}/><strong>No pending tasks</strong><span>Add a task from the Tasks page.</span></div>}
