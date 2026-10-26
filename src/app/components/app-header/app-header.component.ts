import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: false,
})
/**
 * Componente reutilizable de cabecera para vistas internas.
 * Permite parametrizar boton volver, logo y acciones al final de la barra.
 */
export class AppHeaderComponent {
  @Input() showBackButton = false;
  @Input() backHref = '/tabs/explorar';
  @Input() showLogo = true;
  @Input() hasEndActions = false;
}
