import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { WebCameraComponent } from './web-camera.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [WebCameraComponent],
  exports: [WebCameraComponent],
})
export class WebCameraModule {}
