import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  name: string,
  email: string,
  password: string,
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

export default mongoose.model<User>("User", UserSchema);