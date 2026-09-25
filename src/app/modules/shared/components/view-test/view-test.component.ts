import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { getLinkDownload_aws } from '@env';
import { ClassPlanActivityStudentAnswers } from '@modules/shared/models/class-plan-activity-student-answers';
import { ClassPlanActivityStudentTests } from '@modules/shared/models/class-plan-activity-student-tests';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { ThiShiftStudents } from '@modules/shared/models/thi-shift-students';
import { KEY_ANSWER_new } from '@modules/shared/utils/syscat';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({standalone: true, 
    selector: 'app-view-test',
    templateUrl: './view-test.component.html',
    styleUrls: ['./view-test.component.css'],
    imports: [KatexImgDirective, SafeHtmlPipe]
})
export class ViewTestComponent implements OnInit, OnChanges {
    @ViewChild("bodyTest") bodyTest: ElementRef;

    @Input() _av: number;

    @Input() _id: number;

    @Input() _question: CourseQuestions[];

    @Input() _test_aws: any[];

    question_count: number;

    _test_body: string;

    _ans_correc: number = 0;

    constructor(
        private helperService: HelperService,
        private auth: AuthService,
        protected sanitizer: DomSanitizer,
        private fileService: FileService
    ) { }

    getStylePromise(): Promise<any> {
        return new Promise((resolve, reject) => {
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
        if (changes['_id']) {
            this.convertQuestion();
        }
    }

    ngOnInit(): void {

    }

    async convertQuestion() {
        let _part = [];

        let list_part = [];

        let list_question = [];

        let content_test: string = '';

        this.question_count = 0;

        if (this._av === 1) {
            let parts = this._question.map(m => m.code);

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

        const _aws_test = this.helperService.sort(this._test_aws, "id");

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

                let i = 0;

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

            if (list_question && list_question.length) {
                list_question.forEach((q, i) => {
                    content_test = content_test.concat(this.setHtmlQuestion(q, i));
                })
            }



            if (list_part && list_part.length) {
                list_part.forEach((part, i) => {
                    const part_question_div = '<div class="part-question"><div class="part-direction">'.concat("<span class='part-name'>", part['label'], "</span></div>");
                    content_test = content_test.concat(part_question_div);
                    part['list_question'].forEach((q, i) => {
                        content_test = content_test.concat(this.setHtmlQuestion(q, i, part));
                    })
                    content_test = content_test.concat("</div>");
                })
            }

            content_test = content_test.replace(/src="([0-9]+)"/gis, _src => {
                const ids = _src.replace(/\D/g, "");
                return 'src="' + getLinkDownload_aws(ids.toString().concat('?token=', this.auth.accessToken)) + '"';
            });

            this._ans_correc = count_student_ans_correct;
            this._test_body = content_test;
        }
    }

    setSrc(src: any) {
        return this.sanitizer.bypassSecurityTrustUrl(src);
    }

    setHtmlQuestion(course_question: CourseQuestions, key_: number, part_question: any = null) {
        if (this._av !== 1) {
            let question_direction = '<div class="question"><div class="flex no-margin-child-p margin-left-p-10px question-direction"><span class="number-question">Câu '.concat((key_ + 1).toString(), ':</span><div class="direction flex-1">', course_question['question_direction'], "</div></div>");
            switch (course_question.question_type) {
                case 'group-input':
                    if (course_question['children'] && course_question['children'].length) {
                        course_question['children'].forEach((c, keyc) => {
                            const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction flex-1">', c['question_direction'], "</div></div>");
                            question_direction = question_direction.concat(question_child);
                            const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", this.helperService.encodeHTML(c['student_answer']), "</div></p></div>");
                            question_direction = question_direction.concat(answ);
                            if (c.answer_correct) {
                                const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                let answer_correct = arrayAnswerCorrect.join(" | ");
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", this.helperService.encodeHTML(answer_correct), "</div></p></div>");
                                question_direction = question_direction.concat(answer_correct_html);
                            }
                            question_direction = question_direction.concat("</div>");
                        })
                    }
                    break;
                case 'group-radio':
                    if (course_question['children'] && course_question['children'].length) {
                        course_question['children'].forEach((c, keyc) => {
                            const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction">', c['question_direction'], "</div></div>");
                            question_direction = question_direction.concat(question_child);
                            const borderCorrect = Number(c['result']) === 1 ? 'border-correct' : '';
                            const student_answer_arr = c['student_answer'] ? c['student_answer'].split("|").filter(m => m || parseFloat(m) === 0) : [];

                            if (c['answer_option'] && c['answer_option'].length) {
                                const answer_option_sort = this.helperService.sort(c['answer_option'], 'id')
                                answer_option_sort.forEach((a, keyans) => {
                                    let borderAnswer = "";
                                    const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                                    if (index !== -1) {
                                        borderAnswer = "border-answer";
                                    }
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                                    question_direction = question_direction.concat(answ);
                                })

                                if (c.answer_correct) {
                                    const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                    const answer_correct = arrayAnswerCorrect.map(m => {
                                        const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                        if (index_ans !== -1)
                                            return this.getKey(index_ans);
                                        return '';
                                    }).filter(m => m !== '').join(" | ");
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<p><strong>", answer_correct, "</strong></p></div>");
                                    question_direction = question_direction.concat(answer_correct_html);
                                }
                            }

                            question_direction = question_direction.concat("</div>");
                        })
                    }
                    break;
                case 'checkbox':
                    if (course_question['answer_option'] && course_question['answer_option'].length) {
                        const borderCorrect = Number(course_question['result']) === 1 ? 'border-correct' : '';
                        const student_answer_arr = course_question['student_answer'] ? course_question['student_answer'].replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0) : [];
                        const answer_option_sort = this.helperService.sort(course_question['answer_option'], 'id')
                        answer_option_sort.forEach((a, keyans) => {
                            let borderAnswer = "";
                            const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                            if (index !== -1) {
                                borderAnswer = "border-answer";
                            }
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                            question_direction = question_direction.concat(answ);
                        })

                        if (course_question.answer_correct) {
                            const arrayAnswerCorrect = course_question.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0);
                            const answer_correct = arrayAnswerCorrect.map(m => {
                                const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                if (index_ans !== -1)
                                    return this.getKey(index_ans);
                                return '';
                            }).filter(m => m !== '').join(" ; ");
                            const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                            question_direction = question_direction.concat(answer_correct_html);
                        }
                    }

                    break;
                case 'drag_drop':
                    if (course_question.answer_option && course_question.answer_option.length) {
                        let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                        course_question.answer_option.forEach(ao => {
                            if (!course_question.config || !course_question.config.contentHtml) {
                                ao['value'] = this.helperService.encodeHTML(ao['value']);
                            }

                            drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                        })
                        drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                        question_direction = question_direction.concat(drag_drop_ansoption);

                        if (course_question['children'] && course_question['children'].length) {
                            course_question['children'].forEach((c, keyc) => {
                                const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction flex-1">', c['question_direction'], "</div></div>");
                                question_direction = question_direction.concat(question_child);
                                if (c.student_answer) {
                                    const arr_student_ans = c.student_answer.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                    const student_ans = course_question.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" ; "), "</p></div></div>");
                                    question_direction = question_direction.concat(answ);
                                }

                                if (c.answer_correct) {
                                    const arr_ans_correct = c.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                    const ans_correct = course_question.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" ; "), "</p></div></div>");
                                    question_direction = question_direction.concat(answer_correct_html);
                                }
                                question_direction = question_direction.concat("</div>");
                            })
                        }
                    }
                    break;
                case 'radio':
                    if (course_question['answer_option'] && course_question['answer_option'].length) {
                        const borderCorrect = Number(course_question['result']) === 1 ? 'border-correct' : '';
                        const student_answer_arr = course_question['student_answer'] ? course_question['student_answer'].split("|").filter(m => m || parseFloat(m) === 0) : [];
                        const answer_option_sort = this.helperService.sort(course_question['answer_option'], 'id')
                        answer_option_sort.forEach((a, keyans) => {
                            let borderAnswer = "";
                            const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                            if (index !== -1) {
                                borderAnswer = "border-answer";
                            }
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                            question_direction = question_direction.concat(answ);
                        })

                        if (course_question.answer_correct) {
                            const arrayAnswerCorrect = course_question.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                            const answer_correct = arrayAnswerCorrect.map(m => {
                                const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                if (index_ans !== -1)
                                    return this.getKey(index_ans);
                                return '';
                            }).filter(m => m !== '').join(" | ");
                            const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                            question_direction = question_direction.concat(answer_correct_html);
                        }
                    }


                    break;
                case 'grouping':
                    if (course_question.answer_option && course_question.answer_option.length) {
                        let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                        course_question.answer_option.forEach(ao => {
                            drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                        })
                        drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                        question_direction = question_direction.concat(drag_drop_ansoption);

                        if (course_question['children'] && course_question['children'].length) {
                            course_question['children'].forEach((c, keyc) => {
                                const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction flex-1">', c['question_direction'], "</div></div>");
                                question_direction = question_direction.concat(question_child);
                                if (c.student_answer) {
                                    const arr_student_ans = c.student_answer.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                    const student_ans = course_question.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" | "), "</p></div></div>");
                                    question_direction = question_direction.concat(answ);
                                }

                                if (c.answer_correct) {
                                    const arr_ans_correct = c.answer_correct.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                    const ans_correct = course_question.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" | "), "</p></div></div>");
                                    question_direction = question_direction.concat(answer_correct_html);
                                }

                                question_direction = question_direction.concat("</div>");
                            })
                        }
                    }
                    break;
                case 'inputbox':
                    if (course_question.answer_correct) {
                        const inputCorrect = Number(course_question['result']) === 0 ? 'input-wrong' : 'input-correct';
                        const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", this.helperService.encodeHTML(course_question['student_answer']), "</p></div></div>");
                        question_direction = question_direction.concat(answ);
                        const arrayAnswerCorrect = course_question.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                        let answer_correct = arrayAnswerCorrect.join(" | ");
                        const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", this.helperService.encodeHTML(answer_correct), "</p></div></div>");
                        question_direction = question_direction.concat(answer_correct_html);
                    }
                    break;
                case 'reorder_words':
                    if (course_question.answer_correct) {
                        const inputCorrect = Number(course_question['result']) === 0 ? 'input-wrong' : 'input-correct';
                        const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", course_question['student_answer'], "</p></div></div>");
                        question_direction = question_direction.concat(answ);
                        const arrayAnswerCorrect = course_question.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                        let answer_correct = arrayAnswerCorrect.join(" | ");
                        const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", answer_correct, "</p></div></div>");
                        question_direction = question_direction.concat(answer_correct_html);
                    }
                    break;
                default:
                    break;
            }
            question_direction = question_direction.concat("</div>");
            return question_direction;
        } else {
            let partDirection = '<div class="part-childrent"><div class="part-childrent-direction flex no-margin-child-p"><span class="part-number">'.concat(part_question.label, ".", (key_ + 1).toString(), ".</span><div class='direction-part'>", course_question.question_direction, "</div></div>");
            if (course_question['children'] && course_question['children'].length) {
                course_question['children'].forEach(c => {
                    this.question_count = this.question_count + 1;
                    const question_direction = '<div class="question question-av-part"><div class="flex no-margin-child-p margin-left-p-10px question-direction"><span class="number-question">Question '.concat(this.question_count.toString(), ':</span><div class="direction flex-1">', c['question_direction'], "</div></div>");
                    partDirection = partDirection.concat(question_direction);
                    switch (course_question.question_type) {
                        case 'grouping':
                            if (course_question.answer_option && course_question.answer_option.length) {
                                let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                                course_question.answer_option.forEach(ao => {
                                    drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                                })
                                drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                                partDirection = partDirection.concat(drag_drop_ansoption);
                            }
                            break;
                        case 'drag_drop':
                            if (course_question.answer_option && course_question.answer_option.length) {
                                let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                                course_question.answer_option.forEach(ao => {
                                    drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                                })
                                drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                                partDirection = partDirection.concat(drag_drop_ansoption);
                            }
                            break;
                        default:
                            break;
                    }
                    switch (course_question.question_type) {
                        case 'checkbox':
                            if (c['answer_option'] && c['answer_option'].length) {
                                const borderCorrect = Number(c['result']) === 1 ? 'border-correct' : '';
                                const student_answer_arr = c['student_answer'] ? c['student_answer'].replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0) : [];
                                const answer_option_sort = this.helperService.sort(c['answer_option'], 'id')
                                answer_option_sort.forEach((a, keyans) => {
                                    let borderAnswer = "";
                                    const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                                    if (index !== -1) {
                                        borderAnswer = "border-answer";
                                    }
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                                    partDirection = partDirection.concat(answ);
                                })

                                if (c.answer_correct) {
                                    const arrayAnswerCorrect = c.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0);
                                    const answer_correct = arrayAnswerCorrect.map(m => {
                                        const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                        if (index_ans !== -1)
                                            return this.getKey(index_ans);
                                        return '';
                                    }).filter(m => m !== '').join(" ; ");
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                                    partDirection = partDirection.concat(answer_correct_html);
                                }
                            }

                            break;
                        case 'radio':
                            const borderCorrect = Number(c['result']) === 1 ? 'border-correct' : '';
                            const student_answer_arr = c['student_answer'] ? c['student_answer'].split("|").filter(m => m || parseFloat(m) === 0) : [];
                            if (c['answer_option'] && c['answer_option'].length) {
                                const answer_option_sort = this.helperService.sort(c['answer_option'], 'id')
                                answer_option_sort.forEach((a, keyans) => {
                                    let borderAnswer = "";
                                    const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                                    if (index !== -1) {
                                        borderAnswer = "border-answer";
                                    }
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                                    partDirection = partDirection.concat(answ);
                                })

                                if (c.answer_correct) {
                                    const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                    const answer_correct = arrayAnswerCorrect.map(m => {
                                        const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                        if (index_ans !== -1)
                                            return this.getKey(index_ans);
                                        return '';
                                    }).filter(m => m !== '').join(" | ");
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                                    partDirection = partDirection.concat(answer_correct_html);
                                }
                            }

                            break;
                        case 'inputbox':
                            const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", c['student_answer'], "</p></div></div>");
                            partDirection = partDirection.concat(answ);
                            if (c.answer_correct) {
                                const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                let answer_correct = arrayAnswerCorrect.join(" | ");
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", answer_correct, "</p></div></div>");
                                partDirection = partDirection.concat(answer_correct_html);
                            }
                            break;
                        case 'reorder_words':
                            if (c.answer_correct) {
                                const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", c['student_answer'], "</p></div></div>");
                                partDirection = partDirection.concat(answ);
                                const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                let answer_correct = arrayAnswerCorrect.join(" | ");
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", answer_correct, "</p></div></div>");
                                partDirection = partDirection.concat(answer_correct_html);
                            }
                            break;
                        case 'drag_drop':
                            if (c.student_answer) {
                                const arr_student_ans = c.student_answer.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                const student_ans = c.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" ; "), "</p></div></div>");
                                partDirection = partDirection.concat(answ);
                            }

                            if (c.answer_correct) {
                                const arr_ans_correct = c.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                const ans_correct = c.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" ; "), "</p></div></div>");
                                partDirection = partDirection.concat(answer_correct_html);
                            }
                            break;
                        case 'grouping':
                            if (c.student_answer) {
                                const arr_student_ans = c.student_answer.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                const student_ans = c.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" | "), "</p></div></div>");
                                partDirection = partDirection.concat(answ);
                            }

                            if (c.answer_correct) {
                                const arr_ans_correct = c.answer_correct.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                const ans_correct = c.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" | "), "</p></div></div>");
                                partDirection = partDirection.concat(answer_correct_html);
                            }
                            break;
                        default:
                            break;
                    }

                    partDirection = partDirection.concat("</div>")
                })
                partDirection = partDirection.concat("</div>");

            }
            partDirection = partDirection.concat("</div>");
            return partDirection;
        }
    }

    getKey(index) {
        return String.fromCharCode(65 + index);
    }
}
