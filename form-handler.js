/**
 * Stella Martis Campaign Form Handler
 * Handles client-side validation and API submission
 */

class CampaignFormHandler {
  constructor() {
    this.form = document.getElementById('campaign-form');
    this.submitBtn = document.getElementById('submit-btn');
    this.messageBox = document.getElementById('form-message');
    this.apiUrl = '/api/campaigns';

    if (this.form) {
      this.init();
    }
  }

  init() {
    console.log('[v0] Campaign form handler initialized');

    // Handle form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time validation
    this.form.addEventListener('change', (e) => this.validateField(e.target));
    this.form.addEventListener('blur', (e) => this.validateField(e.target), true);

    console.log('[v0] Event listeners attached');
  }

  /**
   * Validate a single form field
   */
  validateField(field) {
    const errorElement = document.getElementById(`error-${field.name}`);
    if (!errorElement) return;

    let error = '';

    // Clear previous error state
    field.classList.remove('error');
    errorElement.textContent = '';

    switch (field.name) {
      case 'organization':
        if (!field.value.trim()) {
          error = 'Organization name is required';
        } else if (field.value.trim().length < 2) {
          error = 'Organization name must be at least 2 characters';
        }
        break;

      case 'email':
        if (!field.value.trim()) {
          error = 'Email is required';
        } else if (!this.validateEmail(field.value)) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'hardware':
        if (!field.value.trim()) {
          error = 'Hardware description is required';
        } else if (field.value.trim().length < 10) {
          error = 'Please provide at least 10 characters describing your hardware';
        }
        break;
    }

    // Show error if exists
    if (error) {
      field.classList.add('error');
      errorElement.textContent = error;
      return false;
    }

    return true;
  }

  /**
   * Validate all required fields
   */
  validateForm() {
    const requiredFields = [
      this.form.getElementById('organization'),
      this.form.getElementById('email'),
      this.form.getElementById('hardware'),
    ];

    let isValid = true;
    requiredFields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Email validation using regex
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Show message
   */
  showMessage(message, type = 'info') {
    console.log(`[v0] Message (${type}):`, message);

    this.messageBox.className = `form-message ${type}`;
    this.messageBox.textContent = message;
    this.messageBox.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.messageBox.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();
    console.log('[v0] Form submission initiated');

    // Validate form
    if (!this.validateForm()) {
      console.log('[v0] Validation failed');
      this.showMessage('Please fill in all required fields correctly', 'error');
      return;
    }

    // Disable button and show loading state
    this.submitBtn.disabled = true;
    this.submitBtn.classList.add('loading');
    this.showMessage('Transmitting campaign brief...', 'loading');

    try {
      // Collect form data
      const formData = {
        organization: this.form.getElementById('organization').value.trim(),
        email: this.form.getElementById('email').value.trim(),
        hardware: this.form.getElementById('hardware').value.trim(),
        testConditions: this.form.getElementById('testConditions').value.trim(),
        timeline: this.form.getElementById('timeline').value.trim(),
        deliverables: this.form.getElementById('deliverables').value,
        spitiTravel: this.form.getElementById('spitiTravel').value.trim(),
      };

      console.log('[v0] Submitting form data:', formData);

      // Send to server
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log('[v0] Server response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit campaign');
      }

      // Success!
      console.log('[v0] Campaign submitted successfully:', result.campaignId);
      this.submitBtn.classList.remove('loading');
      this.submitBtn.classList.add('success');
      this.submitBtn.textContent = '✓ BRIEF RECEIVED';

      this.showMessage(
        `Campaign brief received! Your campaign ID is: ${result.campaignId}. We'll review it and contact you within 48 hours.`,
        'success'
      );

      // Reset form after delay
      setTimeout(() => {
        this.form.reset();
        this.clearAllErrors();
        this.submitBtn.disabled = false;
        this.submitBtn.classList.remove('success');
        this.submitBtn.textContent = 'SUBMIT CAMPAIGN BRIEF';
      }, 5000);
    } catch (error) {
      console.error('[v0] Submission error:', error);
      this.submitBtn.disabled = false;
      this.submitBtn.classList.remove('loading');
      this.showMessage(
        `Error: ${error.message}. Please try again or email contact@stellamartis.in`,
        'error'
      );
    }
  }

  /**
   * Clear all error messages
   */
  clearAllErrors() {
    document.querySelectorAll('.form-error').forEach((el) => {
      el.textContent = '';
    });
    document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach((el) => {
      el.classList.remove('error');
    });
  }
}

// Initialize form handler when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CampaignFormHandler();
  });
} else {
  new CampaignFormHandler();
}
