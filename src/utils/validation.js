export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateWhatsApp = (number) => {
  const re = /^\d{10,11}$/;
  return re.test(number.replace(/\D/g, ''));
};

export const validateForm = (values, type = 'register') => {
  const errors = {};

  if (!values.email || !validateEmail(values.email)) {
    errors.email = 'Email inválido';
  }

  if (type === 'register') {
    if (!values.fullName || values.fullName.trim().length < 3) {
      errors.fullName = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!values.whatsapp || !validateWhatsApp(values.whatsapp)) {
      errors.whatsapp = 'Número de WhatsApp inválido';
    }

    if (!values.password || !validatePassword(values.password)) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Senhas não conferem';
    }

    if (!values.selectedCourse) {
      errors.selectedCourse = 'Selecione um curso';
    }
  } else {
    if (!values.password) {
      errors.password = 'Senha é obrigatória';
    }
  }

  return errors;
};
