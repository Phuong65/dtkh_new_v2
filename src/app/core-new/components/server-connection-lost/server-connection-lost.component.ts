import { Component , input , InputSignal , output , OutputEmitterRef } from '@angular/core';

@Component( {
	selector    : 'app-server-connection-lost' ,
	standalone  : true ,
	templateUrl : './server-connection-lost.component.html' ,
	styleUrl    : './server-connection-lost.component.css'
} )
export class ServerConnectionLostComponent {
	
	title : InputSignal<string> = input<string>( 'Mất kết nối với máy chủ' );
	
	subTitle : InputSignal<string> = input<string>( 'Vui lòng kiểm tra đường truyền và thử lại.' );
	
	disableRetry : InputSignal<boolean> = input<boolean>( false );
	
	gutter : InputSignal<number> = input<number>( 15 );
	
	readonly retry : OutputEmitterRef<void> = output<void>();
	
}
