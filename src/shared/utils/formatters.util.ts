/**
 * Validates if a phone number is valid
 * @param phone - Phone number string
 * @returns boolean indicating if phone is valid
 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return false;
    
    // Remove non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Brazilian phone validation: 10 or 11 digits
    return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formats a phone number to standard Brazilian format
 * @param phone - Phone number string
 * @returns formatted phone number or original if invalid
 */
export function formatPhone(phone: string): string {
    if (!isValidPhone(phone)) return phone;
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
        // Format: (XX) XXXXX-XXXX
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    // Format: (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/**
 * Removes all formatting from phone number
 * @param phone - Formatted phone number
 * @returns unformatted phone number
 */
export function cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '');
}