import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  mostrarPassword = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  /**
   * @function iniciarSesion
   * @description Valida credenciales, ejecuta login y resuelve pasos de confirmacion pendientes.
   * @returns `void`.
   */
  //Método que se ejecuta cuando el usuario intenta iniciar sesión.
  async iniciarSesion(): Promise<void> {
    if (!this.email || !this.password) {
      await this.mostrarToast('Completa email y contraseña.', 'warning');
      return;
    }
    //Crea un indicador de carga.
    const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...' });//está creando un indicador de carga con el mensaje "Iniciando sesión...".
    await loading.present(); //Muestra el indicador de carga.

    try {
      //Intenta iniciar sesión con el servicio de autenticación de amplify.
      const resultado = await this.authService.login(this.email, this.password);

      if (resultado === 'CONFIRM_SIGN_UP') {
        await this.mostrarToast('Tu cuenta no está confirmada. Ingresá el código.', 'warning');
        this.router.navigate(['/register'], { //está navegando a la página de registro con parámetros de consulta que incluyen el correo electrónico del usuario y un paso de confirmación.
          queryParams: { email: this.email, step: 'confirm' },
        });
        return;
      }

      await this.mostrarToast('¡Bienvenido!', 'success'); //está mostrando un mensaje de bienvenida al usuario.
      this.router.navigate(['/tabs/explorar']); //Está navegando a la página principal de la aplicación después de un inicio de sesión exitoso.
    } catch (error) {
      const mensaje = this.obtenerMensajeError(error);
      if (
        mensaje.includes('confirmar tu cuenta') ||//está verificando si el mensaje de error contiene indicaciones de que la cuenta del usuario no está confirmada, ya sea en español o en inglés.
        mensaje.toLowerCase().includes('not confirmed')//está verificando si el mensaje de error contiene indicaciones de que la cuenta del usuario no está confirmada, ya sea en español o en inglés.
      ) {
        await this.mostrarToast('Tu cuenta no está confirmada. Ingresá el código.', 'warning');
        this.router.navigate(['/register'], {
          queryParams: { email: this.email, step: 'confirm' },
        });
        return;
      }
      await this.mostrarToast(mensaje, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * @function olvidastePassword
   * @description Inicia el flujo de recuperacion de contrasena mediante codigo.
   * @returns `void`.
   */
  async olvidastePassword(): Promise<void> {
    if (!this.email) {
      await this.mostrarToast('Ingresa tu email primero.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({//está creando un cuadro de alerta para confirmar la acción de recuperación de contraseña.
      header: 'Recuperar contraseña',
      message: `Enviaremos un código a ${this.email}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async () => {//está manejando la acción de enviar el código de recuperación de contraseña.
            const loading = await this.loadingCtrl.create({ message: 'Enviando código...' });//está creando un indicador de carga con el mensaje "Enviando código...".
            await loading.present();//Muestra el indicador de carga.
            try {
              const msg = await this.authService.forgotPassword(this.email);/*está llamando al método `forgotPassword` del servicio de autenticación para enviar el 
              código de recuperación de contraseña al correo electrónico del usuario.*/
              await this.mostrarToast(msg, 'success');//está mostrando un mensaje de éxito al usuario indicando que el código ha sido enviado.
              await this.mostrarAlertaNuevaPassword();/*está llamando a un método privado `mostrarAlertaNuevaPassword` que probablemente muestra un cuadro de alerta 
              para que el usuario ingrese el código recibido y establezca una nueva contraseña.*/
            } catch (error) {
              await this.mostrarToast(this.obtenerMensajeError(error), 'danger');
            } finally {
              await loading.dismiss();
            }
          },
        },
      ],
    });
    await alert.present();//Muestra el cuadro de alerta al usuario.
  }

  /**
   * @function irARegistro
   * @description Navega a la pantalla de registro de cuenta.
   * @returns `void`.
   */
  irARegistro(): void {
    this.router.navigate(['/register']);
  }

  /**
   * @function togglePassword
   * @description Alterna visibilidad del campo contrasena en el formulario.
   * @returns `void`.
   */
  // Alterna el estado de mostrarPassword para cambiar el tipo del input de contraseña.
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * @function mostrarAlertaNuevaPassword
   * @description Muestra modal para confirmar codigo de recuperacion y definir nueva contrasena.
   * @returns `void`.
   */
  // Muestra un alert con inputs para código y nueva contraseña, maneja confirmación de cambio.
  private async mostrarAlertaNuevaPassword(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Nueva contraseña',
      inputs: [
        { name: 'code', type: 'text', placeholder: 'Código recibido' },
        { name: 'password', type: 'password', placeholder: 'Nueva contraseña' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async (data) => {
            if (!data?.code || !data?.password) {
              await this.mostrarToast('Completa código y nueva contraseña.', 'warning');
              return false;
            }
            try {
              await this.authService.confirmForgotPassword(
                this.email,
                data.code,
                data.password
              );
              await this.mostrarToast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
              return true;
            } catch (error) {
              await this.mostrarToast(this.obtenerMensajeError(error), 'danger');
              return false;
            }
          },
        },
      ],
    });
    await alert.present();
  }

  /**
   * @function mostrarToast
   * @description Presenta notificaciones breves de feedback al usuario.
   * @param message Texto del mensaje.
   * @param color Tipo visual del mensaje.
   * @returns `void`.
   */
  private async mostrarToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      color,
      position: 'top',
    });
    await toast.present();
  }

  /**
   * @function obtenerMensajeError
   * @description Estandariza diferentes formatos de error en un mensaje legible.
   * @param error Error recibido en bloques `catch`.
   * @returns Mensaje final para mostrar en UI.
   */
  private obtenerMensajeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: string }).message);
    }
    return 'Ocurrió un error inesperado.';
  }
}
