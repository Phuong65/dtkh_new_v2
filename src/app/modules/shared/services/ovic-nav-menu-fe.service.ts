import { Injectable } from '@angular/core';
import { OvicMobilePanel , OvicNavFe , OvicSimpleNav } from '../models/ovic-nav-fe';
import { FEMainMenu } from '../utils/syscat';

@Injectable( {
	providedIn : 'root'
} )
export class OvicNavMenuFeService {

	private readonly _mainMenu : OvicNavFe[];

	private readonly _mobileMenuPanel : OvicMobilePanel[];

	private static makePanelMenuElement( elm : OvicNavFe , childPanel : number ) : OvicSimpleNav {
		const _d = { label : elm.label };
		if ( elm.eventName ) {
			_d[ 'eventName' ] = elm.eventName;
		}
		if ( elm.href ) {
			_d[ 'href' ] = elm.href;
		}
		if ( elm.routerLink ) {
			_d[ 'routerLink' ] = elm.routerLink;
		}
		if ( elm.children && elm.children.length && childPanel !== null ) {
			_d[ 'childPanel' ] = childPanel;
		}
		return _d;
	}

	constructor() {
		this._mainMenu        = FEMainMenu;
		this._mobileMenuPanel = this.mobileMenuMaker( FEMainMenu );
	}

	get mobileMenuPanel() : OvicMobilePanel[] {
		return this._mobileMenuPanel;
	}

	get mainMenu() : OvicNavFe[] {
		return this._mainMenu;
	}

	private mobileMenuMaker( menu : OvicNavFe[] ) : OvicMobilePanel[] {
		const result = [];
		if ( menu && menu.length ) {
			result[ 0 ] = {
				id       : 0 ,
				state    : 'opened' ,
				elements : []
			};
			menu.forEach( ( elm , index ) => {
				const secondPrefix = ''.concat( '2' , index.toString() );
				result[ 0 ].elements.push( OvicNavMenuFeService.makePanelMenuElement( elm , parseInt( secondPrefix , 10 ) ) );
				if ( elm.children && elm.children.length ) {
					result[ secondPrefix ] = {
						id       : parseInt( secondPrefix , 10 ) ,
						father   : 0 ,
						state    : 'closed' ,
						elements : []
					};
					elm.children.forEach( ( secondElm , secondIndex ) => {
						const thirdPrefix = ''.concat( '3' , secondIndex.toString() );
						result[ secondPrefix ].elements.push( OvicNavMenuFeService.makePanelMenuElement( secondElm , parseInt( thirdPrefix , 10 ) ) );
						if ( secondElm.children && secondElm.children.length ) {
							result[ thirdPrefix ] = {
								id       : parseInt( thirdPrefix , 10 ) ,
								father   : parseInt( secondPrefix , 10 ) ,
								state    : 'closed' ,
								elements : []
							};
							secondElm.children.forEach( ( thirdChild , thirdIndex ) => {
								const fourPrefix = ''.concat( '4' , thirdIndex.toString() );
								result[ thirdPrefix ].elements.push( OvicNavMenuFeService.makePanelMenuElement( thirdChild , parseInt( fourPrefix , 10 ) ) );
								if ( thirdChild.children && thirdChild.children.length ) {
									result[ fourPrefix ] = {
										id       : parseInt( fourPrefix , 10 ) ,
										father   : parseInt( thirdPrefix , 10 ) ,
										state    : 'closed' ,
										elements : []
									};
									thirdChild.children.forEach( fourChild => result[ fourPrefix ].elements.push( OvicNavMenuFeService.makePanelMenuElement( fourChild , null ) ) );
								}
							} );
						}
					} );
				}
			} );
		}
		return result.filter( Boolean );
	}
}
