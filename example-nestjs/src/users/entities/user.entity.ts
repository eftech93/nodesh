import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Object, required: true })
  name: {
    first: string;
    last: string;
  };

  @Prop({ enum: ['user', 'admin', 'moderator'], default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin: Date;

  @Prop({ type: Object, default: { loginCount: 0, preferences: { theme: 'light', notifications: true } } })
  metadata: {
    loginCount: number;
    preferences: {
      theme: string;
      notifications: boolean;
    };
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.name.first} ${this.name.last}`;
});

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.recordLogin = async function() {
  this.lastLogin = new Date();
  this.metadata.loginCount += 1;
  return this.save();
};

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};
