import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatarUrl: string;

  @Prop({ select: false }) // Hide by default in queries to secure hash
  password?: string;

  @Prop({ required: true, enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Prop({ unique: true, sparse: true })
  telegramChatId?: string;

  @Prop({ required: true, unique: true, index: true })
  telegramVerificationCode: string;

  @Prop({ default: 'New York' })
  location: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
