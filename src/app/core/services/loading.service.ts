import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private requestsAtivas = 0;

  readonly isLoading$: Observable<boolean> = this.loadingSubject.asObservable();

  show(): void {
    this.requestsAtivas++;
    if (this.requestsAtivas === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    if (this.requestsAtivas === 0) {
      return;
    }
    this.requestsAtivas--;
    if (this.requestsAtivas === 0) {
      this.loadingSubject.next(false);
    }
  }
}
