import { EventEmitter } from '@angular/core';
import { ClassTestQuestionExtend } from '@modules/kiem-thu-ngan-hang-cau-hoi/models/class-tests';
import { CourseTesterResultExtend } from '@modules/kiem-thu-ngan-hang-cau-hoi/kiem-thu-ngan-hang-cau-hoi.component';

export class DragAndDropArea {
	visible : boolean;
	question : CourseTesterResultExtend;
	answers : string[];

	constructor( question : CourseTesterResultExtend , visible : boolean = false ) {
		this.question = question;
		this.visible  = visible;
		this.answers  = question ? question.courseTesterResult.answer.split( ',' ).filter( Boolean ) : [];
	}
}

export interface DragAndDropBaseComponent {
	options : string[];
	readonly dragAndDropElements : DragAndDropArea[];
}

export interface IctuTestQuestionTypeComponentBase {
	set question( question : CourseTesterResultExtend );

	get question() : CourseTesterResultExtend;

	dirty : EventEmitter<string>;
}

export const OBJECT_WITHOUT_PROPERTIES : <T>( _object : T , keys : [ keyof T ] ) => Partial<T> = <T>( _object : T , keys : [ keyof T ] ) => {
	const arrKeysName : string[] = keys.map( ( i : keyof T ) : string => i.toString() );
	return Object.keys( _object ).reduce( ( reducer : Partial<T> , k : string ) : Partial<T> => {
		if ( !arrKeysName.includes( k ) ) {
			reducer[ k ] = _object[ k ];
		}
		return reducer;
	} , {} );
};
