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

        // Clean and format private key
        const privateKey = process.env.PRIVATE_KEY
            .replace(/\\n/g, '\n')
            .replace(/^"|"$/g, '');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: 'eli5-439914',
                private_key_id: '946c91cd6ce1cfc737d3fb87af779fe10e0e751d',
                private_key: privateKey,
                client_email: process.env.CLIENT_EMAIL,
                client_id: '111173083862264192187',
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.CLIENT_EMAIL)}`
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        console.log('Authenticating with Google...');
        const sheets = google.sheets({ version: 'v4', auth });
        
        const timestamp = new Date().toISOString();
        const values = [[email, timestamp, 'pending']];

        console.log('Appending to sheet:', process.env.SHEET_ID);
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Sheet1!A:C',  // Explicitly specify sheet name
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });

        console.log('Append result:', result.status);
        return res.status(200).json({ message: 'Email submitted successfully' });
    } catch (error) {
        console.error('Detailed error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });

        return res.status(500).json({ 
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = handler; 