import config from '../config.js';

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
        
        const response = await fetch(`${config.API_URL}/api/submit-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailInput.value }),
        });

        const data = await response.json();
        console.log('Response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit email');
        }

        document.querySelector('.get-involved').innerHTML = `
            <div class="success-message">
                we shall reach out
            </div>
        `;
        
    } catch (error) {
        console.error('Detailed submission error:', error);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        alert(error.message || 'Error submitting email. Please try again.');
    }
}
