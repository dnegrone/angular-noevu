import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Machine, MachineStatus, PerformanceLogEntry, ErrorEntry, ProductionInfo, MachineDetails, MaintenanceEntry, LiveSensorData, ShiftInfo } from "../models/machine.model";
import { provideHttpClient } from '@angular/common/http';

describe('ApiService', () => {
  let service: ApiService;
  let httpTestingController: HttpTestingController;

  const apiUrl = "http://ng-demo-api.opten.io/api/machines";

  // Mock data provided by API
  const mockMachines: Machine[] = [
    {
      id: "9c4d822e-58d1-4f9a-9f62-db19f506e171",
      name: "CNC Fräse 01",
      status: MachineStatus.Running,
      performance: 92,
      performanceLog: [],
      errors: [],
      errorHistory: [],
      producedParts: 1340,
      production: {
        currentProduct: "Wellenkupplung",
        partsInBatch: 100,
        partsCompleted: 65,
        batchStartTime: "2025-05-22T14:31:17.1772096Z"
      },
      details: {
        manufacturer: "Siemens",
        modelNumber: "SF-3000",
        lastMaintenance: "2025-05-10T14:31:17.1771657Z",
        location: "Werkstatt 1"
      },
      maintenanceHistory: [],
      liveSensors: {
        temperatureC: 0,
        vibrationLevel: 0,
        powerConsumptionKw: 0
      },
      currentShift: {
        operatorName: "Müller",
        shift: "Morning"
      }
    },
    {
      id: "477290d8-8bc4-4623-bfdc-706087f30adf",
      name: "Laser Cutter 12",
      status: MachineStatus.Offline,
      performance: 63,
      performanceLog: [],
      errors: ["Cooling system warning"],
      errorHistory: [
        {
          timestamp: "2025-05-22T11:31:17.1773204Z",
          errorCode: "E102",
          message: "Overheat warning",
          resolved: true
        }
      ],
      producedParts: 987,
      production: {
        currentProduct: "Gehäusedeckel",
        partsInBatch: 200,
        partsCompleted: 0,
        batchStartTime: "2025-05-22T14:31:17.1773757Z"
      },
      details: {
        manufacturer: "Trumpf",
        modelNumber: "LC-400",
        lastMaintenance: "2025-04-22T14:31:17.1773755Z",
        location: "Halle B"
      },
      maintenanceHistory: [],
      liveSensors: {
        temperatureC: 0,
        vibrationLevel: 0,
        powerConsumptionKw: 0
      },
      currentShift: {
        operatorName: "Schneider",
        shift: "Night"
      }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMachines', () => {
    it('should retrieve all machines and update the machines signal', (done) => {
      service.getMachines().subscribe(machines => {
        expect(machines).toEqual(mockMachines);
        done();
      });

      const req = httpTestingController.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockMachines);

      expect(service.machines()).toEqual(mockMachines);
    });

    it('should handle HTTP errors when getting machines', (done) => {
      const mockError = new ProgressEvent('error');
      const statusText = 'simulated network error';

      service.getMachines().subscribe({
        next: () => fail('should have failed with the network error'),
        error: (error) => {
          expect(error.message).toContain('simulated network error');
          done();
        }
      });

      const req = httpTestingController.expectOne(apiUrl);
      req.error(mockError, {status: 0, statusText: statusText});
    });
  });

  describe('getMachineById', () => {
    it('should retrieve a machine by its ID', (done) => {
      const machineId = '9c4d822e-58d1-4f9a-9f62-db19f506e171';
      const mockMachine = mockMachines[0];

      service.getMachineById(machineId).subscribe(machine => {
        expect(machine).toEqual(mockMachine);
        done();
      });

      const req = httpTestingController.expectOne(`${apiUrl}/${machineId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMachine);
    });
  });

  describe('addMachine', () => {
    it('should add a new machine and update the machines signal', (done) => {
      const newMachine: Machine = {
        id: "new-id",
        name: "New Machine",
        status: MachineStatus.Running,
        performance: 100,
        performanceLog: [],
        errors: [],
        errorHistory: [],
        producedParts: 0,
        production: {
          currentProduct: "Product A",
          partsInBatch: 50,
          partsCompleted: 0,
          batchStartTime: "2025-05-22T14:00:00Z"
        },
        details: {
          manufacturer: "Test",
          modelNumber: "T-100",
          lastMaintenance: "2025-05-01T00:00:00Z",
          location: "Lab"
        },
        maintenanceHistory: [],
        liveSensors: {
          temperatureC: 25,
          vibrationLevel: 1,
          powerConsumptionKw: 10
        },
        currentShift: {
          operatorName: "Tester",
          shift: "Day"
        }
      };

      service.getMachines().subscribe();
      httpTestingController.expectOne(apiUrl).flush([]);

      service.addMachine(newMachine).subscribe(addedMachine => {
        expect(addedMachine).toEqual(newMachine);
        done();
      });

      const req = httpTestingController.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newMachine);
      req.flush(newMachine);

      expect(service.machines()).toEqual([newMachine]);
    });
  });

  describe('updateMachine', () => {
    it('should update an existing machine and update the machines signal', (done) => {
      const updatedMachine: Machine = { ...mockMachines[0], name: 'Updated CNC Fräse 01', performance: 95 };

      service.getMachines().subscribe();
      httpTestingController.expectOne(apiUrl).flush(mockMachines);

      service.updateMachine(updatedMachine.id, updatedMachine).subscribe(machine => {
        expect(machine).toEqual(updatedMachine);
        done();
      });

      const req = httpTestingController.expectOne(`${apiUrl}/${updatedMachine.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedMachine);
      req.flush(updatedMachine);

      expect(service.machines()).toEqual([updatedMachine, mockMachines[1]]);
    });
  });

  describe('deleteMachine', () => {
    it('should delete a machine and remove it from the machines signal', (done) => {
      const machineToDeleteId = mockMachines[0].id;

      service.getMachines().subscribe();
      httpTestingController.expectOne(apiUrl).flush(mockMachines);

      service.deleteMachine(machineToDeleteId).subscribe(() => {
        done();
      });

      const req = httpTestingController.expectOne(`${apiUrl}/${machineToDeleteId}`);
      expect(req.request.method).toBe('DELETE');

      // Undocumented 204 status from API
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(service.machines()).toEqual([mockMachines[1]]);
    });
  });
});
