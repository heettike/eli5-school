document.getElementById('emailForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitButton = e.target.querySelector('button');
  const emailInput = document.getElementById('emailInput');
  const originalButtonText = submitButton.textContent;
  
  try {
      // Disable form and show loading state
      submitButton.disabled = true;
      submitButton.textContent = 'sending...';
      
      // We'll implement Google Sheets API integration here later
      console.log('Email submitted:', emailInput.value);
      
      // Success state (temporary)
      document.querySelector('.get-involved').innerHTML = `
          <div class="success-message">
              we shall reach out
          </div>
      `;
      
  } catch (error) {
      // Reset form state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      
      console.error('Submission error:', error);
      alert('Error submitting email. Please try again.');
  }
});