import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, combineLatest, filter, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Product } from './product';
import { HttpErrorService } from '../utilities/http-error.service';
import { ReviewService } from '../reviews/review.service';
import { Review } from '../reviews/review';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Result } from '../utilities/result';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  private reviewService = inject(ReviewService);

  private productSelectedSubject = new BehaviorSubject<number | undefined>(undefined);
  readonly productSelected$ = this.productSelectedSubject.asObservable();
  selectedProductId = signal<number | undefined>(undefined);

  readonly productsResult$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      map(p => ({ data: p } as Result<Product[]>)),
      // tap(() => console.log("In http.get pipeline")),
      shareReplay(1),
      catchError(err => of({
        data: [],
        error: this.errorService.formatError(err)
      } as Result<Product[]>))
    );

  private productsResult = toSignal(this.productsResult$,
    { initialValue: ({ data: [] }) as Result<Product[]> });

  products = computed(() => this.productsResult().data);
  productsError = computed(() => this.productsResult().error);

  private productResult$ = toObservable(this.selectedProductId)
    .pipe(
      filter(Boolean),
      switchMap(id => {
        const productUrl = `${this.productsUrl}/${id}`;

        return this.http.get<Product>(productUrl)
          .pipe(
            // tap(() => console.log("In http.get by id pipeline")),
            switchMap(product => this.getProductWithReviews(product)), // concatMap, mergeMap, switchMap (this cancels prior sub and only returns the new sub from the method)
            catchError(err => of({
              data: undefined,
              error: this.errorService.formatError(err)
            } as Result<Product>))
          );
      }),
      map(p => ({ data: p } as Result<Product>))
    );
  private productResult = toSignal(this.productResult$);
  product = computed(() => this.productResult()?.data);
  productError = computed(() => this.productResult()?.error);

  productSelected(selectedProductId: number): void {
    this.selectedProductId.set(selectedProductId);
  }

  private getProductWithReviews(product: Product): Observable<Product> {
    if (product.hasReviews) {
      return this.http.get<Review[]>(this.reviewService.getReviewUrl(product.id))
        .pipe(
          map(reviews => ({ ...product, reviews } as Product))
        );
    } else {
      return of(product);
    }
  }
}