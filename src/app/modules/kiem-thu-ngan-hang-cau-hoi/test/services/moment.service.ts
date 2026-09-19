import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { DurationInputArg1 , DurationInputArg2 , MomentFormatSpecification , MomentInput } from 'moment/moment';
import { Moment } from 'moment';

moment.tz.setDefault( 'Asia/Ho_Chi_Minh' );

interface MomentConvertAddOption {
	amount? : DurationInputArg1,
	unit? : DurationInputArg2
}

interface MomentConvertOption {
	add? : MomentConvertAddOption;
}

@Injectable( {
	providedIn : 'root'
} )
export class MomentService {

	constructor() { }

	/**
	 * isDateInputValid
	 * Check if input string is a valid date
	 * @var input
	 * @var format - the format of input
	 * */
	isDateValid( input : string , format : string = 'DD/MM/YYYY' ) : boolean {
		return moment( input , format , true ).isValid();
	}

	moment( input : MomentInput , strict? : boolean ) : moment.Moment {
		return moment( input , strict );
	}

	formatMoment( input : MomentInput , format : MomentFormatSpecification = 'DD/MM/YYYY' , strict? : boolean ) : moment.Moment {
		return moment( input , format , strict );
	}

	momentConvert( input : string , outputFormat : string = 'DD/MM/YYYY' , configs? : MomentConvertOption ) : string {
		const _objMoment : moment.Moment = input && moment( input );
		if ( _objMoment && _objMoment.isValid() ) {
			if ( configs ) {
				if ( configs.add ) {
					const amount : DurationInputArg1 = configs.add.amount || null;
					const unit : DurationInputArg2   = configs.add.unit || null;
					_objMoment.add( amount , unit );
				}
			}
			return _objMoment.format( outputFormat );
		}
		return '';
	}

	getFirstDateOfTheWeek( input : MomentInput ) : Moment {
		const moment : Moment = this.moment( input );
		return ( moment.weekday() ? moment : moment.subtract( 3 , 'day' ) ).weekday( 1 );
	}

	get momentObject() {
		return moment;
	}
}
