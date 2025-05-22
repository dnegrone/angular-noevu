import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

import { ApiService } from '../../../core/services/api.service';
import { Machine, MachineStatus } from '../../../core/models/machine.model';

@Component({
  selector: 'app-machine-form',
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './machine-form.component.html',
  styleUrl: './machine-form.component.scss'
})
export class MachineFormComponent implements OnInit {

  machineForm!: FormGroup;
  isEditMode = signal(false);
  machineId: string | null = null;

  // Injections
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      this.machineId = params.get('id');
      if (this.machineId) {
        this.isEditMode.set(true);
        this.loadMachineData(this.machineId);
      }
      else {
        this.isEditMode.set(false);
      }
    });
  }

  private initForm(): void {
    this.machineForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      name: ['', Validators.required],
      status: [MachineStatus.Offline, Validators.required],
      performance: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      producedParts: [0, [Validators.required, Validators.min(0)]],
      production: this.fb.group({
        currentProduct: ['', Validators.required],
        partsInBatch: [0, [Validators.required, Validators.min(0)]],
        partsCompleted: [0, [Validators.required, Validators.min(0)]],
        batchStartTime: [new Date().toISOString().slice(0, 16), Validators.required],
      }),
      details: this.fb.group({
        manufacturer: ['', Validators.required],
        modelNumber: ['', Validators.required],
        lastMaintenance: [new Date().toISOString().slice(0, 16), Validators.required],
        location: ['', Validators.required],
      }),
    });
  }

  private loadMachineData(id: string): void {
    this.apiService.getMachineById(id).subscribe({
      next: (machine) => {
        const productionStartTime = machine.production.batchStartTime ?
          new Date(machine.production.batchStartTime).toISOString().slice(0, 16) : '';
        const lastMaintenanceTime = machine.details.lastMaintenance ?
          new Date(machine.details.lastMaintenance).toISOString().slice(0, 16) : '';

        this.machineForm.patchValue({
          id: machine.id,
          name: machine.name,
          status: machine.status,
          performance: machine.performance,
          producedParts: machine.producedParts,
          production: {
            currentProduct: machine.production.currentProduct,
            partsInBatch: machine.production.partsInBatch,
            partsCompleted: machine.production.partsCompleted,
            batchStartTime: productionStartTime,
          },
          details: {
            manufacturer: machine.details.manufacturer,
            modelNumber: machine.details.modelNumber,
            lastMaintenance: lastMaintenanceTime,
            location: machine.details.location,
          },
        });
      },
      error: (err) => {
        console.error('Failed to load machine data:', err);
        alert('Failed to load machine data. Please try again.');
        this.router.navigate(['/machines']);
      },
    });
  }

  onSubmit(): void {
    if (this.machineForm.valid) {
      const formValue = this.machineForm.getRawValue();

      const machineToSave: Machine = {
        id: this.isEditMode() ? formValue.id : uuidv4(), // Usa ID existente ou gera novo
        name: formValue.name,
        status: Number(formValue.status),
        performance: formValue.performance,
        producedParts: formValue.producedParts,
        production: {
          currentProduct: formValue.production.currentProduct,
          partsInBatch: formValue.production.partsInBatch,
          partsCompleted: formValue.production.partsCompleted,
          batchStartTime: new Date(formValue.production.batchStartTime).toISOString(),
        },
        details: {
          manufacturer: formValue.details.manufacturer,
          modelNumber: formValue.details.modelNumber,
          lastMaintenance: new Date(formValue.details.lastMaintenance).toISOString(),
          location: formValue.details.location,
        },

        performanceLog: [],
        errors: [],
        errorHistory: [],
        maintenanceHistory: [],
        liveSensors: {
          temperatureC: 0,
          vibrationLevel: 0,
          powerConsumptionKw: 0,
        },
        currentShift: {
          operatorName: '',
          shift: '',
        },
      };

      if (this.isEditMode()) {
        this.apiService.updateMachine(this.machineId!, machineToSave).subscribe({
          next: () => {
            alert('Machine updated successfully!');
            this.router.navigate(['/machines']);
          },
          error: (err) => {
            console.error('Failed to update machine:', err);
            alert('Failed to update machine. Please try again.');
          },
        });
      } else {
        this.apiService.addMachine(machineToSave).subscribe({
          next: () => {
            alert('Machine added successfully!');
            this.machineForm.reset();
            this.router.navigate(['/machines']);
          },
          error: (err) => {
            console.error('Failed to add machine:', err);
            alert('Failed to add machine. Please try again.');
          },
        });
      }
    } else {
      this.machineForm.markAllAsTouched();
      alert('Please fill out all required fields correctly.');
    }
  }

  hasError(controlName: string, errorType: string, parentGroup?: string): boolean {
    let control;
    if (parentGroup) {
      control = this.machineForm.get(parentGroup)?.get(controlName);
    } else {
      control = this.machineForm.get(controlName);
    }
    return !!(control?.invalid && (control?.dirty || control?.touched) && control?.errors?.[errorType]);
  }

  getErrorMessage(controlName: string, parentGroup?: string): string {
    let control;
    if (parentGroup) {
      control = this.machineForm.get(parentGroup)?.get(controlName);
    } else {
      control = this.machineForm.get(controlName);
    }

    if (control?.hasError('required')) {
      return 'This field is required.';
    }
    if (control?.hasError('min')) {
      return `Value must be at least ${control?.errors?.['min'].min}.`;
    }
    if (control?.hasError('max')) {
      return `Value must be at most ${control?.errors?.['max'].max}.`;
    }
    return '';
  }

  machineStatusOptions = Object.keys(MachineStatus)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      value: MachineStatus[key as keyof typeof MachineStatus],
      label: key
    }));

  goBack(): void {
    this.router.navigate(['/machines']);
  }

}
