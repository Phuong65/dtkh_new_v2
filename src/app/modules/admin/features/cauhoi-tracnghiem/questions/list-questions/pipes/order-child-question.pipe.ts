import { Pipe , PipeTransform } from '@angular/core';
import { CourseQuestionHierarchy } from "@modules/admin/features/cauhoi-tracnghiem/models/bank-questions";
import { CourseQuestions } from "@shared/models/course-questions";

/**
 * get child questions in order
 * */
@Pipe( {
    name       : 'orderChildQuestion' ,
    standalone : true
} )
export class OrderChildQuestionPipe implements PipeTransform {

    transform ( question : CourseQuestionHierarchy ) : CourseQuestionHierarchy['children'] {
        // return question.config?.invertedAnswer ?
        return question.children.sort( ( a : CourseQuestions , b : CourseQuestions ) : number => a.question_number - b.question_number );
    }

}
