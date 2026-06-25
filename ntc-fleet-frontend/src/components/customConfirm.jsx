import Swal from 'sweetalert2';

export const customConfirm = (message) => {
  return Swal.fire({
    title: 'Confirm Action',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#fff',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-4 shadow-sm border-0',
      confirmButton: 'px-4 py-2 fw-bold rounded-3',
      cancelButton: 'px-4 py-2 fw-bold text-dark border rounded-3'
    }
  }).then((result) => {
    return result.isConfirmed;
  });
};
