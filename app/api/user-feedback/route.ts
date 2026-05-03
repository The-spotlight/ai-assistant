import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';

export const runtime = 'nodejs';

const VALID_FEEDBACK_TYPES = ['bug', 'feature', 'experience', 'other'];

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('cookie');
    if (!authHeader) {
      return null;
    }

    const cookieMatch = authHeader.match(/auth_token=([^;]+)/);
    if (!cookieMatch) {
      return null;
    }

    const token = cookieMatch[1];
    
    const payload = await verifyJwt(token);
    
    const session = await prisma.session.findUnique({
      where: { token },
    });
    
    if (!session || session.expiresAt <= new Date()) {
      return null;
    }

    return payload.userId;
  } catch (error) {
    console.error('Error getting user ID from request:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackType, description, contactInfo } = body;

    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device ID' }, { status: 400 });
    }

    if (!feedbackType || !VALID_FEEDBACK_TYPES.includes(feedbackType)) {
      return NextResponse.json({ error: 'Invalid or missing feedback type' }, { status: 400 });
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const userId = await getUserIdFromRequest(request);

    const feedback = await prisma.userFeedback.create({
      data: {
        userId,
        deviceId,
        feedbackType,
        description: description.trim(),
        contactInfo: contactInfo?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Error creating user feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
