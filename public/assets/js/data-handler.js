// Data handling and validation utilities
import config from '../config.js';

class DataHandler {
    // Input validation
    static validateInput(value, rules) {
        const errors = [];

        if (!rules) return errors;

        // Required check
        if (rules.required && !value) {
            errors.push('This field is required');
        }

        // Minimum length check
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Must be at least ${rules.minLength} characters`);
        }

        // Maximum length check
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Must be no more than ${rules.maxLength} characters`);
        }

        // Email format check
        if (rules.email && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push('Invalid email format');
            }
        }

        // Number check
        if (rules.number && value) {
            if (isNaN(value)) {
                errors.push('Must be a number');
            } else {
                const num = Number(value);
                if (rules.min !== undefined && num < rules.min) {
                    errors.push(`Must be at least ${rules.min}`);
                }
                if (rules.max !== undefined && num > rules.max) {
                    errors.push(`Must be no more than ${rules.max}`);
                }
            }
        }

        // Custom validation
        if (rules.custom) {
            const customError = rules.custom(value);
            if (customError) {
                errors.push(customError);
            }
        }

        return errors;
    }

    // Error handling
    static handleError(error) {
        console.error('Error:', error);

        if (error.response) {
            // Server responded with error
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 400:
                    return {
                        type: 'validation',
                        message: data.message || 'Invalid input',
                        errors: data.errors
                    };
                case 401:
                    // Unauthorized - redirect to login
                    window.location.href = '/login';
                    return {
                        type: 'auth',
                        message: 'Please log in again'
                    };
                case 403:
                    return {
                        type: 'permission',
                        message: 'You do not have permission to perform this action'
                    };
                case 404:
                    return {
                        type: 'not_found',
                        message: 'The requested resource was not found'
                    };
                case 429:
                    return {
                        type: 'rate_limit',
                        message: 'Too many requests, please try again later'
                    };
                case 500:
                    return {
                        type: 'server',
                        message: 'An internal server error occurred'
                    };
                default:
                    return {
                        type: 'unknown',
                        message: 'An unexpected error occurred'
                    };
            }
        } else if (error.request) {
            // Request made but no response
            return {
                type: 'network',
                message: 'Network error, please check your connection'
            };
        } else {
            // Something else went wrong
            return {
                type: 'unknown',
                message: error.message || 'An unexpected error occurred'
            };
        }
    }

    // Loading state management
    static createLoadingState() {
        let isLoading = false;
        let loadingElement = null;

        return {
            start: (element) => {
                if (isLoading) return;
                isLoading = true;
                element.classList.add('loading');
                loadingElement = element;
            },
            stop: () => {
                if (!isLoading) return;
                isLoading = false;
                if (loadingElement) {
                    loadingElement.classList.remove('loading');
                    loadingElement = null;
                }
            },
            isLoading: () => isLoading
        };
    }

    // Form data handling
    static handleFormData(formElement, options = {}) {
        const formData = new FormData(formElement);
        const data = {};

        for (let [key, value] of formData.entries()) {
            // Trim strings
            if (typeof value === 'string') {
                value = value.trim();
            }

            // Handle numbers
            if (options.numbers && options.numbers.includes(key)) {
                value = Number(value);
            }

            // Handle booleans
            if (options.booleans && options.booleans.includes(key)) {
                value = value === 'true';
            }

            // Handle arrays
            if (options.arrays && options.arrays.includes(key)) {
                if (!data[key]) {
                    data[key] = [];
                }
                data[key].push(value);
                continue;
            }

            // Handle JSON
            if (options.json && options.json.includes(key)) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.error(`Error parsing JSON for field ${key}:`, e);
                }
            }

            data[key] = value;
        }

        return data;
    }

    // API response handling
    static handleApiResponse(response) {
        const data = response.data;

        // Check for success flag
        if (data.success === false) {
            throw new Error(data.message || 'Operation failed');
        }

        // Check for errors array
        if (data.errors && data.errors.length > 0) {
            throw new Error(data.errors[0].message || 'Validation failed');
        }

        return data;
    }
}

export default DataHandler;