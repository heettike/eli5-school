import config from './config.js';

// Wait for DOM to be fully loaded
window.addEventListener('load', () => {
    initializeForm();
});

function initializeForm() {
    const emailForm = document.getElementById('emailForm');
    if (!emailForm) {
        console.error('Email form not found');
        return;
    }

    emailForm.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button');
    const emailInput = document.getElementById('emailInput');
    
    if (!emailInput || !submitButton) {
        console.error('Form elements not found');
        return;
    }

    const originalButtonText = submitButton.textContent;
    
    try {
        submitButton.disabled = true;
        submitButton.textContent = 'sending...';
        
        console.log('Attempting to submit email:', emailInput.value);
        const jwt = await getJwtToken();
        console.log('JWT token obtained');
        
        const result = await appendToSheet(emailInput.value);
        console.log('Sheet append result:', result);
        
        document.querySelector('.get-involved').innerHTML = `
            <div class="success-message">
                we shall reach out
            </div>
        `;
        
    } catch (error) {
        console.error('Submission error:', error);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        alert('Error submitting email. Please try again.');
    }
}

async function appendToSheet(email) {
    const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
    const timestamp = new Date().toISOString();
    
    const values = [[email, timestamp, 'pending']];
    const body = {
        values,
        majorDimension: 'ROWS'
    };

    const jwt = await getJwtToken();

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

async function signJwt(input, privateKey) {
    try {
        const sig = new KJUR.crypto.Signature({"alg": "SHA256withRSA"});
        sig.init(privateKey);
        sig.updateString(input);
        return sig.sign();
    } catch (error) {
        console.error('Error signing JWT:', error);
        throw error;
    }
}
