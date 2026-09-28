import mongoose from 'mongoose'
const taskSchema = new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  title:{type:String,required:true,trim:true,maxlength:160},
  description:{type:String,default:'',maxlength:2000},
  subject:{type:String,default:'General',maxlength:80},
  priority:{type:String,enum:['High','Medium','Low'],default:'Medium'},
  dueDate:{type:Date,default:null},
  completed:{type:Boolean,default:false}
},{timestamps:true})
export default mongoose.model('Task',taskSchema)
