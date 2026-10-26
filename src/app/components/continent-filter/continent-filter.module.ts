import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContinentFilterComponent } from './continent-filter.component';

@NgModule({
  imports: [CommonModule],
  declarations: [ContinentFilterComponent],
  exports: [ContinentFilterComponent],
})
export class ContinentFilterModule {}
