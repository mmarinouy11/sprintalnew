import type { Dictionary } from "./en";

/** Spanish dictionary. Must mirror the shape of en.ts (Dictionary). */
export const es: Dictionary = {
  common: {
    appName: "Sprintal",
    loading: "Cargando…",
    save: "Guardar",
    cancel: "Cancelar",
  },
  nav: {
    portfolio: "Portafolio",
    bets: "Apuestas",
    signals: "Señales",
    settings: "Ajustes",
  },
  auth: {
    common: {
      email: "Correo electrónico",
      password: "Contraseña",
      or: "o",
      continue: "Continuar",
    },
    login: {
      title: "Inicia sesión en Sprintal",
      subtitle: "Bienvenido de nuevo.",
      submit: "Iniciar sesión",
      google: "Continuar con Google",
      forgotPassword: "¿Olvidaste tu contraseña?",
      noAccount: "¿No tienes una cuenta?",
      signUpLink: "Crea una",
    },
    signup: {
      title: "Crea tu espacio de trabajo",
      subtitle: "Comienza tu prueba de 30 días. Sin tarjeta.",
      orgNameLabel: "Nombre de la organización",
      submit: "Crear cuenta",
      google: "Registrarse con Google",
      haveAccount: "¿Ya tienes una cuenta?",
      loginLink: "Iniciar sesión",
      checkEmail:
        "Casi listo: revisa tu correo para confirmar tu cuenta y luego inicia sesión.",
    },
    forgot: {
      title: "Restablece tu contraseña",
      subtitle: "Ingresa tu correo y te enviaremos un enlace para restablecerla.",
      submit: "Enviar enlace",
      backToLogin: "Volver a iniciar sesión",
      sent: "Si existe una cuenta con ese correo, el enlace está en camino.",
    },
    setPassword: {
      title: "Establece tu contraseña",
      subtitle: "Elige una contraseña para terminar de configurar tu cuenta.",
      submit: "Guardar contraseña",
      success: "Contraseña guardada. Redirigiendo…",
    },
    invite: {
      title: "Has recibido una invitación",
      validating: "Comprobando tu invitación…",
      joinPrompt: "Te invitaron a unirte a {org} como {role}.",
      accept: "Aceptar invitación",
      signInPrompt: "Inicia sesión como {email} para aceptar.",
      signInLink: "Iniciar sesión",
      createPrompt: "Crea una cuenta para {email} para aceptar.",
      createLink: "Crear cuenta",
      wrongAccount:
        "Has iniciado sesión con otra cuenta. Inicia sesión como {email} para aceptar esta invitación.",
      invalidTitle: "Esta invitación no es válida",
      invalidBody: "El enlace de invitación no es válido o ya se utilizó.",
      expiredBody: "Esta invitación ha expirado. Pide a un administrador que la reenvíe.",
    },
    errors: {
      generic: "Algo salió mal. Inténtalo de nuevo.",
      missingFields: "Completa todos los campos.",
      invalidEmail: "Ingresa un correo electrónico válido.",
      passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
      orgNameRequired: "Ingresa el nombre de la organización.",
      invalidCredentials: "Correo o contraseña incorrectos.",
      emailNotConfirmed: "Confirma tu correo antes de iniciar sesión.",
      rateLimited: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
      inviteInvalid: "Esta invitación no es válida o ya se utilizó.",
      inviteExpired: "Esta invitación ha expirado.",
      inviteEmailMismatch: "Esta invitación se envió a otro correo electrónico.",
    },
  },
};

export default es;
