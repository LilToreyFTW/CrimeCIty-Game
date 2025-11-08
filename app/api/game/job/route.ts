import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun, ensureDatabase } from '@/lib/database';
import { getPlayerData, updatePlayerStats, startJob, getCurrentJob } from '@/lib/gameDatabase';

async function authenticateToken(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet('SELECT id, email, username FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    return { user, userId: user.id };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

// Apply for a job
export async function POST(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const { jobName } = await request.json();
    const playerData = await getPlayerData(auth.userId);
    
    // Job types and requirements
    const jobs = {
      'Fast Food Worker': { 
        requirements: { manual_labor: 50 }, 
        pay: 15, 
        energy: 20,
        description: 'Work at a fast food restaurant'
      },
      'Security Guard': { 
        requirements: { strength: 60, defense: 50 }, 
        pay: 25, 
        energy: 30,
        description: 'Protect buildings and people'
      },
      'Delivery Driver': { 
        requirements: { speed: 60, dexterity: 50 }, 
        pay: 20, 
        energy: 25,
        description: 'Deliver packages around the city'
      },
      'Construction Worker': { 
        requirements: { manual_labor: 80, strength: 70 }, 
        pay: 35, 
        energy: 40,
        description: 'Build and repair structures'
      },
      'Software Developer': { 
        requirements: { intelligence: 80, endurance: 60 }, 
        pay: 50, 
        energy: 30,
        description: 'Develop software and applications'
      }
    };

    const job = jobs[jobName];
    if (!job) {
      return NextResponse.json(
        { error: 'Invalid job' },
        { status: 400 }
      );
    }

    // Check requirements
    const combatStats = playerData.combatStats || {};
    const workingStats = playerData.workingStats || {};
    
    for (const [stat, requirement] of Object.entries(job.requirements)) {
      const playerStat = combatStats[stat] || workingStats[stat] || 0;
      if (playerStat < requirement) {
        return NextResponse.json(
          { 
            error: `Insufficient ${stat.replace('_', ' ')}. Required: ${requirement}, Current: ${playerStat}` 
          },
          { status: 400 }
        );
      }
    }

    // Start job
    await startJob(auth.userId, jobName, jobName, job.pay);

    return NextResponse.json({
      message: `Successfully applied for ${jobName}!`,
      job: {
        name: jobName,
        pay: job.pay,
        energy: job.energy,
        description: job.description
      }
    });
  } catch (error) {
    console.error('Job apply error:', error);
    return NextResponse.json(
      { error: 'Failed to apply for job' },
      { status: 500 }
    );
  }
}

// Work at current job
export async function PUT(request) {
  const auth = await authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureDatabase();
    
    const playerData = await getPlayerData(auth.userId);
    const currentJob = await getCurrentJob(auth.userId);
    
    if (!currentJob) {
      return NextResponse.json(
        { error: 'You do not have a job. Apply for one first.' },
        { status: 400 }
      );
    }

    // Check cooldown
    if (playerData.cooldowns.job > Date.now()) {
      return NextResponse.json(
        { error: `Job cooldown active. Wait ${Math.ceil((playerData.cooldowns.job - Date.now()) / 1000)} seconds` },
        { status: 400 }
      );
    }

    // Check energy
    const energyCost = 20; // Default energy cost
    if (playerData.player.energy < energyCost) {
      return NextResponse.json(
        { error: `Not enough energy. Need ${energyCost} energy to work.` },
        { status: 400 }
      );
    }

    // Calculate earnings
    const earnings = currentJob.salary * (1 + Math.random() * 0.5); // 100-150% of salary

    // Update player stats
    const updates = {
      player: {
        ...playerData.player,
        energy: Math.max(0, playerData.player.energy - energyCost),
        money: playerData.player.money + Math.floor(earnings)
      }
    };

    await updatePlayerStats(auth.userId, updates);

    // Update job stats
    await dbRun(
      'UPDATE player_job_stats SET total_earnings = total_earnings + ?, hours_worked = hours_worked + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [Math.floor(earnings), auth.userId]
    );

    // Set cooldown (10 minutes)
    await dbRun(
      'UPDATE player_cooldowns SET job = ? WHERE user_id = ?',
      [Date.now() + 600000, auth.userId]
    );

    return NextResponse.json({
      message: 'Work completed!',
      result: {
        earnings: Math.floor(earnings),
        energyCost,
        job: currentJob.job_name
      }
    });
  } catch (error) {
    console.error('Work error:', error);
    return NextResponse.json(
      { error: 'Work failed' },
      { status: 500 }
    );
  }
}
