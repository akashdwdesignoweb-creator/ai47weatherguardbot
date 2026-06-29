import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../db/models/user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(
    email: string,
    name: string,
    avatarUrl?: string,
    role: 'user' | 'admin' = 'user',
    password?: string,
  ): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('User email is already registered');
    }

    // Generate a unique 6-character code for telegram linking
    let telegramVerificationCode = '';
    let isUnique = false;
    while (!isUnique) {
      telegramVerificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codeExists = await this.userModel.findOne({ telegramVerificationCode }).exec();
      if (!codeExists) {
        isUnique = true;
      }
    }

    // The first user registered in the system becomes an admin automatically for easier testing
    let assignedRole: 'user' | 'admin' = role;
    let assignedStatus = 'pending';
    const userCount = await this.userModel.countDocuments().exec();
    if (userCount === 0) {
      assignedRole = 'admin';
      assignedStatus = 'approved'; // Admins are auto-approved
    }

    // Hash the password if provided
    let hashedPassword: string | undefined = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = new this.userModel({
      email: email.toLowerCase(),
      name,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      role: assignedRole,
      status: assignedStatus,
      telegramVerificationCode,
      password: hashedPassword,
    });

    try {
      return await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  // Used by OAuth to find or create a user profile
  async findOrCreateSocialUser(email: string, name: string, avatarUrl?: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    if (user) {
      return user;
    }
    
    // First user is Admin, others are standard users
    return this.create(email, name, avatarUrl);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  // Explicitly selects password field for verification
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByTelegramCode(code: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ telegramVerificationCode: code.toUpperCase() }).exec();
  }

  async findByTelegramChatId(chatId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ telegramChatId: chatId }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = status;
    return user.save();
  }

  async updateLocation(id: string, location: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.location = location;
    return user.save();
  }

  async linkTelegram(code: string, telegramChatId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ telegramVerificationCode: code.toUpperCase() }).exec();
    if (!user) {
      throw new NotFoundException('Invalid verification code');
    }

    user.telegramChatId = telegramChatId;
    return user.save();
  }

  async unlinkTelegram(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.telegramChatId = undefined;

    // Regenerate verification code
    let telegramVerificationCode = '';
    let isUnique = false;
    while (!isUnique) {
      telegramVerificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codeExists = await this.userModel.findOne({ telegramVerificationCode }).exec();
      if (!codeExists) {
        isUnique = true;
      }
    }

    user.telegramVerificationCode = telegramVerificationCode;
    return user.save();
  }

  async findApprovedUsersWithTelegram(): Promise<UserDocument[]> {
    return this.userModel.find({
      status: 'approved',
      telegramChatId: { $exists: true, $ne: null },
    }).exec();
  }
}
