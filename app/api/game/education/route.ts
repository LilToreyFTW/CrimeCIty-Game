import { NextResponse, NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  userId: number;
  email: string;
  username: string;
  [key: string]: any;
};
import { dbGet, dbAll, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats, enrollInCourse, completeCourse, getPlayerEducation } from '@/lib/gameDatabase';

async function authenticateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    const user = await dbGet('SELECT id, email, username FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    return { user, userId: user.id };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

// Get available courses
export async function GET(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const courses = await dbAll('SELECT * FROM education_courses ORDER BY course_name');
    const playerEducation = await getPlayerEducation(auth.userId);
    
    // Add enrollment status to courses
    const coursesWithStatus = courses.map(course => {
      const enrollment = playerEducation.find(e => e.course_id === course.id);
      return {
        ...course,
        enrolled: !!enrollment,
        completed: enrollment?.completed || false,
        progress: enrollment?.progress || 0
      };
    });

    return NextResponse.json({ courses: coursesWithStatus });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve courses' },
      { status: 500 }
    );
  }
}

// Enroll in a course
export async function POST(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { courseId } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    const course = await dbGet('SELECT * FROM education_courses WHERE id = ?', [courseId]);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existing = await dbGet(
      'SELECT * FROM player_education WHERE user_id = ? AND course_id = ?',
      [auth.userId, courseId]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Check if player has enough money
    if (playerData.player.money < course.cost) {
      return NextResponse.json(
        { error: `Not enough money. Course costs $${course.cost}` },
        { status: 400 }
      );
    }

    // Enroll
    await enrollInCourse(auth.userId, courseId, course.course_name);

    // Deduct cost
    const updates = {
      player: {
        ...playerData.player,
        money: playerData.player.money - course.cost
      }
    };
    await updatePlayerStats(auth.userId, updates);

    return NextResponse.json({
      message: `Successfully enrolled in ${course.course_name}!`,
      course: {
        id: course.id,
        name: course.course_name,
        duration: course.duration,
        cost: course.cost
      }
    });
  } catch (error) {
    console.error('Enroll error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// Complete a course
export async function PUT(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { courseId } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    const enrollment = await dbGet(
      'SELECT * FROM player_education WHERE user_id = ? AND course_id = ?',
      [auth.userId, courseId]
    );

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 400 }
      );
    }

    if (enrollment.completed) {
      return NextResponse.json(
        { error: 'Course already completed' },
        { status: 400 }
      );
    }

    const course = await dbGet('SELECT * FROM education_courses WHERE id = ?', [courseId]);
    
    // Complete course
    await completeCourse(auth.userId, courseId);

    // Apply stat bonus
    const statBonus = course.stat_bonus;
    const bonusAmount = 5; // Default bonus
    
    const combatStats = { ...playerData.combatStats };
    const workingStats = { ...playerData.workingStats };
    
    if (statBonus === 'strength' || statBonus === 'defense' || statBonus === 'speed' || 
        statBonus === 'dexterity' || statBonus === 'endurance' || statBonus === 'intelligence') {
      combatStats[statBonus] = (combatStats[statBonus] || 100) + bonusAmount;
    } else if (statBonus === 'manual_labor' || statBonus === 'intelligence' || statBonus === 'endurance') {
      workingStats[statBonus] = (workingStats[statBonus] || 100) + bonusAmount;
    }

    await updatePlayerStats(auth.userId, {
      combatStats,
      workingStats
    });

    return NextResponse.json({
      message: `Successfully completed ${course.course_name}!`,
      result: {
        course: course.course_name,
        statBonus: `${statBonus} +${bonusAmount}`
      }
    });
  } catch (error) {
    console.error('Complete course error:', error);
    return NextResponse.json(
      { error: 'Failed to complete course' },
      { status: 500 }
    );
  }
}


