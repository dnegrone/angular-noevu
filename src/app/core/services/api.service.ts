import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, of, throwError, timer } from "rxjs";
import { catchError, tap, finalize, retryWhen, delay, take} from "rxjs/operators";
import  { Machine, MachineStatus } from "../models/machine.model";
// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl: string = "http://ng-demo-api.opten.io/api/machines";
  private wsUrl = 'ws://ng-demo-api.opten.io/socket';

  private _machines = signal<Machine[]>([]);
  public readonly machines: WritableSignal<Machine[]> = this._machines;

  private _isLoading: WritableSignal<boolean> = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  // private websocket$: WebSocketSubject<any> | null = null;
  // private reconnectInterval = 5000;

  constructor(private http: HttpClient) {
    console.log('ApiService: Constructor called.');
    // this.connectWebSocket();
    this.simulateWebSocketUpdates();
    console.log('ApiService: connectWebSocket() called from constructor.'); 
  }
  
  // get all machines
  getMachines(): Observable<Machine[]> {
    this._isLoading.set(true);
    return this.http.get<Machine[]>(this.apiUrl).pipe(
      tap(data => {
        this._machines.set(data);
        console.log('API Service: Machines fetched and signal updated.', data);
      }),
      catchError(this.handleError),
      finalize(() => this._isLoading.set(false))
    );
  }

  // get machine by id
  getMachineById(id: string): Observable<Machine> {
    this._isLoading.set(true);
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Machine>(url).pipe(
      catchError(this.handleError),
      finalize(() => this._isLoading.set(false))
    );
  }

  // add a new machine
  addMachine(machine: Machine): Observable<Machine> {
    this._isLoading.set(true);
    return this.http.post<Machine>(this.apiUrl, machine).pipe(
      tap(newMachine => this._machines.update(
        machines => [...machines, newMachine])
      ),
      catchError(this.handleError),
      finalize(() => this._isLoading.set(false))
    );
  }

  // update an existing machine
  updateMachine(id: string, machine: Machine): Observable<Machine> {
    this._isLoading.set(true);
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Machine>(url, machine).pipe(
      tap(updateMachine => {
        this._machines.update(machines => machines.map(m => m.id === updateMachine.id ? updateMachine : m));
      }),
      catchError(this.handleError),
      finalize(() => this._isLoading.set(false))
    );
  }

  // delete an existing machine
  deleteMachine(id: string): Observable<void> {
    this._isLoading.set(true);
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => { 
          this._machines.update(machines => machines.filter(m => m.id !== id))
        }
      ),
      catchError(this.handleError),
      finalize(() => this._isLoading.set(false))
    );
  }

  // connecting to websocket
  // private connectWebSocket(): void {
  //   if (this.websocket$ && !this.websocket$.closed) {
  //     console.log('WebSocket already connected or connecting.');
  //     return;
  //   }

  //   console.log('Attempting to connect to WebSocket...');
  //   this.websocket$ = webSocket({
  //     url: this.wsUrl,
  //     deserializer: msg => JSON.parse(msg.data)
  //   });

  //   this.websocket$.pipe(
  //     retryWhen(errors =>
  //       errors.pipe(
  //         tap(err => console.error('WebSocket error, attempting to reconnect:', err)),
  //         delay(this.reconnectInterval)
  //       )
  //     ),
  //     tap(message => this.handleWebSocketMessage(message)),
  //     catchError(err => {
  //       console.error('WebSocket connection failed:', err);
  //       return EMPTY;
  //     })
  //   ).subscribe({
  //     next: () => console.log('WebSocket stream next (should not be reached for tap-only)'),
  //     error: (err) => console.error('WebSocket subscription error:', err),
  //     complete: () => console.warn('WebSocket connection closed, attempting to reconnect...')
  //   });
  // }

  // private handleWebSocketMessage(message: any): void {
  //   console.log('WebSocket message received:', message);

  //   if (this._machines().length === 0) {
  //     console.warn('Machines list not yet loaded. Skipping WebSocket update.');
  //     return;
  //   }

  //   if (message && message.id) {
  //     this._machines.update(currentMachines => {
  //       const updatedMachine = currentMachines.map(m => {
  //         if (m.id === message.id) {
  //           return { ...m, ...message };
  //         }
  //         return m;
  //       });
  //       console.log('Machines signal updated via WebSocket for ID:', message.id);
  //       return updatedMachine;
  //     });
  //   } else {
  //     console.warn('WebSocket message has no ID or is malformed:', message);
  //   }
  // }

  private simulateWebSocketUpdates(): void {
    setInterval(() => {
      const currentMachines = this._machines();
      if (currentMachines.length === 0) {
        console.warn('Simulation: No machines loaded yet to simulate updates.');
        return;
      }

      const randomIndex = Math.floor(Math.random() * currentMachines.length);
      const machineToUpdate = { ...currentMachines[randomIndex] };

      machineToUpdate.performance = Math.floor(Math.random() * 100);
      const statuses = [MachineStatus.Running, MachineStatus.Error, MachineStatus.Offline, MachineStatus.Maintenance];
      machineToUpdate.status = statuses[Math.floor(Math.random() * statuses.length)];

      machineToUpdate.producedParts = (machineToUpdate.producedParts || 0) + Math.floor(Math.random() * 5) + 1;

      this._machines.update(machines =>
        machines.map(m => (m.id === machineToUpdate.id ? machineToUpdate : m))
      );

      console.log(`Simulation: Machine ${machineToUpdate.name} (${machineToUpdate.id.substring(0, 8)}...) updated: Performance=${machineToUpdate.performance}%, Status=${MachineStatus[machineToUpdate.status]}, Parts=${machineToUpdate.producedParts}`);

    }, 3000);
  }

  // function to handle all errors
  private handleError(error: HttpErrorResponse) {
    let errorMessage = "An unknown error occurred!";
    if (error.error instanceof ErrorEvent) {
      // client side error
      errorMessage = `Error: ${error.error.message}`
    }
    else {
      // server side error
      errorMessage = `Server returned code: ${error.status}, error message: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

