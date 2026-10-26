import { IonicModule } from '@ionic/angular';

import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Tab2Page } from './tab2.page';

import { AppHeaderModule } from '../components/app-header/app-header.module';

import { ContinentFilterModule } from '../components/continent-filter/continent-filter.module';



import { Tab2PageRoutingModule } from './tab2-routing.module';



@NgModule({

  imports: [

    IonicModule,

    CommonModule,

    FormsModule,

    AppHeaderModule,

    ContinentFilterModule,

    Tab2PageRoutingModule

  ],

  declarations: [Tab2Page]

})

export class Tab2PageModule {}

