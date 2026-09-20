import mongoose from 'mongoose'
const taskSchema = new mongoose.Schema({title:{type:String,required:true,trim:true},description:{type:String,default:''},subject:{type:String,default:'General'},priority:{type:String,enum:['High','Medium','Low'],default:'Medium'},dueDate:{type:Date,default:null},completed:{type:Boolean,default:false}},{timestamps:true})
export default mongoose.model('Task',taskSchema)
