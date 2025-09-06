import { NextRequest } from 'next/server';
import authService from '../services/auth.service';
import { ApiResponse } from '../utils/api-response';

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authService.extractTokenFromHeader(authHeader || '');

  if (!token) {
    return {
      authenticated: false,
      error: ApiResponse.unauthorized('No token provided'),
    };
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return {
      authenticated: false,
      error: ApiResponse.unauthorized('Invalid or expired token'),
    };
  }

  const user = await authService.findUserById(payload.userId);
  if (!user) {
    return {
      authenticated: false,
      error: ApiResponse.unauthorized('User not found'),
    };
  }

  return {
    authenticated: true,
    user,
    payload,
  };
}