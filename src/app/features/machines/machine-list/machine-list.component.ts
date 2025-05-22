import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from "@angular/forms";

import { ApiService } from '../../../core/services/api.service';
import { Machine, MachineStatus } from '../../../core/models/machine.model';
import { sign } from 'crypto';

@Component({
  selector: 'app-machine-list',
  imports: [ CommonModule, RouterLink, FormsModule ],
  templateUrl: './machine-list.component.html',
  styleUrl: './machine-list.component.scss'
})
export class MachineListComponent implements OnInit {

  searchTerm = signal("");
  filteredMachines = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.apiService.machines().filter(machine =>
      machine.name.toLowerCase().includes(term) ||
      machine.details.manufacturer.toLowerCase().includes(term) ||
      machine.details.modelNumber.toLowerCase().includes(term)
    );
  });

  currentPage = signal(1);
  itemsPerPage = signal(10);
  paginatedMachines = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredMachines().slice(start, end);
  });
  totalPages = computed(() => Math.ceil(this.filteredMachines().length / this.itemsPerPage()));

  public MachineStatus = MachineStatus;

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    // Load all machines on startup
    this.apiService.getMachines().subscribe({
      next: () => console.log('All machines loaded'),
      error: (error) => console.error('Failed to load: ', error)
    });
  }

  // delete machine
  deleteMachine(id: string): void {
    if (confirm('Are you sure you want to delete this machine?')) {
      this.apiService.deleteMachine(id).subscribe({
        next: () => {
          console.log(`Machine with ID ${id} deleted successfully.`);
        },
        error: (err) => {
          console.error(`Failed to delete machine with ID ${id}:`, err);
        }
      });
    }
  }

  // edit machine
  editMachine(id: string): void {
    this.router.navigate(['/machines', id, 'edit']);
  }

  // add machine
  addMachine(): void {
    this.router.navigate(['/machines/new']);
  }

  // pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  trackByMachineId(index: number, machine: Machine): string {
    return machine.id;
  }

}
