import Swal from 'sweetalert2';

const toast = {
  success: (message) => {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      confirmButtonColor: '#198754',
      customClass: {
        popup: 'rounded-4 shadow-sm border-0',
      }
    });
  },
  error: (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Action Failed',
      text: message,
      confirmButtonColor: '#dc3545',
      customClass: {
        popup: 'rounded-4 shadow-sm border-0',
      }
    });
  },
  loading: (message) => {
    Swal.fire({
      title: 'Please wait...',
      text: message,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },
  dismiss: () => {
    Swal.close();
  }
};

export default toast;
