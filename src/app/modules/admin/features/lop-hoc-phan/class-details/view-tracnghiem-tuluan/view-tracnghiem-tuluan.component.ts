import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { getLinkDownload_aws } from '@env';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { ClassPlanActivityStudentAnswers } from '@modules/shared/models/class-plan-activity-student-answers';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { SharedModule } from '@modules/shared/shared.module';

@Component({
    selector: 'app-view-tracnghiem-tuluan',
    templateUrl: './view-tracnghiem-tuluan.component.html',
    styleUrls: ['./view-tracnghiem-tuluan.component.css'],
    standalone: true,
    imports: [CommonModule, SharedModule, KatexImgDirective]
})
export class ViewTracnghiemTuluanComponent implements OnChanges {
    @ViewChild("bodyTest") bodyTest: ElementRef;

    @Input() _av: number;

    @Input() _id: number;

    @Input() _question: CourseQuestions[];

    @Input() _test_aws: ClassPlanActivityStudentAnswers[];

    question_count: number;

    list_question: any[] = [];

    list_part: any[] = [];

    _ans_correc: number = 0;

    constructor(
        private helperService: HelperService,
        private auth: AuthService,
        protected sanitizer: DomSanitizer,
        private fileService: FileService
    ) { }

    getStylePromise(): Promise<any> {
        return new Promise(resolve => {
            this.fileService.getFileLocalAsBlob('..\\assets\\css\\downloadTest.css').subscribe({
                next: (_style_css) => {
                    resolve(_style_css);
                },
                error: () => {
                    resolve(null);
                },
            });
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['_id'] || changes['_question'] || changes['_test_aws'] || changes['_av']) {
            this.convertQuestion();
        }
    }

    convertQuestion(): void {
        let _part = [];

        let list_part = [];

        let list_question = [];

        this.question_count = 0;

        if (this._av === 1) {
            let parts = (this._question || []).map(m => m.code);

            parts = [... new Set(parts)];

            parts.forEach(m => {
                if (m) {
                    _part.push({
                        id: m.replace(/\D/g, ''),
                        label: m
                    })
                }
            })
        }

        const _aws_test = this.helperService.sort(this._test_aws || [], "id");

        _part = this.helperService.sort(_part, "id");

        if (this._question && this._question.length) {

            const question_test = [];

            this._question.forEach(_q => {
                const ob_question = {};
                Object.keys(_q).forEach(o => {
                    ob_question[o] = _q[o];
                })
                question_test.push(ob_question);
            })

            const parent = question_test.filter(m => m.group_id === 0);

            parent.forEach(p => {
                p['children'] = question_test.filter(m => m.group_id === p.id);
            })

            if (this._av === 1) {
                const part_question = [];
                _part.forEach(lp => {
                    const item_part = {
                        label: lp.label,
                        list_question: parent.filter(m => m['code'] === lp.label),
                    }
                    part_question.push(item_part);
                })
                list_part = part_question;
            } else {
                list_question = parent;
            }

            let count_student_ans = 0;
            let count_student_ans_correct = 0;
            if (list_question && list_question.length) {
                list_question.forEach(q => {
                    const index_ans = _aws_test.findIndex(m => m.course_question_id === q.id);
                    if (index_ans !== -1) {
                        q['student_answer'] = _aws_test[index_ans].student_answer;
                        q['result'] = _aws_test[index_ans].result;
                        if (q['student_answer'] || q['student_answer'] === 0)
                            count_student_ans = count_student_ans + 1;
                        if (q['result'] === 1) {
                            count_student_ans_correct = count_student_ans_correct + 1;
                        }
                    }

                    if (q['children'] && q['children'].length) {
                        q['children'].forEach(c => {
                            this.question_count = this.question_count + 1;
                            const index_ans_c = _aws_test.findIndex(m => m.course_question_id === c.id);
                            if (index_ans_c !== -1) {
                                c['student_answer'] = _aws_test[index_ans_c].student_answer;
                                c['result'] = _aws_test[index_ans_c].result;
                                if (c['student_answer'] || c['student_answer'] === 0)
                                    count_student_ans = count_student_ans + 1;
                                if (c['result'] === 1) {
                                    count_student_ans_correct = count_student_ans_correct + 1;
                                }
                            }
                        })
                    } else {
                        this.question_count = this.question_count + 1;
                    }
                })
            }

            if (list_part && list_part.length) {
                list_part.forEach(part => {
                    if (part['list_question'] && part['list_question'].length) {
                        part['list_question'].forEach(q => {
                            const index_ans = _aws_test.findIndex(m => m.course_question_id === q.id);
                            if (index_ans !== -1) {
                                q['student_answer'] = _aws_test[index_ans].student_answer;
                                q['result'] = _aws_test[index_ans].result;

                                if (q['student_answer'] || q['student_answer'] === 0) {
                                    count_student_ans = count_student_ans + 1;
                                }

                                if (q['result'] === 1) {
                                    count_student_ans_correct = count_student_ans_correct + 1;
                                }
                            }

                            if (q['children'] && q['children'].length) {
                                q['children'].forEach(c => {
                                    const index_ans_c = _aws_test.findIndex(m => m.course_question_id === c.id);
                                    if (index_ans_c !== -1) {
                                        c['student_answer'] = _aws_test[index_ans_c].student_answer;

                                        c['result'] = _aws_test[index_ans_c].result;

                                        if (c['student_answer'] || c['student_answer'] === 0) {
                                            count_student_ans = count_student_ans + 1;
                                        }

                                        if (c['result'] === 1) {
                                            count_student_ans_correct = count_student_ans_correct + 1;
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            }

            list_question.forEach(q => this.prepareNormalQuestion(q));

            list_part.forEach(part => {
                part['list_question'].forEach(q => this.prepareAvQuestion(q));
            });

            this.list_question = list_question;
            this.list_part = list_part;
            this._ans_correc = count_student_ans_correct;
        }
    }

    private prepareNormalQuestion(course_question: any): void {
        this.prepareQuestionDirection(course_question);

        switch (course_question.question_type) {
            case 'group-input':
                course_question['children'].forEach(c => {
                    this.prepareQuestionDirection(c);
                    c['__studentAnswerText'] = c['student_answer'];
                    if (c.answer_correct) {
                        c['__answerCorrectText'] = this.parsePipeIds(c.answer_correct).join(" | ");
                    }
                });
                break;
            case 'group-radio':
                course_question['children'].forEach(c => {
                    this.prepareQuestionDirection(c);
                    if (c['answer_option'] && c['answer_option'].length) {
                        const student_answer_arr = c['student_answer'] ? this.parsePipeIds(c['student_answer']) : [];
                        const answer_option_sort = this.helperService.sort(c['answer_option'], 'id');
                        c['__answerOptions'] = this.prepareOptions(answer_option_sort, student_answer_arr);
                        if (c.answer_correct) {
                            c['__answerCorrectText'] = this.getCorrectOptionLabels(this.parsePipeIds(c.answer_correct), c['__answerOptions']).join(" | ");
                        }
                    }
                });
                break;
            case 'checkbox': {
                if (course_question['answer_option'] && course_question['answer_option'].length) {
                    const student_answer_arr = course_question['student_answer'] ? this.parseNonDigitIds(course_question['student_answer']) : [];
                    const answer_option_sort = this.helperService.sort(course_question['answer_option'], 'id');
                    course_question['__answerOptions'] = this.prepareOptions(answer_option_sort, student_answer_arr);
                    if (course_question.answer_correct) {
                        course_question['__answerCorrectText'] = this.getCorrectOptionLabels(this.parseNonDigitIds(course_question.answer_correct), course_question['__answerOptions']).join(" ; ");
                    }
                }
                break;
            }
            case 'drag_drop': {
                if (course_question.answer_option && course_question.answer_option.length) {
                    course_question.answer_option.forEach(ao => {
                        if (!course_question.config || !course_question.config.contentHtml) {
                            ao['value'] = this.helperService.encodeHTML(ao['value']);
                        }
                    });
                    course_question['__answerOptions'] = this.prepareOptions(course_question.answer_option, [], true);
                    course_question['children'].forEach(c => {
                        this.prepareQuestionDirection(c);
                        const arr_student_ans = c.student_answer ? this.parseNonDigitIdsWithNumber(c.student_answer) : [];
                        const arr_ans_correct = c.answer_correct ? this.parseNonDigitIdsWithNumber(c.answer_correct) : [];
                        c['__studentAnswerHtml'] = this.getOptionValues(course_question['__answerOptions'], arr_student_ans).join(" ; ");
                        c['__answerCorrectHtml'] = this.getOptionValues(course_question['__answerOptions'], arr_ans_correct).join(" ; ");
                    });
                }
                break;
            }
            case 'radio': {
                if (course_question['answer_option'] && course_question['answer_option'].length) {
                    const student_answer_arr = course_question['student_answer'] ? this.parsePipeIds(course_question['student_answer']) : [];
                    const answer_option_sort = this.helperService.sort(course_question['answer_option'], 'id');
                    course_question['__answerOptions'] = this.prepareOptions(answer_option_sort, student_answer_arr);
                    if (course_question.answer_correct) {
                        course_question['__answerCorrectText'] = this.getCorrectOptionLabels(this.parsePipeIds(course_question.answer_correct), course_question['__answerOptions']).join(" | ");
                    }
                }
                break;
            }
            case 'grouping': {
                if (course_question.answer_option && course_question.answer_option.length) {
                    course_question['__answerOptions'] = this.prepareOptions(course_question.answer_option, []);
                    course_question['children'].forEach(c => {
                        this.prepareQuestionDirection(c);
                        const arr_student_ans = c.student_answer ? this.parseNonDigitIdsWithNumber(c.student_answer) : [];
                        const arr_ans_correct = c.answer_correct ? this.parseNonDigitIdsWithNumber(c.answer_correct) : [];
                        c['__studentAnswerHtml'] = this.getOptionValues(course_question['__answerOptions'], arr_student_ans).join(" | ");
                        c['__answerCorrectHtml'] = this.getOptionValues(course_question['__answerOptions'], arr_ans_correct).join(" | ");
                    });
                }
                break;
            }
            case 'inputbox':
                course_question['__studentAnswerText'] = course_question['student_answer'];
                if (course_question.answer_correct) {
                    course_question['__answerCorrectText'] = this.parsePipeIds(course_question.answer_correct).join(" | ");
                }
                break;
            case 'reorder_words':
                course_question['__studentAnswerHtml'] = this.replaceAwsImageSrc(course_question['student_answer']);
                if (course_question.answer_correct) {
                    course_question['__answerCorrectHtml'] = this.replaceAwsImageSrc(this.parsePipeIds(course_question.answer_correct).join(" | "));
                }
                break;
            default:
                break;
        }
    }

    private prepareAvQuestion(course_question: any): void {
        this.prepareQuestionDirection(course_question);

        if (course_question.answer_option && ['drag_drop', 'grouping'].includes(course_question.question_type)) {
            course_question['__answerOptions'] = this.prepareOptions(course_question.answer_option, []);
        }

        if (course_question['children'] && course_question['children'].length) {
            course_question['children'].forEach(c => {
                this.question_count = this.question_count + 1;
                c['__questionNumber'] = this.question_count;
                this.prepareQuestionDirection(c);

                switch (course_question.question_type) {
                    case 'checkbox': {
                        if (c['answer_option'] && c['answer_option'].length) {
                            const student_answer_arr = c['student_answer'] ? this.parseNonDigitIds(c['student_answer']) : [];
                            const answer_option_sort = this.helperService.sort(c['answer_option'], 'id');
                            c['__answerOptions'] = this.prepareOptions(answer_option_sort, student_answer_arr);
                            if (c.answer_correct) {
                                c['__answerCorrectText'] = this.getCorrectOptionLabels(this.parseNonDigitIds(c.answer_correct), c['__answerOptions']).join(" ; ");
                            }
                        }
                        break;
                    }
                    case 'radio': {
                        const student_answer_arr = c['student_answer'] ? this.parsePipeIds(c['student_answer']) : [];
                        if (c['answer_option'] && c['answer_option'].length) {
                            const answer_option_sort = this.helperService.sort(c['answer_option'], 'id');
                            c['__answerOptions'] = this.prepareOptions(answer_option_sort, student_answer_arr);
                            if (c.answer_correct) {
                                c['__answerCorrectText'] = this.getCorrectOptionLabels(this.parsePipeIds(c.answer_correct), c['__answerOptions']).join(" | ");
                            }
                        }
                        break;
                    }
                    case 'inputbox':
                        c['__studentAnswerHtml'] = this.replaceAwsImageSrc(c['student_answer']);
                        if (c.answer_correct) {
                            c['__answerCorrectHtml'] = this.replaceAwsImageSrc(this.parsePipeIds(c.answer_correct).join(" | "));
                        }
                        break;
                    case 'reorder_words':
                        c['__studentAnswerHtml'] = this.replaceAwsImageSrc(c['student_answer']);
                        if (c.answer_correct) {
                            c['__answerCorrectHtml'] = this.replaceAwsImageSrc(this.parsePipeIds(c.answer_correct).join(" | "));
                        }
                        break;
                    case 'drag_drop': {
                        const answer_options = this.prepareOptions(c.answer_option, []);
                        const arr_student_ans = c.student_answer ? this.parseNonDigitIdsWithNumber(c.student_answer) : [];
                        const arr_ans_correct = c.answer_correct ? this.parseNonDigitIdsWithNumber(c.answer_correct) : [];
                        c['__studentAnswerHtml'] = this.getOptionValues(answer_options, arr_student_ans).join(" ; ");
                        c['__answerCorrectHtml'] = this.getOptionValues(answer_options, arr_ans_correct).join(" ; ");
                        break;
                    }
                    case 'grouping': {
                        const answer_options = this.prepareOptions(c.answer_option, []);
                        const arr_student_ans = c.student_answer ? this.parseNonDigitIdsWithNumber(c.student_answer) : [];
                        const arr_ans_correct = c.answer_correct ? this.parseNonDigitIdsWithNumber(c.answer_correct) : [];
                        c['__studentAnswerHtml'] = this.getOptionValues(answer_options, arr_student_ans).join(" | ");
                        c['__answerCorrectHtml'] = this.getOptionValues(answer_options, arr_ans_correct).join(" | ");
                        break;
                    }
                    default:
                        break;
                }
            });
        }
    }

    private prepareQuestionDirection(course_question: any): void {
        course_question['__directionHtml'] = this.replaceAwsImageSrc(course_question['question_direction']);
        course_question['__inputClass'] = Number(course_question['result']) === 0 ? 'input-wrong' : 'input-correct';
        course_question['__borderCorrect'] = Number(course_question['result']) === 1;
    }

    private prepareOptions(answer_options: any[], student_answer_arr: any[], valueAlreadyEncoded: boolean = false): any[] {
        return (answer_options || []).map(option => ({
            ...option,
            __valueHtml: this.replaceAwsImageSrc(option['value']),
            __selected: student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(option.id)) !== -1,
            __valueAlreadyEncoded: valueAlreadyEncoded
        }));
    }

    private getCorrectOptionLabels(answer_ids: any[], answer_options: any[]): string[] {
        return answer_ids.map(m => {
            const index_ans = answer_options.findIndex(i => parseFloat(i.id) === parseFloat(m));
            if (index_ans !== -1)
                return this.getKey(index_ans);
            return '';
        }).filter(m => m !== '');
    }

    private getOptionValues(answer_options: any[], answer_ids: any[]): string[] {
        return answer_options
            .filter(option => answer_ids.findIndex(id => Number(id) === Number(option.id)) !== -1)
            .map(option => option['__valueHtml']);
    }

    private parsePipeIds(value: string): string[] {
        return value.split("|").filter(m => m || parseFloat(m) === 0);
    }

    private parseNonDigitIds(value: string): string[] {
        return value.replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0);
    }

    private parseNonDigitIdsWithNumber(value: string): string[] {
        return value.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
    }

    private replaceAwsImageSrc(value: any): string {
        const content = value === null || value === undefined ? '' : value.toString();
        return content.replace(/src="([0-9]+)"/gis, _src => {
            const ids = _src.replace(/\D/g, "");
            return 'src="' + getLinkDownload_aws(ids.toString().concat('?token=', this.auth.accessToken)) + '"';
        });
    }

    setSrc(src: any) {
        return this.sanitizer.bypassSecurityTrustUrl(src);
    }

    getKey(index) {
        return String.fromCharCode(65 + index);
    }
}
