import { Subject , Subscription } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';

/**
 * unsubscribe all subscriptions in the component automatically
 * */
export function UnsubscribeAndCompleteObserversOnDestroy() {
	return function ( constructor ) {
		const origin                      = constructor.prototype.ngOnDestroy;
		constructor.prototype.ngOnDestroy = function () {
			for ( const prop in this ) {
				const property = this[ prop ];
				// if ( typeof property.unsubscribe === 'function' ) {
				// 	property.unsubscribe();
				// }

				if ( property instanceof Subscription ) {
					property.unsubscribe();
				}

				if ( property instanceof NotificationService ) {
					property.closeSideNavigationMenu( 'force close' );
				}

				if ( prop === '__observableCloser$' && property instanceof Subject ) {
					property.next( 'close' );
					property.complete();
				}
			}
			if ( origin ) {
				origin.apply();
			}
		};
	};
}

export function CloseSideMenuOnDestroy() {
	return function ( constructor ) {
		const origin                      = constructor.prototype.ngOnDestroy;
		constructor.prototype.ngOnDestroy = function () {
			for ( const prop in this ) {
				const property = this[ prop ];
				if ( property instanceof NotificationService ) {
					property.closeSideNavigationMenu( 'force close' );
				}
			}
			if ( origin ) {
				origin.apply();
			}
		};
	};
}

/**
 * measure the time it takes for a method to run
 * */
export function Time( target , name , descriptor ) {
	const orig       = descriptor.value;
	descriptor.value = function ( ... args ) {
		const start = performance.now();
		orig.apply( this , args );
		const stop = performance.now();
		console.log( `Metrics stats:` , ( stop - start ).toFixed( 2 ) );
	};
}
