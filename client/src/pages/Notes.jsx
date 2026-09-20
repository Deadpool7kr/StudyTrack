import { useContext, useState } from 'react'
import { BookOpen, Plus, Trash2, Pencil } from 'lucide-react'
import { AppContext } from '../App'

export default function Notes(){
  const {notes,addNote,updateNote,deleteNote}=useContext(AppContext)
  const [form,setForm]=useState({title:'',subject:'',content:''})
  const [editing,setEditing]=useState(null)

  const submit=async e=>{
    e.preventDefault()
    if(!form.title||!form.content)return

    if(editing){
      await updateNote(editing,form)
      setEditing(null)
    }else{
      await addNote(form)
    }

    setForm({title:'',subject:'',content:''})
  }

  const editNote=n=>{
    setEditing(n._id)
    setForm({title:n.title,subject:n.subject||'',content:n.content})
  }

  return <>
    <div className="page-title">
      <div>
        <span className="eyebrow">STUDY MATERIAL</span>
        <h1>Study notes</h1>
        <p>Keep quick revision material beside your tasks.</p>
      </div>
    </div>

    <div className="notes-layout">
      <form className="panel note-form" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">{editing?'EDIT':'CREATE'}</span>
            <h2>{editing?'Edit note':'New note'}</h2>
          </div>
          <BookOpen size={20}/>
        </div>

        <label>Title
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
        </label>

        <label>Subject
          <input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>
        </label>

        <label>Content
          <textarea rows="8" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} required/>
        </label>

        <button className="primary-btn">
          {editing?<Pencil size={17}/>:<Plus size={17}/>}
          {editing?'Update note':'Save note'}
        </button>
      </form>

      <div className="notes-grid">
        {notes.length?notes.map(n=>
          <article className="note-card" key={n._id}>
            <div className="note-top">
              <span>{n.subject||'General'}</span>
              <div>
                <button onClick={()=>editNote(n)}><Pencil size={16}/></button>
                <button onClick={()=>deleteNote(n._id)}><Trash2 size={16}/></button>
              </div>
            </div>
            <h3>{n.title}</h3>
            <p>{n.content}</p>
            <small>{new Date(n.createdAt||Date.now()).toLocaleDateString()}</small>
          </article>
        ):<div className="empty">
          <BookOpen size={28}/>
          <strong>No notes yet</strong>
          <span>Create your first study note.</span>
        </div>}
      </div>
    </div>
  </>
}