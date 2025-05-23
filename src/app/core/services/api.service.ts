import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, of, throwError, timer } from "rxjs";
import { catchError, tap, finalize } from "rxjs/operators";
import { Machine, MachineStatus } from "../models/machine.model";
import { WebsocketsService } from './websockets.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl: string = "http://ng-demo-api.opten.io/api/machines";

  private _machines = signal<Machine[]>([]);
  public readonly machines: WritableSignal<Machine[]> = this._machines;

  private _isLoading: WritableSignal<boolean> = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  constructor(private http: HttpClient, private webSocketsService: WebsocketsService) {
    console.log('ApiService: Constructor called.');
    console.log('ApiService: WebSocket connection/simulation is handled by WebSocketsService.');

    this.webSocketsService.machineUpdates$.subscribe((update: Partial<Machine>) => {
      if (update && this._machines().length > 0) {
        this._machines.update((currentMachines: Machine[]) => {
          const updated = currentMachines.map((m: Machine) =>
            m.id === update.id ? { ...m, ...update } : m
          );
          return updated;
        });
        console.log('ApiService: Machines signal updated from WebSocketsService for ID:', update.id);
      } else if (update) {
        console.warn('ApiService: Received WebSocket update before machines were loaded. Skipping update.');
      }
    });
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

