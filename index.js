import config from './config.js';
import KJUR from 'jsrsasign';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    const emailForm = document.getElementById('emailForm');
    
    if (!emailForm) {
        console.error('Email form not found');
        return;
    }

    // Update form submission handler with better error logging
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button');
        const emailInput = document.getElementById('emailInput');
        
        if (!emailInput || !submitButton) {
            console.error('Form elements not found:', { emailInput, submitButton });
            return;
        }

        const originalButtonText = submitButton.textContent;
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'sending...';
            
            // Log the email being sent
            console.log('Attempting to submit email:', emailInput.value);
            
            // Get JWT token first
            const jwt = await getJwtToken();
            console.log('JWT token obtained');
            
            // Then append to sheet
            const result = await appendToSheet(emailInput.value);
            console.log('Sheet append result:', result);
            
            document.querySelector('.get-involved').innerHTML = `
                <div class="success-message">
                    we shall reach out
                </div>
            `;
            
        } catch (error) {
            console.error('Detailed submission error:', {
                message: error.message,
                stack: error.stack,
                error
            });
            
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            
            alert('Error submitting email. Please try again. Check console for details.');
        }
    });
});

async function appendToSheet(email) {
    const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
    const timestamp = new Date().toISOString();
    
    try {
        // Prepare the request data
        const values = [[email, timestamp, 'pending']];
        const body = {
            values,
            majorDimension: 'ROWS'
        };

        // Get JWT token
        const jwt = await getJwtToken();
        console.log('Making request to Sheets API...');

        // Make the API request
        const response = await fetch(
            `${SHEETS_API}/${config.SHEET_ID}/values/A1:C1:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sheets API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Failed to append to sheet: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('appendToSheet error:', error);
        throw error;
    }
}

async function getJwtToken() {
    try {
        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const now = Math.floor(Date.now() / 1000);
        const claim = {
            iss: config.CLIENT_EMAIL,
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        console.log('Generating JWT token...');
        const headerEncoded = btoa(JSON.stringify(header));
        const claimEncoded = btoa(JSON.stringify(claim));
        
        console.log('Signing JWT...');
        const signature = await signJwt(`${headerEncoded}.${claimEncoded}`, config.PRIVATE_KEY);
        
        console.log('Getting access token...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: `${headerEncoded}.${claimEncoded}.${signature}`
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token Error:', {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                error: errorText
            });
            throw new Error('Failed to get access token');
        }

        const { access_token } = await tokenResponse.json();
        return access_token;
    } catch (error) {
        console.error('getJwtToken error:', error);
        throw error;
    }
}

async function signJwt(input, privateKey) {
    try {
        // Create a new instance of KJUR.crypto.Signature
        const sig = new KJUR.crypto.Signature({"alg": "SHA256withRSA"});
        
        // Initialize with the private key
        sig.init(privateKey);
        
        // Update with the input string
        sig.updateString(input);
        
        // Sign and return the base64-encoded signature
        return sig.sign();
    } catch (error) {
        console.error('Error signing JWT:', error);
        throw error;
    }
}
