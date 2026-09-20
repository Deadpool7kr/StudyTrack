import express from 'express'
import Note from '../models/Note.js'
const router=express.Router();let memory=[]
router.get('/',async(req,res)=>{try{res.json(globalThis.mongoReady?await Note.find().sort({createdAt:-1}):memory)}catch(e){res.status(500).json({message:e.message})}})
router.post('/',async(req,res)=>{try{if(!req.body.title||!req.body.content)return res.status(400).json({message:'Title and content are required'});const d=globalThis.mongoReady?await Note.create(req.body):{_id:crypto.randomUUID(),...req.body,createdAt:new Date().toISOString()};if(!globalThis.mongoReady)memory.unshift(d);res.status(201).json(d)}catch(e){res.status(500).json({message:e.message})}})
router.put('/:id',async(req,res)=>{
  try{
    const d=await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    )
    if(!d)return res.status(404).json({message:'Note not found'})
    res.json(d)
  }catch(e){
    res.status(500).json({message:e.message})
  }
})
router.delete('/:id',async(req,res)=>{try{if(globalThis.mongoReady){const d=await Note.findByIdAndDelete(req.params.id);if(!d)return res.status(404).json({message:'Note not found'})}else{memory=memory.filter(x=>x._id!==req.params.id)}res.json({message:'Note deleted'})}catch(e){res.status(500).json({message:e.message})}})
export default router
