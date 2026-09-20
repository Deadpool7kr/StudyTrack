import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import taskRoutes from './routes/tasks.js'
import noteRoutes from './routes/notes.js'

dotenv.config()
const app=express();app.use(cors());app.use(express.json())
app.get('/api/health',(req,res)=>res.json({message:'StudyTrack API is running',database:globalThis.mongoReady?'MongoDB':'In-memory fallback'}))
app.use('/api/tasks',taskRoutes);app.use('/api/notes',noteRoutes)
const port=process.env.PORT||5000
try{await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/studytrack',{serverSelectionTimeoutMS:2500});globalThis.mongoReady=true;console.log('MongoDB connected')}catch(e){globalThis.mongoReady=false;console.log('MongoDB unavailable; using in-memory fallback')}
app.listen(port,()=>console.log(`StudyTrack API running on http://localhost:${port}`))
