import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DetailPageRoutingModule } from './detail-routing.module';
import { DetailPage } from './detail.page';
import { AppHeaderModule } from '../components/app-header/app-header.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AppHeaderModule,
    DetailPageRoutingModule,
  ],
  declarations: [DetailPage],
})
export class DetailPageModule {}
