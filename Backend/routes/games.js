const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');

// Middleware to get db pool from app.locals
const getDb = (req) => req.app.locals.db;

// Helper to get user ID
const getUserId = (req) => {
    return req.user?._id ?? req.user?.id ?? req.user?.user_id ?? req.user?.userId ?? null;
};

// GET /api/games - List all board games
router.get('/', verifyToken, async (req, res) => {
    try {
        const db = getDb(req);
        const result = await db.query('SELECT * FROM board_games ORDER BY _id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching board games:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/games - Admin add a new board game
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { game_type, is_available } = req.body;
        const db = getDb(req);

        // Validate game_type
        // const validTypes = ['ludo', 'chess', 'checkers']; // Removed strict validation to allow flexibility or add more types
        if (!game_type) {
            return res.status(400).json({ message: 'Game type is required' });
        }

        const result = await db.query(
            'INSERT INTO board_games (game_type, is_available) VALUES ($1, $2) RETURNING *',
            [game_type, is_available !== undefined ? is_available : true]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding board game:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/games/:id - Admin delete a board game
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        const result = await db.query('DELETE FROM board_games WHERE _id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Board game not found' });
        }

        res.json({ message: 'Board game deleted successfully' });
    } catch (error) {
        console.error('Error deleting board game:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/games/request - Student request a game
router.post('/request', verifyToken, async (req, res) => {
    try {
        const { game_id, date, start_time, end_time } = req.body;
        const member_id = getUserId(req);
        const db = getDb(req);

        // Basic validation
        if (!member_id || !game_id || !date || !start_time || !end_time) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const result = await db.query(
            `INSERT INTO game_requests (member_id, game_id, date, start_time, end_time, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
            [member_id, game_id, date, start_time, end_time]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error requesting game:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/games/my-requests - Student view their own game requests
router.get('/my-requests', verifyToken, async (req, res) => {
    try {
        const member_id = getUserId(req);
        const db = getDb(req);

        if (!member_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const result = await db.query(`
      SELECT gr.*, bg.game_type 
      FROM game_requests gr
      JOIN board_games bg ON gr.game_id = bg._id
      WHERE gr.member_id = $1
      ORDER BY gr.created_at DESC
    `, [member_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching student game requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/games/requests - Admin view all game requests
router.get('/requests', verifyToken, isAdmin, async (req, res) => {
    try {
        const db = getDb(req);
        const result = await db.query(`
      SELECT gr.*, u.name as member_name, bg.game_type 
      FROM game_requests gr
      JOIN users u ON gr.member_id = u._id
      JOIN board_games bg ON gr.game_id = bg._id
      ORDER BY gr.created_at DESC
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching game requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/games/requests/:id - Admin process request
router.put('/requests/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const staff_id = getUserId(req);
        const db = getDb(req);

        const validStatuses = ['approved', 'rejected', 'cancelled', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const result = await db.query(
            `UPDATE game_requests 
       SET status = $1, staff_id = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE _id = $3 RETURNING *`,
            [status, staff_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Game request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error processing game request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
