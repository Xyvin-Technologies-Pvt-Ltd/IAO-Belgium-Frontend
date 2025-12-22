import React from 'react';
import { Button } from '../button';

const FormActions = ({ 
  onCancel, 
  onSubmit, 
  isLoading = false, 
  submitText = 'Submit',
  cancelText = 'Cancel',
  isEdit = false,
  className = 'flex justify-end gap-3 pt-2'
}) => {
  return (
    <div className={className}>
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading 
          ? `${isEdit ? 'Updating' : 'Creating'}...` 
          : (isEdit ? 'Update' : submitText)
        }
      </Button>
    </div>
  );
};

export default FormActions;