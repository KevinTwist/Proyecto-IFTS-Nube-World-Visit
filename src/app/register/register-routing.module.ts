import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RegisterPage } from './register.page';
import { guestGuard } from '../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: RegisterPage,
    canActivate: [guestGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegisterPageRoutingModule {}
