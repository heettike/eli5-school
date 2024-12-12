const { google } = require('googleapis');

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { email } = req.body;
        
        // Input validation
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        // Environment validation
        const requiredEnvVars = ['SHEET_ID', 'CLIENT_EMAIL', 'PRIVATE_KEY'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error(`Missing environment variables: ${missingVars.join(', ')}`);
            throw new Error('Server configuration error');
        }

        // Format private key properly
        let privateKey = process.env.PRIVATE_KEY;
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            privateKey = privateKey
                .replace(/\\n/g, '\n')
                .replace(/"/g, '');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.CLIENT_EMAIL,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        console.log('Attempting to authenticate with Google...');
        const sheets = google.sheets({ version: 'v4', auth });
        
        const timestamp = new Date().toISOString();
        const values = [[email, timestamp, 'pending']];

        console.log('Attempting to append to sheet:', process.env.SHEET_ID);
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: 'A1:C1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });

        return res.status(200).json({ message: 'Email submitted successfully' });
    } catch (error) {
        // Log error details in production-friendly way
        console.error('Email submission error:', {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            }
        });

        // Don't expose internal error details in production
        return res.status(500).json({ 
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = handler; 