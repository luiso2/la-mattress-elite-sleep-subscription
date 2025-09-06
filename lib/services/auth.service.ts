import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export interface User {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  planName?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  stripeCustomerId?: string;
}

class AuthService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: JWTPayload): string {
    const secret = config.jwt.secret || 'default-secret';
    const expiresIn = config.jwt.expiresIn || '7d';
    const options: any = {
      expiresIn: expiresIn,
    };
    return jwt.sign(payload, secret, options);
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const secret = config.jwt.secret || 'default-secret';
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  generateSessionToken(): string {
    const secret = config.jwt.secret || 'default-secret';
    const options: any = { expiresIn: '24h' };
    return jwt.sign(
      { 
        sessionId: this.generateId(),
        timestamp: Date.now() 
      },
      secret,
      options
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Mock user storage (in production, use a database)
  private users: Map<string, User & { password: string }> = new Map();

  async createUser(email: string, password: string, name?: string): Promise<User> {
    const userId = this.generateId();
    const hashedPassword = await this.hashPassword(password);
    
    const user = {
      id: userId,
      email,
      name,
      password: hashedPassword,
    };

    this.users.set(userId, user);
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserByEmail(email: string): Promise<(User & { password: string }) | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateUserByEmail(email: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    return this.updateUser(user.id, updates);
  }
}

export default new AuthService();