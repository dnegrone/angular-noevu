// src/app/features/machines/machine-details/machine-details.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { Machine, MachineStatus } from '../../../core/models/machine.model';
import { SpinnerComponent } from "../../../shared/spinner/spinner.component";

@Component({
  selector: 'app-machine-details',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent],
  templateUrl: './machine-details.component.html',
  styleUrl: './machine-details.component.scss'
})
export class MachineDetailsComponent implements OnInit {
  machine = signal<Machine | null>(null);
  public MachineStatus = MachineStatus;
  public isLoading = inject(ApiService).isLoading;
  
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          console.log('Fetching machine details for ID:', id);
          return this.apiService.getMachineById(id);
        } else {
          console.warn('Machine ID not found in route parameters.');
          this.router.navigate(['/machines']);
          return EMPTY;
        }
      })
    ).subscribe({
      next: (machine) => {
        this.machine.set(machine);
        console.log('Machine details loaded:', machine);
      },
      error: (err) => {
        console.error('Failed to load machine details:', err);
        alert('Failed to load machine details. Please try again.');
        this.router.navigate(['/machines']);
      }
    });
  }

  editMachine(id: string): void {
    this.router.navigate(['/machines', id, 'edit']);
  }
}