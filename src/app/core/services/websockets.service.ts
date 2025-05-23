import { Injectable } from '@angular/core';
import { EMPTY, Subject, Observable, timer } from "rxjs";
import { catchError, tap, retry } from "rxjs/operators";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Machine } from '../models/machine.model';


@Injectable({
  providedIn: 'root'
})
export class WebsocketsService {

  private wsUrl = 'ws://ng-demo-api.opten.io/socket';

  private websocket$: WebSocketSubject<any> | null = null;
  private reconnectInterval = 5000;

  private _machineUpdates = new Subject<Partial<Machine>>();
  public readonly machineUpdates$: Observable<Partial<Machine>> = this._machineUpdates.asObservable();

  constructor() {
    console.log('ApiService: Constructor called.');
    this.connectWebSocket();
    console.log('ApiService: connectWebSocket() called from constructor.'); 
  }

  // connecting to websocket
  private connectWebSocket(): void {
    if (this.websocket$ && !this.websocket$.closed) {
      console.log('WebSocket already connected or connecting.');
      return;
    }

    console.log('Attempting to connect to WebSocket...');
    this.websocket$ = webSocket({
      url: this.wsUrl,
      deserializer: msg => JSON.parse(msg.data)
    });

    this.websocket$.pipe(
      retry({
        count: 5,
        delay: (error, retryCount) => {
          console.error(`WebsocketsService: WebSocket error (${retryCount} attempt), attempting to reconnect:`, error);
          return timer(this.reconnectInterval);
        }
      }),
      tap(message => this.handleWebSocketMessage(message)),
      catchError(err => {
        console.error('WebSocket connection failed:', err);
        return EMPTY;
      })
    ).subscribe({
      next: (msg) => console.log('WebSocket stream next (should not be reached for tap-only)', msg),
      error: (err) => console.error('WebSocket subscription error:', err),
      complete: () => console.warn('WebSocket connection closed, attempting to reconnect...')
    });
  }

  private handleWebSocketMessage(message: any): void {
    console.log('WebSocket message received:', message);

    if (message && message.id) {
      this._machineUpdates.next(message as Partial<Machine>);
        console.log('WebsocketsService: Emitting machine update for ID:', message.id);
    }
    else {
      console.warn('WebSocket message has no ID or is malformed:', message);
    }
  }
}
