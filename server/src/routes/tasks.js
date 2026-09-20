import express from 'express'
import Task from '../models/Task.js'
const router=express.Router()
let memory=[]
const isDb=()=>globalThis.mongoReady
router.get('/',async(req,res)=>{try{const data=isDb()?await Task.find().sort({createdAt:-1}):memory.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));res.json(data)}catch(e){res.status(500).json({message:e.message})}})
router.post('/',async(req,res)=>{try{if(!req.body.title)return res.status(400).json({message:'Title is required'});const data=isDb()?await Task.create(req.body):{_id:crypto.randomUUID(),...req.body,completed:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(!isDb())memory.unshift(data);res.status(201).json(data)}catch(e){res.status(500).json({message:e.message})}})
router.put('/:id',async(req,res)=>{try{const data=isDb()?await Task.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}):memory.find(x=>x._id===req.params.id);if(!data)return res.status(404).json({message:'Task not found'});if(!isDb()){Object.assign(data,req.body);data.updatedAt=new Date().toISOString()}res.json(data)}catch(e){res.status(500).json({message:e.message})}})
router.delete('/:id',async(req,res)=>{try{if(isDb()){const d=await Task.findByIdAndDelete(req.params.id);if(!d)return res.status(404).json({message:'Task not found'})}else{const before=memory.length;memory=memory.filter(x=>x._id!==req.params.id);if(before===memory.length)return res.status(404).json({message:'Task not found'})}res.json({message:'Task deleted'})}catch(e){res.status(500).json({message:e.message})}})
export default router
