import { CoursePlanActivities } from '@shared/models/course-plan-activities';
import { CourseQuestions } from '@shared/models/course-questions';
import { Answers , Question } from '@shared/models/question';

export interface BankQuestions {
}

export type CdrName = 'know' | 'understand' | 'apply' | 'analysis' | 'evaluate' | 'invent' // biết | hiểu | vận dụng | phân tích | đánh giá | sáng tạo

export interface CdrStandard {
	id : number,
	label : string,
	name : CdrName,
	disabled : boolean
}

export type CdrKit = Record<CdrName , CdrStandard>;

export const CDR_KIT : CdrKit = {
	know       : { id : 1 , label : 'Biết' , name : 'know' , disabled : false } ,
	understand : { id : 2 , label : 'Hiểu' , name : 'understand' , disabled : false } ,
	apply      : { id : 3 , label : 'Vận dụng' , name : 'apply' , disabled : false } ,
	analysis   : { id : 4 , label : 'Phân tích' , name : 'analysis' , disabled : false } ,
	evaluate   : { id : 5 , label : 'Đánh giá' , name : 'evaluate' , disabled : true } ,
	invent     : { id : 6 , label : 'Sáng tạo' , name : 'invent' , disabled : true }
};

export const CDR_OPTIONS : CdrStandard[] = Object.seal<CdrStandard[]>( Object.values( CDR_KIT ) );

export const cdrId2Name : ( id : number ) => CdrName = ( id : number ) : CdrName => CDR_OPTIONS.find( ( o : CdrStandard ) : boolean => o.id === id )?.name;

export const cdrId2Label : ( id : number ) => string = ( id : number ) : string => CDR_OPTIONS.find( ( o : CdrStandard ) : boolean => o.id === id )?.label;

export const cdrName2Id : ( name : CdrName ) => number = ( name : CdrName ) : number => CDR_KIT[ name ].id;

export const cdrName2Label : ( name : CdrName ) => string = ( name : CdrName ) : string => CDR_KIT[ name ].label;

export interface CoursePlanActivitiesExtends extends CoursePlanActivities {
	heading : string;
	cdrList : CoursePlanActivitiesCdr[];
	totalQuestions : number;
	verify : boolean; // xác nhận đạt hay chưa đạt
}

export type CoursePlanActivitiesCdrGroup = Record<CdrName , {
	reachRequirement : boolean, // tình trạng đạt yêu cầu hay chưa
	require : number, // số lượng câu hỏi yêu cầu
	questions : CourseQuestionHierarchy[];
}>

export interface CoursePlanActivitiesCdr extends CoursePlanActivities {
	group : CoursePlanActivitiesCdrGroup;
	verify : boolean;
}

export interface CourseQuestionHierarchy extends CourseQuestions {
	children : CourseQuestions[];
}

export const isCoursePlanActivityCdrVerify : ( coursePlanActivity : CoursePlanActivities ) => boolean = ( c : CoursePlanActivities ) : boolean => {
	return c.cdr_cauhoi && c.cdr_cauhoi[ 'status' ] && c.cdr_cauhoi[ 'status' ] === 1;
};

export const validateCoursePlanActivitiesCdrGroup : ( group : CoursePlanActivitiesCdrGroup ) => CoursePlanActivitiesCdrGroup = ( group : CoursePlanActivitiesCdrGroup ) : CoursePlanActivitiesCdrGroup => {
	const loop : Record<CdrName , number> = { know : 0 , understand : 0 , apply : 0 , analysis : 0 , evaluate : 0 , invent : 0 };
	Object.keys( loop ).forEach( ( cdrName : CdrName ) : any => group[ cdrName ].reachRequirement = group[ cdrName ][ 'count_question' ] === group[ cdrName ].require );
	return group;
};

export const coursePlanActivitiesExtendsChecker : ( planActivity : CoursePlanActivitiesExtends ) => CoursePlanActivitiesExtends = ( planActivity : CoursePlanActivitiesExtends ) : CoursePlanActivitiesExtends => {
	const _counter : Record<CdrName , number> = planActivity.cdrList.reduce( ( reducer : Record<CdrName , number> , _crd ) : Record<CdrName , number> => {
		_crd.group.know[ 'count_question' ]       = 0;
		_crd.group.understand[ 'count_question' ] = 0;
		_crd.group.apply[ 'count_question' ]      = 0;
		_crd.group.analysis[ 'count_question' ]   = 0;

		_crd.group[ 'total_quesion' ] = { count_question : 0 , questions : [] , status_question : 0 };
		if ( planActivity[ 'av' ] === 1 ) {

			_crd.group.know.questions.forEach( f => {
				reducer.know += f[ 'children' ].length;
				_crd.group.know[ 'count_question' ] += f[ 'children' ].length;
				_crd.group[ 'total_quesion' ][ 'questions' ] = _crd.group[ 'total_quesion' ][ 'questions' ].concat( f[ 'children' ] );
			} )

			_crd.group.understand.questions.forEach( f => {
				reducer.understand += f[ 'children' ].length;
				_crd.group.understand[ 'count_question' ] += f[ 'children' ].length;
				_crd.group[ 'total_quesion' ][ 'questions' ] = _crd.group[ 'total_quesion' ][ 'questions' ].concat( f[ 'children' ] );
			} )

			_crd.group.apply.questions.forEach( f => {
				reducer.apply += f[ 'children' ].length;
				_crd.group.apply[ 'count_question' ] += f[ 'children' ].length;
				_crd.group[ 'total_quesion' ][ 'questions' ] = _crd.group[ 'total_quesion' ][ 'questions' ].concat( f[ 'children' ] );
			} )

			_crd.group.analysis.questions.forEach( f => {
				reducer.analysis += f[ 'children' ].length;
				_crd.group.analysis[ 'count_question' ] += f[ 'children' ].length;
				_crd.group[ 'total_quesion' ][ 'questions' ] = _crd.group[ 'total_quesion' ][ 'questions' ].concat( f[ 'children' ] );

			} )

			// reducer.know += _crd.group.know.questions.length;
			// reducer.understand += _crd.group.understand.questions.length;
			// reducer.apply += _crd.group.apply.questions.length;
			// reducer.analysis += _crd.group.analysis.questions.length;
		}
		else {
			reducer.know += _crd.group.know.questions.length;
			reducer.understand += _crd.group.understand.questions.length;
			reducer.apply += _crd.group.apply.questions.length;
			reducer.analysis += _crd.group.analysis.questions.length;
			_crd.group.know[ 'count_question' ]          = _crd.group.know.questions.length;
			_crd.group.understand[ 'count_question' ]    = _crd.group.understand.questions.length;
			_crd.group.apply[ 'count_question' ]         = _crd.group.apply.questions.length;
			_crd.group.analysis[ 'count_question' ]      = _crd.group.analysis.questions.length;
			_crd.group[ 'total_quesion' ][ 'questions' ] = _crd.group[ 'total_quesion' ][ 'questions' ].concat( _crd.group.know.questions , _crd.group.understand.questions , _crd.group.analysis.questions , _crd.group.apply.questions );
		}

		_crd.group[ 'total_quesion' ][ 'count_question' ]  = _crd.group[ 'total_quesion' ][ 'questions' ].length;
		const gray                                         = _crd.group[ 'total_quesion' ][ 'questions' ].filter( m => m.status === 0 || m.status === -2 ).length.toString();
		const red                                          = _crd.group[ 'total_quesion' ][ 'questions' ].filter( m => m.status === -1 ).length.toString();
		const blue                                         = _crd.group[ 'total_quesion' ][ 'questions' ].filter( m => m.status === 1 ).length.toString();
		_crd.group[ 'total_quesion' ][ 'status_question' ] = '(<span class="gray">'.concat( gray , '</span> + <span class="red">' , red , '</span> + <span class="blue">' , blue , '</span> = ' , _crd.group[ 'total_quesion' ][ 'count_question' ].toString() , ')' )
		return reducer;
	} , { 'know' : 0 , 'understand' : 0 , 'apply' : 0 , 'analysis' : 0 , 'evaluate' : 0 , 'invent' : 0 } );
	const textVerify : string                 = planActivity.verify ? 'Đủ điều kiện nhập ngân hàng câu hỏi' : 'Chưa đủ điều kiện nhập ngân hàng câu hỏi';

	planActivity.totalQuestions = _counter.know + _counter.understand + _counter.apply + _counter.analysis;
	planActivity.heading        = `Bài ${ planActivity.week.toString( 10 ) } (${ _counter.know.toString( 10 ) } + ${ _counter.understand.toString( 10 ) } + ${ _counter.apply.toString( 10 ) } + ${ _counter.analysis.toString( 10 ) } = ${ planActivity.totalQuestions.toString( 10 ) }) : ${ textVerify }`;
	return planActivity;
};

export interface SelectOptions<T> {
	label : string;
	value : T;
	disable? : boolean;
}

export type IctuQuestionType = 'grouping' | 'drag_drop' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'inputbox' | 'reorder_words' | 'matching' | 'arrange_paragraphs' | string; // 'selectbox' |

export const maxAnswerOptionId : ( question : Question ) => number = ( question : Question ) : number => {
	return question.answer_option.reduce( ( reducer : number , a : Answers ) : number => ! Number.isNaN( parseInt( a.id , 10 ) ) ? Math.max( reducer , parseInt( a.id , 10 ) ) : reducer , 0 );
};

export const formatAnswerCorrect : ( input : string ) => string = ( input : string ) : string => {
	return input ? input.replace( /\s+/g , ' ' ).trim() : input;
};

const alphabet : string[] = [ 'A' , 'B' , 'C' , 'D' , 'E' , 'F' , 'G' , 'H' , 'I' , 'J' , 'K' , 'L' , 'M' , 'N' , 'O' , 'P' , 'Q' , 'R' , 'S' , 'T' , 'U' , 'V' , 'W' , 'X' , 'Y' , 'Z' ];

export const questionPrefix : ( index : number ) => string = ( index : number ) : string => {
	let result : string = 'A';
	switch ( true ) {
		case index < ( 26 ):
			result = alphabet[ index ];
			break;
		case index < ( 26 * 2 ):
			result = alphabet[ index - 26 ] + '1';
			break;
		case index < ( 26 * 3 ):
			result = alphabet[ index - ( 26 * 2 ) ] + '2';
			break;
		case index < ( 26 * 4 ):
			result = alphabet[ index - ( 26 * 3 ) ] + '3';
			break;
		case index < ( 26 * 5 ):
			result = alphabet[ index - ( 26 * 4 ) ] + '4';
			break;
		case index < ( 26 * 6 ):
			result = alphabet[ index - ( 26 * 5 ) ] + '5';
			break;
		case index < ( 26 * 7 ):
			result = alphabet[ index - ( 26 * 6 ) ] + '6';
			break;
		case index < ( 26 * 8 ):
			result = alphabet[ index - ( 26 * 7 ) ] + '7';
			break;
		case index < ( 26 * 9 ):
			result = alphabet[ index - ( 26 * 8 ) ] + '8';
			break;
		default:
			result = 'XX';
			break;
	}
	return result;
};

export const base64ToFile : ( base64String : string , fileName : string ) => Promise<File> = ( url : string , fileName : string ) : Promise<File> => {
	return fetch( url ).then( ( res : Response ) => res.blob() ).then( ( blob : Blob ) => new File( [ blob ] , fileName , { type : blob.type } ) );
};

export const arrayShuffle : <T>( input : Array<T> ) => Array<T> = <T> ( array : Array<T> ) : T[] => {
	for ( let i : number = array.length - 1 ; i > 0 ; i-- ) {
		const j : number            = Math.floor( Math.random() * ( i + 1 ) );
		[ array[ i ] , array[ j ] ] = [ array[ j ] , array[ i ] ];
	}
	return array;
};
