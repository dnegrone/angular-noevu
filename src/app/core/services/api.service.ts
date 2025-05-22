import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from "rxjs";
import { catchError, tap, finalize } from "rxjs/operators";
import  { Machine } from "../models/machine.model";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl: string = "http://ng-demo-api.opten.io/api/machines";

  private _machines = signal<Machine[]>([]);
  public readonly machines: WritableSignal<Machine[]> = this._machines;

  private _isLoading: WritableSignal<boolean> = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  constructor(private http: HttpClient) { }
  
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

