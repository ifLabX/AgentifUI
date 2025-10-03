import type { DifyUserInputFormItem } from '@lib/services/dify/types';

/**
 * Validate workflow form data
 *
 * @param formData form data
 * @param userInputForm form configuration
 * @param t translation function for workflow validation messages
 * @returns validation error object
 */
export function validateFormData(
  formData: Record<string, any>,
  userInputForm: DifyUserInputFormItem[],
  t: (key: string, params?: any) => string
): Record<string, string> {
  const errors: Record<string, string> = {};

  userInputForm.forEach(formItem => {
    const fieldType = Object.keys(formItem)[0];
    const fieldConfig = formItem[fieldType as keyof typeof formItem];

    if (!fieldConfig) return;

    const { variable, required, label } = fieldConfig;
    const value = formData[variable];

    // Check if the field is empty
    const isFileField = fieldType === 'file' || fieldType === 'file-list';
    const isNumberField = fieldType === 'number';

    const isEmpty = isFileField
      ? !value ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' &&
          !Array.isArray(value) &&
          !value.upload_file_id)
      : isNumberField
        ? value === '' || value === null || value === undefined
        : !value || (typeof value === 'string' && value.trim() === '');

    // If the field is empty and not required, skip all validation
    if (isEmpty && !required) {
      return;
    }

    // Required validation
    if (isEmpty && required) {
      errors[variable] = t('validation.required', { label });
      return;
    }

    // Number type validation
    if (fieldType === 'number') {
      const numberConfig = fieldConfig as any;

      // Check if it is a valid number
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) {
        errors[variable] = t('validation.invalidNumber', { label });
        return;
      }

      // Minimum value validation
      if (numberConfig.min !== undefined && numValue < numberConfig.min) {
        errors[variable] = t('validation.minValue', {
          label,
          min: numberConfig.min,
        });
        return;
      }

      // Maximum value validation
      if (numberConfig.max !== undefined && numValue > numberConfig.max) {
        errors[variable] = t('validation.maxValue', {
          label,
          max: numberConfig.max,
        });
        return;
      }

      // Step validation
      if (numberConfig.step && numberConfig.step > 0) {
        const minValue = numberConfig.min || 0;
        const remainder = (numValue - minValue) % numberConfig.step;
        if (Math.abs(remainder) > 1e-10) {
          // Use small tolerance to handle floating point precision issues
          errors[variable] = t('validation.stepValue', {
            label,
            step: numberConfig.step,
          });
          return;
        }
      }

      // Precision validation (decimal places)
      if (numberConfig.precision !== undefined) {
        const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
        if (decimalPlaces > numberConfig.precision) {
          errors[variable] = t('validation.precisionExceeded', {
            label,
            precision: numberConfig.precision,
          });
          return;
        }
      }
    }

    // Character length validation (only applicable to text fields)
    if (fieldType === 'text-input' || fieldType === 'paragraph') {
      const maxLength = (fieldConfig as any).max_length;
      if (maxLength && typeof value === 'string' && value.length > maxLength) {
        errors[variable] = t('validation.maxLengthExceeded', {
          label,
          maxLength,
        });
      }
    }

    // Dropdown selection validation
    if (fieldType === 'select') {
      const selectConfig = fieldConfig as any;
      if (selectConfig.options && !selectConfig.options.includes(value)) {
        errors[variable] = t('validation.invalidSelection', { label });
      }
    }

    // File validation
    if (isFileField) {
      const fileConfig = fieldConfig as any;

      // Convert single file object to array for uniform processing
      const fileArray = Array.isArray(value) ? value : [value];

      // 1. Check file number limit first (supports max_length and number_limits)
      const maxFileCount = fileConfig.max_length || fileConfig.number_limits;
      if (maxFileCount && fileArray.length > maxFileCount) {
        errors[variable] = t('validation.tooManyFiles', {
          label,
          maxFiles: maxFileCount,
        });
        return; // When the number exceeds the limit, do not check other errors
      }

      // 2. File size and type validation (only validate the original File object)
      for (const file of fileArray) {
        if (file instanceof File) {
          // File size validation
          if (fileConfig.max_file_size_mb) {
            const maxSizeBytes = fileConfig.max_file_size_mb * 1024 * 1024;
            if (file.size > maxSizeBytes) {
              errors[variable] = t('validation.fileTooLarge', {
                label,
                fileName: file.name,
                maxSize: fileConfig.max_file_size_mb,
              });
              break;
            }
          }

          // File type validation
          if (
            fileConfig.allowed_file_types &&
            fileConfig.allowed_file_types.length > 0
          ) {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (
              !fileExtension ||
              !fileConfig.allowed_file_types.includes(fileExtension)
            ) {
              errors[variable] = t('validation.unsupportedFileType', {
                label,
                fileName: file.name,
                allowedTypes: fileConfig.allowed_file_types.join(', '),
              });
              break;
            }
          }
        }
        // For Dify file objects that have upload_file_id, skip validation
      }
    }
  });

  return errors;
}
