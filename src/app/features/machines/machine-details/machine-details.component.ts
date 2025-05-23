// src/app/features/machines/machine-details/machine-details.component.ts
import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { Machine, MachineStatus } from '../../../core/models/machine.model';
import { SpinnerComponent } from "../../../shared/spinner/spinner.component";

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import 'chart.js/auto';

@Component({
  selector: 'app-machine-details',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, BaseChartDirective],
  templateUrl: './machine-details.component.html',
  styleUrl: './machine-details.component.scss'
})
export class MachineDetailsComponent implements OnInit {
  machine = signal<Machine | null>(null);
  public MachineStatus = MachineStatus;
  public apiService = inject(ApiService);

  // Graph Properties
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [], // Performance data
        label: 'Performance (%)',
        backgroundColor: 'rgba(148,159,177,0.2)',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        fill: 'origin',
      }
    ],
    labels: [] // Time and index
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.5
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Sample History'
        }
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Performance (%)'
        },
        ticks: {
          stepSize: 10
        }
      }
    },
    plugins: {
      legend: {
        display: true
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  public lineChartType: 'line' = 'line';
  
  constructor(private route: ActivatedRoute, private router: Router) {
    effect(() => {
      const currentMachine = this.machine();
      if (currentMachine) {
        this.updateChartData(currentMachine);
      }

      // const allMachines = this.apiService.machines();
      // const currentDetailMachine = this.machine();
      // if (allMachines && currentDetailMachine) {
      //   const updateFromWebSocket = allMachines.find(m => m.id === currentDetailMachine.id);
      //   if (updateFromWebSocket && updateFromWebSocket !== currentDetailMachine) {
      //     this.machine.set(updateFromWebSocket)
      //   }
      // }
    });
  }

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

  private updateChartData(machine: Machine): void {
    if (machine && machine.performanceLog && machine.performanceLog.length > 0) {
      const performanceValues = machine.performanceLog.map(log => log.performance);
      const labels = machine.performanceLog.map((log, index) => `Sample ${index + 1}`);

      this.lineChartData = {
        ...this.lineChartData,
        datasets: [{ ...this.lineChartData.datasets[0], data: performanceValues }],
        labels: labels
      };
      console.log('Chart updated for machine: ', machine.name);
    }
    else {
      this.lineChartData = {
        ...this.lineChartData,
        datasets: [{ ...this.lineChartData.datasets[0], data: [] }],
        labels: []
      };
      console.log('No performance log for machine: ', machine.name);
    }
  }

  editMachine(id: string): void {
    this.router.navigate(['/machines', id, 'edit']);
  }
}