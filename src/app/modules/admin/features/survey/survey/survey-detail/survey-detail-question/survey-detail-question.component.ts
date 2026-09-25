import { Component, Input, NgZone, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@core/services/notification.service';
import { SidebarModule } from "primeng/sidebar";
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from "primeng/dropdown";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SurveyQuestion, SurveyQuestionColsOption, SurveyQuestionExtend, SurveyQuestionFrequencyUnitOption, SurveyQuestionParams, SurveyQuestionRateOption, SurveyQuestionType, SurveyQuestionTypeDateOption, SurveyQuestionTypeOption } from '@modules/shared/models/survey-question';
import { SurveyQuestionRadioComponent } from "./children/survey-question-radio/survey-question-radio.component";
import { ActivatedRoute } from '@angular/router';
import { SurveyQuestionInputComponent } from './children/survey-question-input/survey-question-input.component';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from "primeng/multiselect";
import { SurveyQuestionCheckboxComponent } from "./children/survey-question-checkbox/survey-question-checkbox.component";
import { SurveyQuestionSelectComponent } from "./children/survey-question-select/survey-question-select.component";
import { SurveyQuestionDateComponent } from './children/survey-question-date/survey-question-date.component';
import { SurveyQuestionRateComponent } from './children/survey-question-rate/survey-question-rate.component';
import { SharedModule } from "@modules/shared/shared.module";
import { SurveyQuestionService } from '@modules/shared/services/survey-question.service';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { IctuQueryParams, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { TooltipModule } from 'primeng/tooltip';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SurveyService } from '@modules/shared/services/survey.service';
import { SurveyGroupInfo, SurveyState } from '@modules/shared/models/survey';
import { SurveyQuestionAnswerService } from '@modules/shared/services/survey-question-answer.service';
import { SurveyPlanService } from '@modules/shared/services/survey-plan.service';
import { DisplayPositionOption, SurveyPlan, SurveyPlanQuestionGroup } from '@modules/shared/models/survey-plan';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
@Component({
  selector: 'app-survey-detail-question',
  standalone: true,
  imports: [CommonModule,
    SidebarModule,
    ButtonModule,
    DropdownModule,
    FormsModule,
    SurveyQuestionRadioComponent,
    ReactiveFormsModule,
    SurveyQuestionInputComponent,
    InputSwitchModule,
    MultiSelectModule,
    SurveyQuestionCheckboxComponent,
    CheckboxModule,
    SurveyQuestionSelectComponent,
    SurveyQuestionDateComponent,
    SurveyQuestionRateComponent,
    SharedModule,
    TooltipModule,
    DragDropModule,
    DialogModule],
  templateUrl: './survey-detail-question.component.html',
  styleUrls: ['./survey-detail-question.component.css']
})
export class SurveyDetailQuestionComponent implements OnInit {

  constructor(private noitifi: NotificationService,
    private route: ActivatedRoute,
    private surveysQuetsionService: SurveyQuestionService,
    private surveysService: SurveyService,
    private surveyQuestionAnswerService: SurveyQuestionAnswerService,
    private surveyPlanService: SurveyPlanService,
    private ngZone: NgZone
  ) { }

  @ViewChild('createSurvey') createQuestion: TemplateRef<any>;

  surveyQuestionTypeOption = SurveyQuestionTypeOption;

  surveyQuestionColsOption = SurveyQuestionColsOption;

  surveyQuestionTypeSelect: SurveyQuestionType = 'RADIO';

  visiblePanel: boolean = false;

  listSurveyQuetsion: SurveyQuestionExtend[] = [];


  @Input() survey_id: number = -1;

  state: SurveyState = 'LOADING';

  surveyQuestionTypeDateOption = SurveyQuestionTypeDateOption;

  idSurvey: number = 0;

  surveyQuestionFrequencyUnitOption = SurveyQuestionFrequencyUnitOption;

  is_drag: boolean = false;


  @Input() isLock: boolean = false;

  @Input() planId: string = '';

  displayPositionOptions = DisplayPositionOption;

  questionSelected: { [id: number]: boolean } = {};

  questionPosition: { [id: number]: string } = {};

  selectedCount: number = 0;

  selectedPosition: string = '';

  selectAll: boolean = false;

  groupedQuestions: { position: string; label: string; items: SurveyQuestionExtend[] }[] = [];

  ungroupedQuestions: SurveyQuestionExtend[] = [];

  activePositionFilter: string = '';

  // Group info properties (mới, KHÔNG sửa gì cũ)
  surveyGroupInfo: SurveyGroupInfo[] = [];

  activeGroupId: string = '';

  showGroupSave: boolean = false;

  groupDialogVisible: boolean = false;

  newGroupName: string = '';

  groupQuestionSelected: { [id: number]: boolean } = {};

  _savedGroupId: string = '';

  ngOnInit(): void {
    if (this.isLock == true) {
      this.idSurvey = this.survey_id;
    } else {
      this.idSurvey = parseInt(this.route.snapshot.queryParamMap.get('code'));
    }
    this.initData();
  }


  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['survey_ids']) {
  //     this.isLock = true;
  //     this.initDataView();
  //   }
  // }

  initData() {

    this.state = 'LOADING';
    this.noitifi.isProcessing(true);
    const condition: OvicConditionParam[] = [];

    const queryParams: IctuQueryParams = {
      limit: -1,
      paged: 1,
      order: 'ASC',
      orderby: 'ordering',
      include: this.idSurvey,
      include_by: 'survey_id'
    };
    const requests: any = {
      question: this.surveysQuetsionService.loadData(condition, queryParams),
      question_answer: this.surveyQuestionAnswerService.countAnswerSurvey(this.idSurvey.toString()),
      survey_info: this.surveysService.loadData1(this.idSurvey.toString())
    };

    if (this.isLock && this.planId) {
      requests.plan = this.surveyPlanService.loadData1(this.planId);
    }

    forkJoin(requests).pipe(
      map((res: any) => {
        return {
          question: res.question.data,
          question_answer: res.question_answer,
          survey_info: res.survey_info.data,
          plan: res.plan ? res.plan.data : null
        }
      })
    ).subscribe({
      next: (res) => {
        if (res.question_answer > 0) {
          const inputLock = this.isLock;
          this.isLock = true;
          if (!inputLock) {
            this.noitifi.isProcessing(false);
            setTimeout(() => {
              this.ngZone.run(() => {
                void this.noitifi.confirm(
                  'Phiếu khảo sát này đã có câu trả lời, không thể chỉnh sửa!',
                  'Thông báo',
                  [{ name: 'close', label: 'Đóng', class: 'btn btn-cancel', icon: 'fa fa-ban' }]
                );
              });
            }, 60);
          }
        }
        const tam = res.question.map((item) => {
          const cols = Number(item.config?.cols);
          return {
            ...item,
            config: { ...item.config, cols: [1, 2, 3, 4].includes(cols) ? cols : 1 },
            active: false
          };
        })
        this.listSurveyQuetsion = tam;

        // Load group info
        this.surveyGroupInfo = res.survey_info?.group_info || [];
        if (this._savedGroupId) {
          this.activeGroupId = this._savedGroupId;
          this._savedGroupId = '';
        } else {
          this.activeGroupId = '';
        }

        // Restore saved selections
        if (res.plan && res.plan.questions) {
          const groups: SurveyPlanQuestionGroup[] = res.plan.questions;
          for (const group of groups) {
            for (const id of group.ids) {
              this.questionPosition[id] = group.position;
            }
          }
        }

        this.buildGroupedQuestions();
        this.state = 'SUCCESS';
        this.noitifi.isProcessing(false);
      }, 
      error: (err) => {
        this.state = 'ERROR';
        // this.noitifi.toastError('Lỗi kết nối');
        this.noitifi.isProcessing(false);
      },
    });
  }

  // initDataView() {
  //   this.noitifi.isProcessing(true);
  //   const condition: OvicConditionParam[] = [];

  //   const queryParams: IctuQueryParams = {
  //     limit: -1,
  //     paged: 1,
  //     order: 'ASC',
  //     orderby: 'ordering',
  //     include: this.survey_ids,
  //     include_by: 'survey_id'
  //   };
  //   this.surveysQuetsionService.loadData(condition, queryParams).pipe(
  //     map(res => {
  //       return res.data;
  //     })
  //   ).subscribe({
  //     next: (res) => {
  //       const tam = res.map((item) => {
  //         return { ...item, active: false };
  //       })
  //       this.listSurveyQuetsion = tam;
  //       this.noitifi.isProcessing(false);
  //     },
  //     error: (err) => {
  //       this.noitifi.toastError('Lỗi kết nối');
  //       this.noitifi.isProcessing(false);
  //     },
  //   });
  // }

  openFormAddQuestion(): void {
    // this.visiblePanel = true;
    this.listSurveyQuetsion.push({
      id: -1,
      survey_id: this.idSurvey,
      title: 'Đây là tiêu đề...',
      ordering: 1,
      answer_options: [],
      allow_other_answer: 0,
      required: 1,
      question_type: 'RADIO',
      params: {},
      media: null,
      active: true,
      frequency: 0,
      frequency_unit: 'ONE',
      config: { cols: 1 }
    })
  }

  addQuestion(index: number): void {
    this.listSurveyQuetsion.push({
      id: -1,
      survey_id: this.idSurvey,
      title: '',
      ordering: this.listSurveyQuetsion.length + 1,
      answer_options: [],
      allow_other_answer: 0,
      required: 1,
      question_type: 'RADIO',
      params: {},
      media: null,
      active: true,
      frequency: 0,
      frequency_unit: 'ONE',
      config: { cols: 1 }
    });

    this.listSurveyQuetsion.forEach((item, i) => {
      if (i == this.listSurveyQuetsion.length - 1) {
        item.active = true;
      } else {
        item.active = false;
      }
    });
  }


  setActive(index: number) {
    this.listSurveyQuetsion.forEach((item, i) => {
      if (i == index) {
        item.active = true;
      } else {
        item.active = false;
      }
    });
  }

  onSelectStatus(event, index: number) {
    (this.listSurveyQuetsion[index].params as SurveyQuestionParams).date_time_mode = event.value;
  }

  onChangeQuestionType(event, index: number): void {
    const value = this.listSurveyQuetsion[index];
    if (value.question_type == 'RADIO' || value.question_type == 'CHECKBOX') {
      value.config = value.config || { cols: 1 };
    }
    if (value.question_type == 'DATE') {
      (this.listSurveyQuetsion[index].params as SurveyQuestionParams).date_time_mode = event.value;
    } else if (value.question_type == 'RATE') {
      (this.listSurveyQuetsion[index].params as SurveyQuestionRateOption) = { min_star: 0, max_star: 5 };
    }
  }

  duplicateQuestion(index: number): void {
    const question = this.listSurveyQuetsion[index];
    this.listSurveyQuetsion.push({
      ...question,
      id: -1,
      ordering: this.listSurveyQuetsion.length + 1,
      config: { ...question.config }
    });
    this.listSurveyQuetsion.forEach((item, i) => {
      if (i == this.listSurveyQuetsion.length - 1) {
        item.active = true;
      } else {
        item.active = false;
      }
    });
  }

  saveQuetsion(index: number): void {
    this.noitifi.isProcessing(true);
    if (this.listSurveyQuetsion[index].question_type != 'CHECKBOX'
      && this.listSurveyQuetsion[index].question_type != 'RADIO'
      && this.listSurveyQuetsion[index].question_type != 'SELECT'
      && this.listSurveyQuetsion[index].question_type != 'MULTI_SELECT'
      && this.listSurveyQuetsion[index].question_type != 'YES_NO') {
      this.listSurveyQuetsion[index].answer_options = [];
    }
    const value = this.listSurveyQuetsion[index];
    const info: Partial<SurveyQuestion> = {
      title: value.title,
      ordering: value.ordering,
      allow_other_answer: value.allow_other_answer,
      answer_options: value.answer_options.map(item => ({
        ...item,
        id: item.id.toString()
      })),
      survey_id: value.survey_id,
      required: value.required,
      question_type: value.question_type,
      params: value.params,
      config: value.config || { cols: 1 },
      frequency: value.frequency_unit != 'ONE' ? value.frequency : 0,
      frequency_unit: value.frequency_unit
    }
    let request$;

    if (value.id == -1) {
      request$ = forkJoin([
        this.surveysQuetsionService.postData(info),
        this.surveysService.putData({ total_questions: this.listSurveyQuetsion.length }, value.survey_id.toString())
      ]);
    } else {
      request$ = this.surveysQuetsionService.putData(info, value.id.toString());

    }
    request$.subscribe({
      next: (res) => {
        if (value.id == -1) {
          const postResult = res[0];
          this.listSurveyQuetsion[index].id = postResult.data;
        }
        this.noitifi.toastSuccess('Lưu thành công');
        this.noitifi.isProcessing(false);
      },
      error: () => {
        this.noitifi.toastError('Lưu không thành công');
        this.noitifi.isProcessing(false);
      },
    });
  }






  drop(event: CdkDragDrop<any[]>) {
    const prev = event.previousIndex;
    const curr = event.currentIndex;

    moveItemInArray(this.listSurveyQuetsion, prev, curr);

    const start = Math.min(prev, curr);
    const end = Math.max(prev, curr);

    const requests = [];

    this.noitifi.isProcessing(true);
    for (let i = start; i <= end; i++) {
      this.listSurveyQuetsion[i].ordering = i + 1;
      requests.push(
        this.surveysQuetsionService.putData(
          { ordering: i + 1 },
          this.listSurveyQuetsion[i].id.toString()
        )
      );
    }
    forkJoin(requests).subscribe({
      next: () => {
        this.noitifi.toastSuccess('Cập nhật thành công');
      },
      error: () => {
        this.noitifi.toastError('Cập nhật thất bại');
      }
    });

    this.noitifi.isProcessing(false);

  }

  delQuestion(index: number): void {
    const value = this.listSurveyQuetsion[index];
    this.noitifi.confirmDelete().then(
      (a) => {
        if (a) {
          if (value.id != -1) {
            this.noitifi.isProcessing(true);
            this.surveysQuetsionService.delData(value.id.toString()).pipe(

              switchMap(() => {
                this.listSurveyQuetsion = this.listSurveyQuetsion.filter((item) => item.id != value.id);
                return this.surveysService.putData(
                  { total_questions: this.listSurveyQuetsion.length },
                  value.survey_id.toString()
                )
              }
              )
            ).subscribe({
              next: () => {
                this.noitifi.toastSuccess('Xóa thành công');
                this.noitifi.isProcessing(false);
              },
              error: () => {
                this.noitifi.toastError('Xóa không thành công');
                this.noitifi.isProcessing(false);
              },
            })
          } else {
            this.listSurveyQuetsion.splice(index, 1);
          }
        }
      },
      () => null
    );
  }


  onDragStart(index: number) {
    this.is_drag = true;
    this.listSurveyQuetsion[index].active = false;
  }

  onDragEnd(index: number) {
    this.is_drag = false;
  }

  reloadData(): void {
    this.initData();
  }

  // --- Selection mode methods (isLock = true) ---

  onQuestionSelectionChange(id: number): void {
    if (!this.questionSelected[id]) {
      this.questionPosition[id] = '';
      this.buildGroupedQuestions();
    }
    this.updateSelectedCount();

    // Nếu đang lọc theo group và không còn câu nào được chọn nữa thì clear filter
    if (this.activePositionFilter && this.selectedCount === 0) {
      this.clearPositionFilter();
    }
  }

  onSelectAllChange(): void {
    for (const item of this.listSurveyQuetsion) {
      if (!this.activePositionFilter || this.questionPosition[item.id] === this.activePositionFilter) {
        if (!this.questionPosition[item.id] || this.activePositionFilter) {
          this.questionSelected[item.id] = this.selectAll;
        }
      }
    }
    this.updateSelectedCount();
  }

  updateSelectedCount(): number {
    this.selectedCount = Object.keys(this.questionSelected).filter(k => this.questionSelected[+k]).length;
    return this.selectedCount;
  }

  hasSelectedQuestions(): boolean {
    for (const key in this.questionSelected) {
      if (this.questionSelected[key]) return true;
    }
    return false;
  }

  buildGroupedQuestions(): void {
    const posMap: Map<string, SurveyQuestionExtend[]> = new Map();
    const ungrouped: SurveyQuestionExtend[] = [];

    for (const item of this.listSurveyQuetsion) {
      const pos = this.questionPosition[item.id];
      if (pos) {
        if (!posMap.has(pos)) {
          posMap.set(pos, []);
        }
        posMap.get(pos).push(item);
      } else {
        ungrouped.push(item);
      }
    }

    this.groupedQuestions = [];
    posMap.forEach((items, position) => {
      const label = this.getPositionLabel(position);
      this.groupedQuestions.push({ position, label, items });
    });

    this.ungroupedQuestions = ungrouped;
  }

  saveQuestionSelection(): void {
    const groupMap: Map<string, number[]> = new Map();

    for (const item of this.listSurveyQuetsion) {
      if (this.questionPosition[item.id]) {
        const pos = this.questionPosition[item.id];
        if (!groupMap.has(pos)) {
          groupMap.set(pos, []);
        }
        groupMap.get(pos).push(item.id);
      }
    }

    const questions: SurveyPlanQuestionGroup[] = [];
    groupMap.forEach((ids, position) => {
      questions.push({ ids, position });
    });

    this.noitifi.isProcessing(true);
    this.surveyPlanService.putData({ questions }, this.planId).subscribe({
      next: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastSuccess('Lưu thành công');
        this.initData();
      },
      error: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastError('Lưu thất bại');
      }
    });
  }

  assignPositionToSelected(): void {
    if (!this.selectedPosition) return;
    for (const item of this.listSurveyQuetsion) {
      if (this.questionSelected[item.id]) {
        this.questionPosition[item.id] = this.selectedPosition;
        this.questionSelected[item.id] = false;
      }
    }
    this.selectedPosition = '';
    this.updateSelectedCount();
    this.buildGroupedQuestions();
  }

  selectPositionGroup(position: string): void {
    for (const item of this.listSurveyQuetsion) {
      this.questionSelected[item.id] = false;
    }
    this.activePositionFilter = position;
    this.selectAll = false;
    for (const item of this.listSurveyQuetsion) {
      if (this.questionPosition[item.id] === position) {
        this.questionSelected[item.id] = true;
      }
    }
    this.updateSelectedCount();
  }

  clearPositionFilter(): void {
    this.activePositionFilter = '';
    this.selectAll = false;
    for (const item of this.listSurveyQuetsion) {
      this.questionSelected[item.id] = false;
    }
    this.updateSelectedCount();
  }

  getPositionLabel(positionId: string): string {
    const option = this.displayPositionOptions.find(o => o.id === positionId);
    return option ? option.label : positionId;
  }

  // --- Group info methods (dùng SurveyGroupInfo.ids) ---

  getQuestionGroupId(questionId: number): string | null {
    for (const g of this.surveyGroupInfo) {
      if (g.ids?.includes(questionId)) return g.id;
    }
    return null;
  }

  get filteredQuestions(): SurveyQuestionExtend[] {
    if (!this.activeGroupId) {
      return this.listSurveyQuetsion;
    }
    const group = this.surveyGroupInfo.find(g => g.id === this.activeGroupId);
    const groupIds = group?.ids || [];
    return this.listSurveyQuetsion.filter(item =>
      !this.getQuestionGroupId(item.id) || groupIds.includes(item.id)
    );
  }

  selectGroup(id: string): void {
    this.activeGroupId = id;
    this.showGroupSave = !!id;
    if (id) {
      const group = this.surveyGroupInfo.find(g => g.id === id);
      const groupIds = group?.ids || [];
      for (const item of this.listSurveyQuetsion) {
        this.groupQuestionSelected[item.id] = groupIds.includes(item.id);
      }
    }
  }

  onQuestionGroupChange(item: SurveyQuestionExtend): void {
    this.groupQuestionSelected[item.id] = !this.groupQuestionSelected[item.id];
  }

  onCreateGroup(): void {
    if (this.isLock) {
      this.noitifi.toastError('Khảo sát đã có câu trả lời! Không thể chỉnh sửa');
      return;
    }
    this.newGroupName = '';
    this.groupDialogVisible = true;
  }

  onDeleteGroup(id: string): void {
    if (this.isLock) {
      this.noitifi.toastError('Khảo sát đã có câu trả lời! Không thể chỉnh sửa');
      return;
    }
    const group = this.surveyGroupInfo.find(g => g.id === id);
    if (!group) return;
    this.noitifi.confirmDelete(`Xóa nhóm "${group.name}"?`).then(
      (a) => {
        if (a) {
          this.surveyGroupInfo = this.surveyGroupInfo.filter(g => g.id !== id);
          this.noitifi.isProcessing(true);
          this.surveysService.putData(
            { group_info: this.surveyGroupInfo },
            this.idSurvey.toString()
          ).subscribe({
            next: () => {
              this.noitifi.isProcessing(false);
              this.noitifi.toastSuccess('Xóa nhóm thành công');
              if (this.activeGroupId === id) {
                this.selectGroup('');
              }
              this.syncGroupToPlans();
              this.initData();
            },
            error: () => {
              this.noitifi.isProcessing(false);
              this.noitifi.toastError('Xóa nhóm thất bại');
            }
          });
        }
      },
      () => null
    );
  }

  onConfirmCreateGroup(): void {
    if (!this.newGroupName.trim()) {
      this.noitifi.toastError('Vui lòng nhập tên nhóm');
      return;
    }
    const newGroup: SurveyGroupInfo = {
      id: crypto.randomUUID(),
      name: this.newGroupName.trim(),
      ids: []
    };
    this.surveyGroupInfo = [...this.surveyGroupInfo, newGroup];
    this.groupDialogVisible = false;
    this.noitifi.isProcessing(true);
    this.surveysService.putData(
      { group_info: this.surveyGroupInfo },
      this.idSurvey.toString()
    ).subscribe({
      next: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastSuccess('Tạo nhóm thành công');
        this.syncGroupToPlans();
      },
      error: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastError('Tạo nhóm thất bại');
      }
    });
  }

  onSaveGroup(): void {
    if (this.isLock) {
      this.noitifi.toastError('Khảo sát đã có câu trả lời! Không thể chỉnh sửa');
      return;
    }
    if (!this.activeGroupId) return;
    const group = this.surveyGroupInfo.find(g => g.id === this.activeGroupId);
    if (!group) return;
    const newIds = Object.keys(this.groupQuestionSelected)
      .filter(k => this.groupQuestionSelected[+k])
      .map(k => +k);
    if (JSON.stringify(group.ids) === JSON.stringify(newIds)) {
      this.noitifi.toastSuccess('Không có thay đổi');
      return;
    }
    group.ids = newIds;
    this._savedGroupId = this.activeGroupId;
    this.noitifi.isProcessing(true);
    this.surveysService.putData(
      { group_info: this.surveyGroupInfo },
      this.idSurvey.toString()
    ).subscribe({
      next: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastSuccess('Lưu thành công');
        this.syncGroupToPlans();
        this.initData();
      },
      error: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastError('Lưu thất bại');
      }
    });
  }

  syncGroupToPlans(): void {
    const surveyId = this.idSurvey.toString();
    this.surveyPlanService.loadData(
      [{ conditionName: 'survey_id', condition: OvicQueryCondition.equal, value: surveyId }],
      { limit: -1, paged: 1 }
    ).subscribe({
      next: (res) => {
        const plans: SurveyPlan[] = res.data || [];
        const requests = plans.map(plan => {
          const oldRandom = Array.isArray(plan.question_pools) ? plan.question_pools : [];
          const newRandom = this.surveyGroupInfo.map(g => {
            const old = oldRandom.find(r => r.group_info_id === g.id);
            return {
              group_info_id: g.id,
              ids: g.ids || [],
              random_count: old ? old.random_count : 0
            };
          });
          return this.surveyPlanService.putData({ question_pools: newRandom }, plan.id.toString());
        });
        for (const req of requests) {
          req.subscribe();
        }
      }
    });
  }

}
