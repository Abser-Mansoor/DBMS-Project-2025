const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../SQL/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Helper to get user ID
const getUserId = (req) => {
    return req.user?._id ?? req.user?.id ?? req.user?.user_id ?? req.user?.userId ?? null;
};

// ---------------------------------------------------------
// PUBLIC / STUDENT ROUTES
// ---------------------------------------------------------

// GET /api/rooms - List all rooms
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM rooms ORDER BY room_name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/rooms/request - Create a room booking request
router.post(
    '/request',
    verifyToken,
    [
        body('roomId').isInt().withMessage('Valid Room ID is required'),
        body('date').isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
        body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
        body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = getUserId(req);
            const { roomId, date, startTime, endTime } = req.body;

            // Check if room exists
            const roomCheck = await db.query('SELECT * FROM rooms WHERE _id = $1', [roomId]);
            if (roomCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Room not found' });
            }

            // Check for overlapping approved requests for the same room
            const conflictCheck = await db.query(
                `SELECT * FROM room_requests 
                WHERE room_id = $1 
                AND date = $2 
                AND status = 'approved'
                AND (
                    (start_time <= $3 AND end_time > $3) OR
                    (start_time < $4 AND end_time >= $4) OR
                    (start_time >= $3 AND end_time <= $4)
                )`,
                [roomId, date, startTime, endTime]
            );

            if (conflictCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Room is already booked for this time slot' });
            }

            // Create request
            const insertQuery = `
                INSERT INTO room_requests (member_id, room_id, date, start_time, end_time, status)
                VALUES ($1, $2, $3, $4, $5, 'pending')
                RETURNING *;
            `;

            const newRequest = await db.query(insertQuery, [userId, roomId, date, startTime, endTime]);
            res.status(201).json(newRequest.rows[0]);

        } catch (error) {
            console.error('Error creating room request:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// GET /api/rooms/my-requests - Get current user's requests
router.get('/my-requests', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const query = `
                SELECT rr.*, r.room_name, r.location
                FROM room_requests rr
                JOIN rooms r ON rr.room_id = r._id
                WHERE rr.member_id = $1
                ORDER BY rr.date DESC, rr.start_time ASC
            `;
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------------------------
// ADMIN ROUTES
// ---------------------------------------------------------

// POST /api/rooms - Add a new room (Admin only)
router.post(
    '/',
    verifyToken,
    isAdmin,
    [
        body('roomName').trim().notEmpty().withMessage('Room name is required'),
        body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
        body('location').trim().notEmpty().withMessage('Location is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { roomName, capacity, location } = req.body;

            const result = await db.query(
                'INSERT INTO rooms (room_name, capacity, location) VALUES ($1, $2, $3) RETURNING *',
                [roomName, capacity, location]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error adding room:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// GET /api/rooms/requests - Get all requests (Admin only)
router.get('/requests', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
                SELECT rr.*, r.room_name, u.name as member_name, u.email as member_email
                FROM room_requests rr
                JOIN rooms r ON rr.room_id = r._id
                JOIN users u ON rr.member_id = u._id
            `;

        const params = [];
        if (status && status !== 'all') {
            query += ' WHERE rr.status = $1';
            params.push(status);
        }

        query += ' ORDER BY rr.date DESC, rr.start_time ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/rooms/requests/:id - Update request status (Admin only)
router.put('/requests/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;
        const staffId = getUserId(req);

        if (!['approved', 'rejected', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // If approving, check for conflicts again
        if (status === 'approved') {
            const requestQ = await db.query('SELECT * FROM room_requests WHERE _id = $1', [requestId]);
            if (requestQ.rows.length === 0) return res.status(404).json({ message: 'Request not found' });

            const reqData = requestQ.rows[0];

            const conflictCheck = await db.query(
                `SELECT * FROM room_requests 
                WHERE room_id = $1 
                AND date = $2 
                AND status = 'approved'
                AND _id != $5
                AND (
                    (start_time <= $3 AND end_time > $3) OR
                    (start_time < $4 AND end_time >= $4) OR
                    (start_time >= $3 AND end_time <= $4)
                )`,
                [reqData.room_id, reqData.date, reqData.start_time, reqData.end_time, requestId]
            );

            if (conflictCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Conflict detected: Room is already booked for this time' });
            }
        }

        const result = await db.query(
            'UPDATE room_requests SET status = $1, staff_id = $2, updated_at = CURRENT_TIMESTAMP WHERE _id = $3 RETURNING *',
            [status, staffId, requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
