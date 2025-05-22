import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import  { Machine } from "../models/machine.model";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl: string = "http://ng-demo-api.opten.io/api/machines";

  private _machines = signal<Machine[]>([]);
  readonly machines: WritableSignal<Machine[]> = this._machines

  constructor(private http: HttpClient) { }
  
  // get all machines
  getMachines(): Observable<Machine[]> {
    return this.http.get<Machine[]>(this.apiUrl).pipe(
      tap(data => this._machines.set(data)),
      catchError(this.handleError)
    );
  }

  // get machine by id
  getMachineById(id: string): Observable<Machine> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Machine>(url).pipe(
      catchError(this.handleError)
    );
  }

  // add a new machine
  addMachine(machine: Machine): Observable<Machine> {
    return this.http.post<Machine>(this.apiUrl, machine).pipe(
      tap(newMachine => this._machines.update(
        machines => [...machines, newMachine])
      ),
      catchError(this.handleError)
    );
  }

  // update an existing machine
  updateMachine(id: string, machine: Machine): Observable<Machine> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Machine>(url, machine).pipe(
      tap(updateMachine => {
        this._machines.update(machines => machines.map(m => m.id === updateMachine.id ? updateMachine : m));
      }),
      catchError(this.handleError)
    );
  }

  // delete an existing machine
  deleteMachine(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => { 
          this._machines.update(machines => machines.filter(m => m.id !== id))
        }
      ),
      catchError(this.handleError)
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

