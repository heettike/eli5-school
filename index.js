import config from './config.js';
import KJUR from 'jsrsasign';

async function appendToSheet(email) {
    const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
    const timestamp = new Date().toISOString();
    
    // Prepare the request data
    const values = [[email, timestamp, 'pending']];
    const body = {
        values,
        majorDimension: 'ROWS'
    };

    // Get JWT token
    const jwt = await getJwtToken();

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
        throw new Error('Failed to append to sheet');
    }

    return response.json();
}

// JWT token generation
async function getJwtToken() {
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

    const headerEncoded = btoa(JSON.stringify(header));
    const claimEncoded = btoa(JSON.stringify(claim));
    const signature = await signJwt(`${headerEncoded}.${claimEncoded}`, config.PRIVATE_KEY);
    
    // Get access token
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

    const { access_token } = await tokenResponse.json();
    return access_token;
}

// Sign JWT function
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

// Update form submission handler
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button');
    const emailInput = document.getElementById('emailInput');
    const originalButtonText = submitButton.textContent;
    
    try {
        submitButton.disabled = true;
        submitButton.textContent = 'sending...';
        
        await appendToSheet(emailInput.value);
        
        document.querySelector('.get-involved').innerHTML = `
            <div class="success-message">
                we shall reach out
            </div>
        `;
        
    } catch (error) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        
        console.error('Submission error:', error);
        alert('Error submitting email. Please try again.');
    }
});
