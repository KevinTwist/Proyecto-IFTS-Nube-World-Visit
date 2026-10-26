import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  email = '';
  password = '';
  confirmPassword = '';
  confirmationCode = '';
  mostrarPassword = false;
  mostrarConfirmPassword = false;
  paso: 'form' | 'confirm' = 'form';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  /**
   * @function ngOnInit
   * @description Inicializa email y paso de registro segun query params recibidos por navegacion.
   * @returns `void`.
   */
  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const step = this.route.snapshot.queryParamMap.get('step');

    if (email) {
      this.email = email;
    }
    if (step === 'confirm' && this.email) {
      this.paso = 'confirm';
    }
  }

  /**
   * @function crearCuenta
   * @description Ejecuta alta de usuario y decide si debe pasar al flujo de confirmacion por codigo.
   * @returns `void`.
   */
  async crearCuenta(): Promise<void> {
    if (!this.email || !this.password) {
      await this.mostrarToast('Completa email y contraseña.', 'warning');
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.mostrarToast('Las contraseñas no coinciden.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();

    try {
      const resultado = await this.authService.register(this.email, this.password);

      if (resultado.status === 'DONE') {
        await this.mostrarToast('Cuenta creada. ¡Bienvenido!', 'success');
        this.router.navigate(['/tabs/explorar']);
        return;
      }

      await this.irPasoConfirmacion(
        resultado.deliveryHint ??
          'Te enviamos un código por email. Revisá también la carpeta de spam.'
      );
    } catch (error) {
      if (this.authService.isUsernameExistsError(error)) {
        await this.irPasoConfirmacion(
          'Ya existe una cuenta con ese email. Reenviamos el código de verificación.',
          true
        );
        return;
      }
      await this.mostrarToast(this.obtenerMensajeError(error), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * @function irAConfirmacionManual
   * @description Permite abrir manualmente el paso de confirmacion para usuarios ya registrados.
   * @returns `void`.
   */
  async irAConfirmacionManual(): Promise<void> {
    if (!this.email) {
      await this.mostrarToast('Ingresá tu email primero.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Preparando verificación...' });
    await loading.present();

    try {
      await this.irPasoConfirmacion(
        'Si ya te registraste, ingresá el código que te enviamos por email.',
        true
      );
    } catch (error) {
      await this.mostrarToast(this.obtenerMensajeError(error), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * @function confirmarCodigo
   * @description Confirma el registro de cuenta con el codigo ingresado por el usuario.
   * @returns `void`.
   */
  async confirmarCodigo(): Promise<void> {
    if (!this.confirmationCode) {
      await this.mostrarToast('Ingresa el código de verificación.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Confirmando cuenta...' });
    await loading.present();

    try {
      await this.authService.confirmRegistration(this.email, this.confirmationCode);
      await this.mostrarToast('Cuenta confirmada. ¡Bienvenido!', 'success');
      this.router.navigate(['/tabs/explorar']);
    } catch (error) {
      await this.mostrarToast(this.obtenerMensajeError(error), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * @function reenviarCodigo
   * @description Solicita un nuevo codigo de verificacion al email registrado.
   * @returns `void`.
   */
  async reenviarCodigo(): Promise<void> {
    if (!this.email) {
      await this.mostrarToast('Ingresá tu email.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Reenviando código...' });
    await loading.present();

    try {
      const hint = await this.authService.resendConfirmationCode(this.email);
      await this.mostrarToast(
        hint ?? 'Código reenviado. Revisá email y spam; puede tardar 1-2 minutos.',
        'success'
      );
    } catch (error) {
      await this.mostrarToast(this.obtenerMensajeError(error), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * @function volverAlFormulario
   * @description Regresa al formulario inicial de registro.
   * @returns `void`.
   */
  volverAlFormulario(): void {
    this.paso = 'form';
    this.confirmationCode = '';
  }

  /**
   * @function irALogin
   * @description Navega a la pantalla de inicio de sesion.
   * @returns `void`.
   */
  irALogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * @function togglePassword
   * @description Alterna visibilidad del campo contrasena principal.
   * @returns `void`.
   */
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * @function toggleConfirmPassword
   * @description Alterna visibilidad del campo de confirmacion de contrasena.
   * @returns `void`.
   */
  toggleConfirmPassword(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }

  /**
   * @function irPasoConfirmacion
   * @description Cambia a la vista de confirmacion y, opcionalmente, reenvia el codigo.
   * @param mensaje Texto de feedback para el usuario.
   * @param reenviarCodigo Indica si se debe intentar reenviar codigo automaticamente.
   * @returns `void`.
   */
  private async irPasoConfirmacion(mensaje: string, reenviarCodigo = false): Promise<void> {
    this.paso = 'confirm';

    if (!reenviarCodigo) {
      await this.mostrarToast(mensaje, 'success');
      return;
    }

    try {
      const hint = await this.authService.resendConfirmationCode(this.email);
      await this.mostrarToast(hint ?? mensaje, 'success');
    } catch {
      await this.mostrarToast(mensaje, 'success');
    }
  }

  /**
   * @function mostrarToast
   * @description Muestra mensajes rapidos en pantalla para confirmar acciones o errores.
   * @param message Mensaje a visualizar.
   * @param color Nivel visual del mensaje.
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
   * @description Traduce errores tecnicos de autenticacion a mensajes claros para el usuario final.
   * @param error Error capturado durante operaciones de registro/confirmacion.
   * @returns Mensaje listo para mostrarse en interfaz.
   */
  private obtenerMensajeError(error: unknown): string {
    const mensaje =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: string }).message)
          : 'Ocurrió un error inesperado.';

    if (mensaje.includes('uppercase')) {
      return 'La contraseña debe tener al menos una mayúscula.';
    }
    if (mensaje.includes('lowercase')) {
      return 'La contraseña debe tener al menos una minúscula.';
    }
    if (mensaje.includes('numeric') || mensaje.includes('number')) {
      return 'La contraseña debe tener al menos un número.';
    }
    if (mensaje.includes('symbol') || mensaje.includes('special character')) {
      return 'La contraseña debe tener al menos un símbolo (ej. ! @ #).';
    }
    if (mensaje.includes('not conform with policy') || mensaje.includes('Password')) {
      return 'La contraseña no cumple la política de Cognito (8+ caracteres, mayúscula, minúscula, número y símbolo).';
    }
    if (this.authService.isUsernameExistsError(error)) {
      return 'Ya existe una cuenta con ese email. Usá "Ingresar código de verificación".';
    }
    if (mensaje.includes('CodeMismatchException') || mensaje.includes('Invalid code')) {
      return 'Código incorrecto. Revisá el email o reenviá el código.';
    }
    if (mensaje.includes('ExpiredCodeException')) {
      return 'El código expiró. Tocá "Reenviar código".';
    }

    return mensaje;
  }
}
