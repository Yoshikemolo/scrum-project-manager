/**
 * WebSocket service for real-time communication with the server.
 * Handles connection management, reconnection, and message routing.
 */

import { Injectable, inject } from '@angular/core';
import { Subject, Observable, BehaviorSubject, timer, throwError } from 'rxjs';
import { retryWhen, tap, delayWhen, filter, map, takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface WebSocketMessage {
  event: string;
  data: any;
  timestamp?: Date;
}

export interface WebSocketConfig {
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  timeout: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly authService = inject(AuthService);
  
  // Connection state
  private readonly connectionSubject = new BehaviorSubject<boolean>(false);
  readonly connected$ = this.connectionSubject.asObservable();
  
  // Message streams
  private readonly messageSubject = new Subject<WebSocketMessage>();
  readonly message$ = this.messageSubject.asObservable();
  
  // Error stream
  private readonly errorSubject = new Subject<Error>();
  readonly error$ = this.errorSubject.asObservable();
  
  // Destroy subject
  private readonly destroy$ = new Subject<void>();
  
  // Configuration
  private readonly config: WebSocketConfig = {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  };
  
  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    
    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('Cannot connect to WebSocket: No authentication token');
      return;
    }
    
    this.socket = io(environment.wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      ...this.config
    });
    
    this.setupEventListeners();
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionSubject.next(false);
    }
  }
  
  /**
   * Send message to server
   */
  send(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }
    
    this.socket.emit(event, data);
  }
  
  /**
   * Listen to specific event
   */
  on<T = any>(event: string): Observable<T> {
    return this.message$.pipe(
      filter(msg => msg.event === event),
      map(msg => msg.data as T),
      takeUntil(this.destroy$)
    );
  }
  
  /**
   * Emit and wait for response
   */
  request<T = any>(event: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      this.socket.emit(event, data, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data as T);
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }
  
  /**
   * Join room
   */
  joinRoom(room: string): void {
    this.send('join', { room });
  }
  
  /**
   * Leave room
   */
  leaveRoom(room: string): void {
    this.send('leave', { room });
  }
  
  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectionSubject.next(true);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connectionSubject.next(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, manually reconnect
        this.reconnect();
      }
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.errorSubject.next(error);
    });
    
    // Message events
    this.socket.onAny((event: string, ...args: any[]) => {
      this.messageSubject.next({
        event,
        data: args[0],
        timestamp: new Date()
      });
    });
    
    // Specific event handlers
    this.setupApplicationEvents();
  }
  
  /**
   * Setup application-specific event handlers
   */
  private setupApplicationEvents(): void {
    if (!this.socket) return;
    
    // Task events
    this.socket.on('task:created', (data) => this.handleTaskEvent('created', data));
    this.socket.on('task:updated', (data) => this.handleTaskEvent('updated', data));
    this.socket.on('task:deleted', (data) => this.handleTaskEvent('deleted', data));
    this.socket.on('task:moved', (data) => this.handleTaskEvent('moved', data));
    
    // Sprint events
    this.socket.on('sprint:started', (data) => this.handleSprintEvent('started', data));
    this.socket.on('sprint:completed', (data) => this.handleSprintEvent('completed', data));
    this.socket.on('sprint:updated', (data) => this.handleSprintEvent('updated', data));
    
    // Comment events
    this.socket.on('comment:added', (data) => this.handleCommentEvent('added', data));
    this.socket.on('comment:updated', (data) => this.handleCommentEvent('updated', data));
    this.socket.on('comment:deleted', (data) => this.handleCommentEvent('deleted', data));
    
    // Notification events
    this.socket.on('notification:new', (data) => this.handleNotificationEvent('new', data));
    
    // Collaboration events
    this.socket.on('user:joined', (data) => this.handleUserEvent('joined', data));
    this.socket.on('user:left', (data) => this.handleUserEvent('left', data));
    this.socket.on('user:typing', (data) => this.handleUserEvent('typing', data));
  }
  
  /**
   * Handle task events
   */
  private handleTaskEvent(action: string, data: any): void {
    this.messageSubject.next({
      event: `task:${action}`,
      data,
      timestamp: new Date()
    });
  }
  
  /**
   * Handle sprint events
   */
  private handleSprintEvent(action: string, data: any): void {
    this.messageSubject.next({
      event: `sprint:${action}`,
      data,
      timestamp: new Date()
    });
  }
  
  /**
   * Handle comment events
   */
  private handleCommentEvent(action: string, data: any): void {
    this.messageSubject.next({
      event: `comment:${action}`,
      data,
      timestamp: new Date()
    });
  }
  
  /**
   * Handle notification events
   */
  private handleNotificationEvent(action: string, data: any): void {
    this.messageSubject.next({
      event: `notification:${action}`,
      data,
      timestamp: new Date()
    });
  }
  
  /**
   * Handle user events
   */
  private handleUserEvent(action: string, data: any): void {
    this.messageSubject.next({
      event: `user:${action}`,
      data,
      timestamp: new Date()
    });
  }
  
  /**
   * Reconnect to WebSocket server
   */
  private reconnect(): void {
    timer(this.config.reconnectionDelay)
      .pipe(
        tap(() => this.connect()),
        retryWhen(errors =>
          errors.pipe(
            delayWhen((_, index) => {
              const delay = Math.min(
                this.config.reconnectionDelay * Math.pow(2, index),
                this.config.reconnectionDelayMax
              );
              console.log(`Reconnecting in ${delay}ms...`);
              return timer(delay);
            }),
            tap((_, index) => {
              if (index >= this.config.reconnectionAttempts) {
                throw new Error('Maximum reconnection attempts reached');
              }
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => {
          console.error('Failed to reconnect:', error);
          this.errorSubject.next(error);
        }
      });
  }
  
  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
