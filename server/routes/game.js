import express from 'express';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../database/init.js';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user's game data
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const gameData = user.game_data ? JSON.parse(user.game_data) : null;
    res.json({ gameData });
  } catch (error) {
    console.error('Get game data error:', error);
    res.status(500).json({ error: 'Failed to retrieve game data' });
  }
});

// Save user's game data
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { gameData } = req.body;
    
    if (!gameData) {
      return res.status(400).json({ error: 'Game data is required' });
    }

    // Enhanced game data structure
    const enhancedGameData = {
      ...gameData,
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    };

    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(enhancedGameData), req.user.userId]
    );

    // Log the save for debugging
    console.log(`Game data saved for user ${req.user.userId}`);

    res.json({ 
      message: 'Game data saved successfully',
      timestamp: enhancedGameData.lastSaved
    });
  } catch (error) {
    console.error('Save game data error:', error);
    res.status(500).json({ error: 'Failed to save game data' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, email, username, created_at, last_login FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if username is already taken
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, req.user.userId]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    await dbRun(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, req.user.userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Save specific game progress (stats, education, etc.)
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { 
      stats, 
      education, 
      inventory, 
      money, 
      level, 
      experience,
      energy,
      life,
      currentSection,
      gameTime,
      achievements,
      properties,
      jobs,
      crimes,
      missions,
      faction
    } = req.body;

    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Update specific fields
    const updatedGameData = {
      ...currentGameData,
      player: {
        ...currentGameData.player,
        ...(stats && { stats }),
        ...(education && { education }),
        ...(inventory && { inventory }),
        ...(money !== undefined && { money }),
        ...(level !== undefined && { level }),
        ...(experience !== undefined && { experience }),
        ...(energy !== undefined && { energy }),
        ...(life !== undefined && { life })
      },
      ...(currentSection && { currentSection }),
      ...(gameTime && { gameTime }),
      ...(achievements && { achievements }),
      ...(properties && { properties }),
      ...(jobs && { jobs }),
      ...(crimes && { crimes }),
      ...(missions && { missions }),
      ...(faction && { faction }),
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    };

    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(updatedGameData), req.user.userId]
    );

    res.json({ 
      message: 'Game progress saved successfully',
      timestamp: updatedGameData.lastSaved
    });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ error: 'Failed to save game progress' });
  }
});

// Get comprehensive game statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    
    if (!user?.game_data) {
      return res.json({ 
        message: 'No game data found',
        stats: null 
      });
    }

    const gameData = JSON.parse(user.game_data);
    
    // Extract comprehensive statistics
    const stats = {
      player: gameData.player || {},
      level: gameData.player?.level || 1,
      experience: gameData.player?.experience || 0,
      money: gameData.player?.money || 0,
      energy: gameData.player?.energy || 100,
      life: gameData.player?.life || 100,
      stats: gameData.player?.stats || {},
      education: gameData.player?.education || {},
      inventory: gameData.player?.inventory || {},
      achievements: gameData.achievements || [],
      properties: gameData.properties || [],
      jobs: gameData.jobs || [],
      crimes: gameData.crimes || [],
      missions: gameData.missions || [],
      faction: gameData.faction || null,
      lastSaved: gameData.lastSaved,
      playTime: gameData.gameTime || 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve game statistics' });
  }
});

// Save education progress
router.post('/education', authenticateToken, async (req, res) => {
  try {
    const { course, completed, progress, stats } = req.body;
    
    if (!course) {
      return res.status(400).json({ error: 'Course information is required' });
    }

    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Update education data
    const educationData = {
      ...currentGameData.player?.education,
      [course]: {
        completed: completed || false,
        progress: progress || 0,
        stats: stats || {},
        lastUpdated: new Date().toISOString()
      }
    };

    const updatedGameData = {
      ...currentGameData,
      player: {
        ...currentGameData.player,
        education: educationData
      },
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    };

    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(updatedGameData), req.user.userId]
    );

    res.json({ 
      message: 'Education progress saved successfully',
      course: course,
      progress: progress
    });
  } catch (error) {
    console.error('Save education error:', error);
    res.status(500).json({ error: 'Failed to save education progress' });
  }
});

// Save inventory changes
router.post('/inventory', authenticateToken, async (req, res) => {
  try {
    const { items, category, action } = req.body;
    
    if (!items || !category) {
      return res.status(400).json({ error: 'Items and category are required' });
    }

    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Update inventory
    const inventoryData = {
      ...currentGameData.player?.inventory,
      [category]: items
    };

    const updatedGameData = {
      ...currentGameData,
      player: {
        ...currentGameData.player,
        inventory: inventoryData
      },
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    };

    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(updatedGameData), req.user.userId]
    );

    res.json({ 
      message: 'Inventory updated successfully',
      category: category,
      action: action,
      itemCount: items.length
    });
  } catch (error) {
    console.error('Save inventory error:', error);
    res.status(500).json({ error: 'Failed to save inventory changes' });
  }
});

// Battle system endpoints
router.post('/battle', authenticateToken, async (req, res) => {
  try {
    const { opponent, battleType } = req.body;
    
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Simulate battle
    const battleResult = {
      won: Math.random() > 0.5,
      damageDealt: Math.floor(Math.random() * 50) + 10,
      damageTaken: Math.floor(Math.random() * 30) + 5,
      experience: Math.floor(Math.random() * 20) + 5,
      money: Math.floor(Math.random() * 100) + 20
    };

    // Update player stats
    if (battleResult.won) {
      currentGameData.player.money += battleResult.money;
      currentGameData.player.points += battleResult.experience;
      currentGameData.player.battleStats.wins += 1;
      currentGameData.player.battleStats.damageDealt += battleResult.damageDealt;
    } else {
      currentGameData.player.life -= battleResult.damageTaken;
      currentGameData.player.battleStats.losses += 1;
      currentGameData.player.battleStats.damageTaken += battleResult.damageTaken;
    }

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Battle completed',
      result: battleResult
    });
  } catch (error) {
    console.error('Battle error:', error);
    res.status(500).json({ error: 'Battle failed' });
  }
});

// Crime system endpoints
router.post('/crime', authenticateToken, async (req, res) => {
  try {
    const { crimeType } = req.body;
    
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Crime types and their properties
    const crimes = {
      shoplifting: { risk: 0.3, reward: [50, 200], energy: 10 },
      pickpocketing: { risk: 0.4, reward: [30, 150], energy: 15 },
      burglary: { risk: 0.6, reward: [200, 800], energy: 25 },
      robbery: { risk: 0.7, reward: [500, 1500], energy: 35 },
      heist: { risk: 0.8, reward: [2000, 5000], energy: 50 }
    };

    const crime = crimes[crimeType];
    if (!crime) {
      return res.status(400).json({ error: 'Invalid crime type' });
    }

    // Check energy
    if (currentGameData.player.energy < crime.energy) {
      return res.status(400).json({ error: 'Not enough energy' });
    }

    // Simulate crime
    const isSuccess = Math.random() > crime.risk;
    const isArrested = !isSuccess && Math.random() < crime.risk * 0.5;
    
    let result = { success: isSuccess, arrested: isArrested };

    if (isSuccess) {
      const reward = Math.floor(Math.random() * (crime.reward[1] - crime.reward[0] + 1)) + crime.reward[0];
      currentGameData.player.money += reward;
      currentGameData.player.crimeStats.successful += 1;
      currentGameData.player.crimeStats.totalEarnings += reward;
      result.reward = reward;
    } else if (isArrested) {
      currentGameData.player.crimeStats.arrested += 1;
      currentGameData.player.life -= 20;
    } else {
      currentGameData.player.crimeStats.failed += 1;
    }

    currentGameData.player.energy -= crime.energy;

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Crime attempted',
      result: result
    });
  } catch (error) {
    console.error('Crime error:', error);
    res.status(500).json({ error: 'Crime failed' });
  }
});

// Job system endpoints
router.post('/job/apply', authenticateToken, async (req, res) => {
  try {
    const { jobName } = req.body;
    
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Job types and requirements
    const jobs = {
      'Fast Food Worker': { 
        requirements: { manualLabor: 50 }, 
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
        requirements: { manualLabor: 80, strength: 70 }, 
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
      return res.status(400).json({ error: 'Invalid job' });
    }

    // Check requirements
    const playerStats = currentGameData.player.stats || {};
    const workingStats = currentGameData.player.workingStats || {};
    
    for (const [stat, requirement] of Object.entries(job.requirements)) {
      const playerStat = playerStats[stat] || workingStats[stat] || 0;
      if (playerStat < requirement) {
        return res.status(400).json({ 
          error: `Insufficient ${stat}. Required: ${requirement}, Current: ${playerStat}` 
        });
      }
    }

    // Assign job
    currentGameData.player.currentJob = {
      name: jobName,
      pay: job.pay,
      energy: job.energy,
      description: job.description,
      startDate: new Date().toISOString()
    };

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Job applied successfully',
      job: currentGameData.player.currentJob
    });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ error: 'Job application failed' });
  }
});

// Work at job endpoint
router.post('/job/work', authenticateToken, async (req, res) => {
  try {
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    if (!currentGameData.player.currentJob) {
      return res.status(400).json({ error: 'No active job' });
    }

    const job = currentGameData.player.currentJob;
    
    // Check energy
    if (currentGameData.player.energy < job.energy) {
      return res.status(400).json({ error: 'Not enough energy to work' });
    }

    // Work
    currentGameData.player.energy -= job.energy;
    currentGameData.player.money += job.pay;
    currentGameData.player.jobStats.totalEarnings += job.pay;
    currentGameData.player.jobStats.hoursWorked += 1;

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Work completed',
      earnings: job.pay,
      energyUsed: job.energy
    });
  } catch (error) {
    console.error('Work error:', error);
    res.status(500).json({ error: 'Work failed' });
  }
});

// Education system endpoints
router.post('/education/enroll', authenticateToken, async (req, res) => {
  try {
    const { course } = req.body;
    
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Course definitions
    const courses = {
      'Mathematics': { 
        cost: 500, 
        duration: 7, 
        stats: { intelligence: 10, endurance: 5 },
        description: 'Improve mathematical skills'
      },
      'Business': { 
        cost: 800, 
        duration: 10, 
        stats: { intelligence: 15, endurance: 10 },
        description: 'Learn business management'
      },
      'Combat Training': { 
        cost: 1000, 
        duration: 14, 
        stats: { strength: 15, defense: 10, speed: 5 },
        description: 'Military-style combat training'
      },
      'Computer Science': { 
        cost: 1200, 
        duration: 12, 
        stats: { intelligence: 20, endurance: 15 },
        description: 'Programming and computer skills'
      },
      'Health & Fitness': { 
        cost: 400, 
        duration: 5, 
        stats: { strength: 10, endurance: 15, speed: 10 },
        description: 'Physical fitness and health'
      }
    };

    const courseData = courses[course];
    if (!courseData) {
      return res.status(400).json({ error: 'Invalid course' });
    }

    // Check if already enrolled
    if (currentGameData.player.education && currentGameData.player.education[course]) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check money
    if (currentGameData.player.money < courseData.cost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Enroll in course
    currentGameData.player.money -= courseData.cost;
    currentGameData.player.education = currentGameData.player.education || {};
    currentGameData.player.education[course] = {
      enrolled: true,
      progress: 0,
      completed: false,
      startDate: new Date().toISOString(),
      duration: courseData.duration,
      cost: courseData.cost,
      stats: courseData.stats
    };

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Enrolled in course successfully',
      course: course,
      cost: courseData.cost
    });
  } catch (error) {
    console.error('Education enrollment error:', error);
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

// Complete education course
router.post('/education/complete', authenticateToken, async (req, res) => {
  try {
    const { course } = req.body;
    
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    if (!currentGameData.player.education || !currentGameData.player.education[course]) {
      return res.status(400).json({ error: 'Not enrolled in this course' });
    }

    const courseData = currentGameData.player.education[course];
    
    // Complete course
    courseData.completed = true;
    courseData.completionDate = new Date().toISOString();
    
    // Apply stat improvements
    const stats = courseData.stats;
    for (const [stat, improvement] of Object.entries(stats)) {
      if (currentGameData.player.stats[stat]) {
        currentGameData.player.stats[stat] += improvement;
      } else if (currentGameData.player.workingStats[stat]) {
        currentGameData.player.workingStats[stat] += improvement;
      }
    }

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Course completed successfully',
      course: course,
      statImprovements: courseData.stats
    });
  } catch (error) {
    console.error('Education completion error:', error);
    res.status(500).json({ error: 'Course completion failed' });
  }
});

// Property system endpoints
router.post('/property/buy', authenticateToken, async (req, res) => {
  try {
    const { propertyName } = req.body;
    
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    // Property definitions
    const properties = {
      'Small Apartment': { 
        cost: 50000, 
        income: 200, 
        fees: 50,
        description: 'A small apartment in the city'
      },
      'Medium House': { 
        cost: 150000, 
        income: 600, 
        fees: 150,
        description: 'A comfortable house in the suburbs'
      },
      'Large Mansion': { 
        cost: 500000, 
        income: 2000, 
        fees: 500,
        description: 'A luxurious mansion with many rooms'
      },
      'Business Building': { 
        cost: 1000000, 
        income: 5000, 
        fees: 1000,
        description: 'A commercial building for business'
      }
    };

    const property = properties[propertyName];
    if (!property) {
      return res.status(400).json({ error: 'Invalid property' });
    }

    // Check money
    if (currentGameData.player.money < property.cost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Buy property
    currentGameData.player.money -= property.cost;
    currentGameData.player.property = {
      name: propertyName,
      cost: property.cost,
      income: property.income,
      fees: property.fees,
      purchaseDate: new Date().toISOString()
    };

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Property purchased successfully',
      property: currentGameData.player.property
    });
  } catch (error) {
    console.error('Property purchase error:', error);
    res.status(500).json({ error: 'Property purchase failed' });
  }
});

// Faction system endpoints
router.post('/faction/create', authenticateToken, async (req, res) => {
  try {
    const { factionName } = req.body;
    
    // Get current game data
    const user = await dbGet('SELECT game_data FROM users WHERE id = ?', [req.user.userId]);
    let currentGameData = user?.game_data ? JSON.parse(user.game_data) : {};

    const factionCost = 30000000; // $30 million

    // Check money
    if (currentGameData.player.money < factionCost) {
      return res.status(400).json({ 
        error: 'Insufficient funds',
        required: factionCost,
        current: currentGameData.player.money
      });
    }

    // Create faction
    currentGameData.player.money -= factionCost;
    currentGameData.player.faction = {
      name: factionName,
      created: true,
      creationDate: new Date().toISOString(),
      members: 1,
      territory: 0,
      wars: 0
    };

    // Save updated data
    await dbRun(
      'UPDATE users SET game_data = ? WHERE id = ?',
      [JSON.stringify(currentGameData), req.user.userId]
    );

    res.json({ 
      message: 'Faction created successfully',
      faction: currentGameData.player.faction
    });
  } catch (error) {
    console.error('Faction creation error:', error);
    res.status(500).json({ error: 'Faction creation failed' });
  }
});

export default router;
