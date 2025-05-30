import { Routes } from '@angular/router';
import { MachineListComponent } from './machine-list/machine-list.component';
import { MachineFormComponent } from './machine-form/machine-form.component';
import { MachineDetailsComponent } from './machine-details/machine-details.component';

export const MACHINE_ROUTES: Routes = [
  {
    path: '',
    component: MachineListComponent
  },
  {
    path: 'new',
    component: MachineFormComponent
  },
  {
    path: ':id/edit',
    component: MachineFormComponent
  },
  {
    path: ':id',
    component: MachineDetailsComponent
  }
];