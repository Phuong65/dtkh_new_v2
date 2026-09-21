import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { getLinkDownload_aws } from '@env';

@Component({standalone: false, 
  selector: 'test-question-review-v2',
  templateUrl: './test-question-review-v2.component.html',
  styleUrls: ['./test-question-review-v2.component.css']
})
export class TestQuestionReviewV2Component implements OnInit {

    @Input() questions: any;

    @Input() showDelete = true;

    @Output() deleteQuestion = new EventEmitter<any>();

    list_question: any;

    constructor(
        private auth: AuthService,
        private helperService: HelperService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['questions']) {
            this.convertQuestion(this.questions);
        }
    }

    ngOnInit(): void {

    }

    convertQuestion(_question) {
        this.list_question = null;
        if (_question && _question.length) {
            let images = [];
            const parent = [];
            _question.forEach((f, key) => {
                const tmp = this.getArrayImageInQuestion(f.question_direction, f.id, 'question', 0);
                images = images.concat(tmp);
                if (f.group_id !== 0) {
                    f['answer_correct'] = f['answer_correct'] ? f['answer_correct'].split('|').filter(m => m && m !== '') : f['answer_correct'];
                    if (f.answer_option !== null) {
                        f.answer_option.forEach((a, ka) => {
                            const atmp = this.getArrayImageInQuestion(a.value, Number(a.id), 'answer', f.id);
                            images = images.concat(atmp);
                        });
                    }
                } else {
                    const children = _question.filter(m => m.group_id === f.id);
                    children.forEach(c => {
                        c['children'] = _question.filter(m => m.group_id === c.id);
                    })
                    f['media_open'] = false;
                    f['children'] = children;
                    f['expand'] = true;
                    parent.push(f);
                }
                // f.question_number = (key + 1);
                // console.log(f);
                // parent[0].children.push(f);
            });

            //  = _question;

            images.forEach((img, index) => {
                img.base64 = getLinkDownload_aws(img.idImage).concat("?token=", this.auth.accessToken) + '"';
            });

            images.forEach((img, key) => {
                if (img.where === 'question') {
                    const index_q = _question.findIndex(m => m.id === Number(img.idIndex));
                    if (index_q !== -1) {
                        const tmpq = this.newContentGetImage(_question[index_q].question_direction, img);
                        _question[index_q].question_direction = tmpq;
                    }
                } else {
                    const index_q = _question.findIndex(m => m.id === Number(img.parent_id));
                    if (index_q !== -1) {
                        const index_a = _question[index_q].answer_option.findIndex(m => Number(m.id) === Number(img.idIndex));
                        if (index_a !== -1) {
                            const tmpa = this.newContentGetImage(_question[index_q].answer_option[index_a].value, img);
                            _question[index_q].answer_option[index_a].value = tmpa;
                        }
                    }
                }
            });

            this.list_question = this.helperService.sort(parent, 'part');
        }
    }

    getArrayImageInQuestion(string: string, index: number, where: string, parent_id): any[] {
        const result = [];
        if (string) {
            const next = string.toString().replace(/src="(.*?)"/g, (res) => {
                const imageId = res.replace(/src="|"/g, '');
                result.push({ idIndex: index, idImage: imageId, name: null, where: where, base64: null, parent_id: parent_id });
                return res;
            });
            return result;
        }
        return result;
    }

    newContentGetImage(string: string, newArr: any) {
        const newString = string.replace(/src="(.*?)"/g, (res) => {
            const imageId = res.replace(/src="|"/g, '');
            if (imageId === newArr.idImage) {
                return 'src="'.concat(newArr.base64, '"');
            } else {
                return res;
            }
        });
        return newString;
    }

    expandAndCom(part: any) {
        part['expand'] = !part['expand']
    }

    deleteDataQuest(part: any) {
        this.deleteQuestion.emit(part);
    }

    selectPreviewAudio(part) {
        this.list_question.forEach(f => {
            f['media_open'] = false;
        })
        part['media_open'] = true;
    }

}
