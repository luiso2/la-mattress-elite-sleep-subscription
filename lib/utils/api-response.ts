import { NextResponse } from 'next/server';

export class ApiResponse {
  static success(data: any, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      { status }
    );
  }

  static error(message: string, status = 400, error?: any) {
    return NextResponse.json(
      {
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status }
    );
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403);
  }

  static notFound(message = 'Not found') {
    return this.error(message, 404);
  }

  static badRequest(message = 'Bad request') {
    return this.error(message, 400);
  }

  static serverError(message = 'Internal server error', error?: any) {
    return this.error(message, 500, error);
  }
}