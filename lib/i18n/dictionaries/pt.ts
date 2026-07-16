import type { Dictionary } from "./en";

/** Portuguese dictionary. Must mirror the shape of en.ts (Dictionary). */
export const pt: Dictionary = {
  common: {
    appName: "Sprintal",
    loading: "Carregando…",
    save: "Salvar",
    cancel: "Cancelar",
  },
  nav: {
    portfolio: "Portfólio",
    bets: "Apostas",
    signals: "Sinais",
    settings: "Configurações",
  },
  auth: {
    common: {
      email: "E-mail",
      password: "Senha",
      or: "ou",
      continue: "Continuar",
    },
    login: {
      title: "Entre no Sprintal",
      subtitle: "Bem-vindo de volta.",
      submit: "Entrar",
      google: "Continuar com o Google",
      forgotPassword: "Esqueceu a senha?",
      noAccount: "Não tem uma conta?",
      signUpLink: "Crie uma",
    },
    signup: {
      title: "Crie seu espaço de trabalho",
      subtitle: "Comece seu teste de 30 dias. Sem cartão.",
      orgNameLabel: "Nome da organização",
      submit: "Criar conta",
      google: "Cadastrar com o Google",
      haveAccount: "Já tem uma conta?",
      loginLink: "Entrar",
      checkEmail:
        "Quase lá — confira seu e-mail para confirmar sua conta e depois entre.",
    },
    forgot: {
      title: "Redefina sua senha",
      subtitle: "Digite seu e-mail e enviaremos um link de redefinição.",
      submit: "Enviar link",
      backToLogin: "Voltar para entrar",
      sent: "Se existir uma conta para esse e-mail, o link está a caminho.",
    },
    setPassword: {
      title: "Defina sua senha",
      subtitle: "Escolha uma senha para concluir a configuração da sua conta.",
      submit: "Salvar senha",
      success: "Senha salva. Redirecionando…",
    },
    invite: {
      title: "Você foi convidado",
      validating: "Verificando seu convite…",
      joinPrompt: "Você foi convidado para entrar em {org} como {role}.",
      accept: "Aceitar convite",
      signInPrompt: "Entre como {email} para aceitar.",
      signInLink: "Entrar",
      createPrompt: "Crie uma conta para {email} para aceitar.",
      createLink: "Criar conta",
      wrongAccount:
        "Você está conectado com outra conta. Entre como {email} para aceitar este convite.",
      invalidTitle: "Este convite não é válido",
      invalidBody: "O link do convite é inválido ou já foi usado.",
      expiredBody: "Este convite expirou. Peça a um administrador para reenviá-lo.",
    },
    errors: {
      generic: "Algo deu errado. Tente novamente.",
      missingFields: "Preencha todos os campos.",
      invalidEmail: "Digite um e-mail válido.",
      passwordTooShort: "A senha deve ter pelo menos 8 caracteres.",
      orgNameRequired: "Digite o nome da organização.",
      invalidCredentials: "E-mail ou senha inválidos.",
      emailNotConfirmed: "Confirme seu e-mail antes de entrar.",
      rateLimited: "Muitas tentativas. Aguarde um momento e tente novamente.",
      inviteInvalid: "Este convite é inválido ou já foi usado.",
      inviteExpired: "Este convite expirou.",
      inviteEmailMismatch: "Este convite foi enviado para outro e-mail.",
    },
  },
};

export default pt;
