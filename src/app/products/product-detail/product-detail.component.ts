import { Component, computed, inject } from '@angular/core';

import { NgIf, NgFor, CurrencyPipe, AsyncPipe } from '@angular/common';
import { Product } from '../product';
import { EMPTY, catchError } from 'rxjs';
import { ProductService } from '../product.service';
import { CartService } from '../../cart/cart.service';

@Component({
    selector: 'pm-product-detail',
    templateUrl: './product-detail.component.html',
    standalone: true,
    imports: [AsyncPipe, NgIf, NgFor, CurrencyPipe]
})
export class ProductDetailComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  // Product to display
  product = this.productService.product;
  errorMessage = this.productService.productError;

  // Set the page title
  pageTitle = computed(() => this.product()
    ? `Product Detail for: ${this.product()?.productName}`
    : 'Product Detail');

  // TODO: if the same product is added which is already in the cart, increment its quantity instead
  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }
}