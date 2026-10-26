import { Injectable } from '@angular/core';
import {
  autoSignIn,
  confirmResetPassword,
  confirmSignUp,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

export interface UserProfile {
  userId: string;
  email: string;
}

/**
 * Servicio central de auth.
 * Encapsula el flujo de registro, login, recuperacion y cierre de sesion con Amplify Auth.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * @function isAuthenticated
   * @description Verifica si hay un usuario autenticado en la sesion actual.
   * @returns `true` si existe usuario logueado; `false` en caso contrario.
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @function login
   * @description Inicia sesion y resuelve pasos intermedios requeridos por Cognito.
   * @param email Email ingresado por el usuario.
   * @param password Contrasena del usuario.
   * @returns `CONFIRM_SIGN_UP` cuando la cuenta aun no esta confirmada, o `void` cuando el login finaliza.
   */
  async login(email: string, password: string): Promise<'CONFIRM_SIGN_UP' | void> {
    const { isSignedIn, nextStep } = await signIn({
      username: email.trim(),
      password,
    });

    if (isSignedIn || nextStep.signInStep === 'DONE') {
      return;
    }

    if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
      return 'CONFIRM_SIGN_UP';
    }

    throw new Error(this.mapSignInStep(nextStep.signInStep));
  }

  /**
   * @function register
   * @description Registra una cuenta nueva y determina si requiere confirmacion por codigo.
   * @param email Email del nuevo usuario.
   * @param password Contrasena definida por el usuario.
   * @returns Estado del registro y pista de entrega del codigo cuando corresponde.
   */
  async register(
    email: string,
    password: string
  ): Promise<{ status: 'CONFIRM_SIGN_UP' | 'DONE'; deliveryHint?: string }> {
    const { isSignUpComplete, nextStep } = await signUp({
      username: email.trim(),
      password,
      options: {
        userAttributes: {
          email: email.trim(),
        },
        autoSignIn: true,
      },
    });

    if (isSignUpComplete) {
      return { status: 'DONE' };
    }

    if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
      await autoSignIn();
      return { status: 'DONE' };
    }

    const deliveryDetails =
      nextStep.signUpStep === 'CONFIRM_SIGN_UP' ? nextStep.codeDeliveryDetails : undefined;

    return {
      status: 'CONFIRM_SIGN_UP',
      deliveryHint: this.formatCodeDelivery(deliveryDetails),
    };
  }

  /**
   * @function confirmRegistration
   * @description Confirma la cuenta usando el codigo recibido por email y completa auto-login cuando aplica
   * @param email Email con el que se registro la cuenta.
   * @param code Codigo de verificacion enviado por Cognito.
   * @returns `void`.
   */
  async confirmRegistration(email: string, code: string): Promise<void> {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username: email.trim(),
      confirmationCode: code.trim(),
    });

    if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
      await autoSignIn();
    }
  }

  /**
   * @function isUsernameExistsError
   * @description Detecta errores equivalentes a "usuario ya existente" en diferentes formatos.
   * @param error Error original devuelto por la libreria o capa de negocio.
   * @returns `true` cuando el error indica que el email/usuario ya existe.
   */
  isUsernameExistsError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    const err = error as { name?: string; message?: string };
    return (
      err.name === 'UsernameExistsException' ||
      !!err.message?.toLowerCase().includes('already exists') ||
      !!err.message?.toLowerCase().includes('user already exists')
    );
  }

  /**
   * @function resendConfirmationCode
   * @description Reenvia el codigo de confirmacion para una cuenta pendiente de verificacion.
   * @param email Email del usuario a verificar.
   * @returns Mensaje con pista de destino del codigo si esta disponible.
   */
  async resendConfirmationCode(email: string): Promise<string | undefined> {
    const { destination, deliveryMedium } = await resendSignUpCode({
      username: email.trim(),
    });
    return this.formatCodeDelivery({ destination, deliveryMedium });
  }

  /**
   * @function forgotPassword
   * @description Inicia el flujo de recuperacion de contrasena.
   * @param email Email de la cuenta a recuperar.
   * @returns Mensaje de feedback con el destino del codigo.
   */
  async forgotPassword(email: string): Promise<string> {
    const { nextStep } = await resetPassword({ username: email.trim() });
    const details = nextStep.codeDeliveryDetails;
    if (!details) {
      return 'Se envió un código de verificación.';
    }
    return `Código enviado a ${details.destination}`;
  }

  /**
   * @function confirmForgotPassword
   * @description Confirma el cambio de contrasena con codigo de recuperacion.
   * @param email Email de la cuenta.
   * @param code Codigo de recuperacion enviado por Cognito.
   * @param newPassword Nueva contrasena elegida por el usuario.
   * @returns `void`.
   */
  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    await confirmResetPassword({
      username: email.trim(),
      confirmationCode: code.trim(),
      newPassword,
    });
  }

  /**
   * @function logout
   * @description Cierra la sesion activa del usuario autenticado.
   * @returns `void`.
   */
  async logout(): Promise<void> {
    await signOut();
  }

  /**
   * @function getCurrentUserProfile
   * @description Obtiene identificador y email del usuario autenticado.
   * @returns Perfil basico del usuario o `null` si no hay sesion activa.
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      return {
        userId: user.userId,
        email: attributes.email ?? user.username,
      };
    } catch {
      return null;
    }
  }

  /**
   * @function formatCodeDelivery
   * @description Genera un mensaje legible sobre donde fue enviado un codigo de verificacion.
   * @param details Metadatos de entrega provistos por Cognito.
   * @returns Mensaje para UI o `undefined` si no hay datos.
   */
  private formatCodeDelivery(details?: {
    destination?: string;
    deliveryMedium?: string;
  }): string | undefined {
    if (!details?.destination) {
      return undefined;
    }
    const medio =
      details.deliveryMedium === 'EMAIL'
        ? 'email'
        : details.deliveryMedium === 'SMS'
          ? 'SMS'
          : 'correo';
    return `Revisá tu ${medio} (incluido spam). Código enviado a ${details.destination}`;
  }

  /**
   * @function mapSignInStep
   * @description Traduce pasos tecnicos de inicio de sesion a mensajes de negocio para UI.
   * @param step Paso devuelto por Amplify Auth.
   * @returns Mensaje de error orientado al usuario.
   */
  private mapSignInStep(step: string): string {
    switch (step) {
      case 'CONFIRM_SIGN_UP':
        return 'Debes confirmar tu cuenta con el código enviado por email.';
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        return 'Debes cambiar tu contraseña temporal.';
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
      case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
        return 'Se requiere verificación adicional (MFA).';
      default:
        return 'No se pudo completar el inicio de sesión.';
    }
  }
}
