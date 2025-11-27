import mongoose, { Document, Model } from 'mongoose';

export interface UserDocument extends Document {
  email: string;
  username: string;
  passwordHash: string;
  tokenVersion: number;
  createdAt: Date;
  toSafeUser(): SafeUser;
}

export interface UserModel extends Model<UserDocument> {
  toSafeUser(user: UserDocument): SafeUser;
}

export interface SafeUser {
  _id: string;
  email: string;
  username: string;
}

const userSchema = new mongoose.Schema<UserDocument, UserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

userSchema.methods.toSafeUser = function toSafeUser() {
  return {
    _id: this._id.toString(),
    email: this.email,
    username: this.username,
  } as SafeUser;
};

userSchema.statics.toSafeUser = function toSafeUserStatic(user: UserDocument) {
  return user.toSafeUser();
};

export const User = mongoose.models.User || mongoose.model<UserDocument, UserModel>('User', userSchema);
