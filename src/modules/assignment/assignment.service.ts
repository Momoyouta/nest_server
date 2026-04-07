import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { CourseAssignment } from '@/database/entities/course_assignment.entity';
import { CourseAssignmentQuestion } from '@/database/entities/course_assignment_question.entity';
import { AssignmentSubmission } from '@/database/entities/assignment_submission.entity';
import { AssignmentAnswerDetail } from '@/database/entities/assignment_answer_detail.entity';
import { CourseQuestionResource } from '@/database/entities/course_question_resource.entity';
import { CourseStudent } from '@/database/entities/course_student.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { Student } from '@/database/entities/student.entity';
import { Course } from '@/database/entities/course.entity';
import { User } from '@/database/entities/user.entity';
import { SaveAssignmentDto } from './dto/save-assignment.dto';
import { PublishAssignmentDto } from './dto/publish-assignment.dto';
import { ExtendDeadlineDto } from './dto/extend-deadline.dto';
import { AssignmentListDto } from './dto/assignment-list.dto';
import { AssignmentDetailDto } from './dto/assignment-detail.dto';
import { AssignmentStatisticsDto } from './dto/assignment-statistics.dto';
import { AssignmentSubmissionsDto } from './dto/assignment-submissions.dto';
import { GradeQuestionDto } from './dto/grade-question.dto';
import { StudentAssignmentListDto } from './dto/student-assignment-list.dto';
import { StudentAssignmentDetailDto } from './dto/student-assignment-detail.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { SubmissionResultDto } from './dto/submission-result.dto';
import { UploadQuestionImageDto } from './dto/upload-question-image.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { UploadAnswerImageDto } from './dto/upload-answer-image.dto';
import { GetSubjectiveAnswersDto } from './dto/get-subjective-answers.dto';
import { CourseAssignmentStatusMap, CourseAssignmentQuestionTypeMap, AssignmentSubmissionStatusMap } from '@/common/utils/course.map';
import { Result } from '@/database/types/result.type';
import * as path from 'path';
import * as fs from 'fs';
import { env } from 'process';
import { getFileStoreRoot } from '@/common/utils/file-path.map';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(CourseAssignment)
    private assignmentRepo: Repository<CourseAssignment>,
    @InjectRepository(CourseAssignmentQuestion)
    private questionRepo: Repository<CourseAssignmentQuestion>,
    @InjectRepository(AssignmentSubmission)
    private submissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(AssignmentAnswerDetail)
    private answerDetailRepo: Repository<AssignmentAnswerDetail>,
    @InjectRepository(CourseQuestionResource)
    private resourceRepo: Repository<CourseQuestionResource>,
    @InjectRepository(CourseStudent)
    private courseStudentRepo: Repository<CourseStudent>,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  private async getTeacherId(userId: string): Promise<string> {
    const teacher = await this.teacherRepo.findOne({ where: { user_id: userId } });
    if (!teacher) throw new ForbiddenException('当前用户没有教师身份');
    return teacher.id;
  }

  private async getStudentId(userId: string): Promise<string> {
    const student = await this.studentRepo.findOne({ where: { user_id: userId } });
    if (!student) throw new ForbiddenException('当前用户没有学生身份');
    return student.id;
  }

  // ====================== 教师端逻辑 ======================

  async saveAssignment(dto: SaveAssignmentDto, userId: string) {
    const teacherId = await this.getTeacherId(userId);
    let assignment = new CourseAssignment();
    if (dto.assignment_id) {
      const found = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
      if (!found) throw new NotFoundException('作业不存在');
      assignment = found;
      if (assignment.status === CourseAssignmentStatusMap.PUBLISHED) {
        throw new BadRequestException('作业已发布，不允许编辑题目与答案');
      }
      await this.questionRepo.delete({ assignment_id: dto.assignment_id });
    } else {
      assignment.teacher_id = teacherId;
      assignment.status = CourseAssignmentStatusMap.DRAFT;
    }

    assignment.course_id = dto.course_id;
    assignment.teaching_group_id = dto.teaching_group_id || undefined;
    assignment.title = dto.title;
    assignment.description = dto.description;
    assignment.start_time = dto.start_time;
    assignment.deadline = dto.deadline;

    const savedAssignment = await this.assignmentRepo.save(assignment);

    if (dto.questions && dto.questions.length > 0) {
      const questions = dto.questions.map(q => {
        const entity = new CourseAssignmentQuestion();
        if (q.question_id) entity.id = q.question_id;
        entity.assignment_id = savedAssignment.id;
        entity.type = q.type;
        entity.score = q.score;
        entity.content = q.content;
        entity.standard_answer = q.standard_answer;
        entity.sort_order = q.sort_order;
        if (q.analysis) entity.analysis = q.analysis;
        return entity;
      });
      await this.questionRepo.save(questions);
    }

    return Result.success('保存成功', { assignment_id: savedAssignment.id });
  }

  async updateAssignment(dto: UpdateAssignmentDto, userId: string) {
    const teacherId = await this.getTeacherId(userId);
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id, teacher_id: teacherId } });
    if (!assignment) throw new NotFoundException('作业不存在');

    if (dto.title) assignment.title = dto.title;
    if (dto.description !== undefined) assignment.description = dto.description;
    if (dto.start_time) assignment.start_time = dto.start_time;
    if (dto.deadline) assignment.deadline = dto.deadline;

    await this.assignmentRepo.save(assignment);
    return Result.success('修改作业基本信息成功', null);
  }

  async publishAssignment(dto: PublishAssignmentDto, userId: string) {
    const teacherId = await this.getTeacherId(userId);
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id, teacher_id: teacherId } });
    if (!assignment) throw new NotFoundException('作业不存在');
    if (assignment.status === CourseAssignmentStatusMap.PUBLISHED) {
      throw new BadRequestException('作业已发布');
    }
    if (Number(assignment.start_time) >= Number(assignment.deadline)) {
      throw new BadRequestException('开始时间必须早于截止时间');
    }

    if (dto.teaching_group_id) {
      assignment.teaching_group_id = dto.teaching_group_id;
    }
    assignment.status = CourseAssignmentStatusMap.PUBLISHED;
    await this.assignmentRepo.save(assignment);
    return Result.success('发布成功', null);
  }

  async extendDeadline(dto: ExtendDeadlineDto, userId: string) {
    const teacherId = await this.getTeacherId(userId);
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id, teacher_id: teacherId } });
    if (!assignment) throw new NotFoundException('作业不存在');

    const now = Math.floor(Date.now() / 1000);
    if (Number(dto.deadline) <= now) {
      throw new BadRequestException('截止时间不得早于当前时间');
    }

    assignment.start_time = dto.start_time;
    assignment.deadline = dto.deadline;
    await this.assignmentRepo.save(assignment);
    return Result.success('调整时间成功', null);
  }

  async getAssignmentList(dto: AssignmentListDto, userId: string) {
    const teacherId = await this.getTeacherId(userId);
    const where: any = { course_id: dto.course_id, teacher_id: teacherId };
    if (dto.teaching_group_id) {
      where.teaching_group_id = dto.teaching_group_id;
    }
    const assignments = await this.assignmentRepo.find({ where, order: { create_time: 'DESC' } });
    
    const results = await Promise.all(assignments.map(async (a) => {
      const qCount = await this.questionRepo.count({ where: { assignment_id: a.id } });
      return {
        id: a.id,
        title: a.title,
        status: a.status,
        start_time: a.start_time,
        deadline: a.deadline,
        question_count: qCount,
      };
    }));

    return Result.success('获取列表成功', results);
  }

  async getAssignmentDetail(dto: AssignmentDetailDto, userId: string) {
    await this.getTeacherId(userId); // Verify identity
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment) throw new NotFoundException('作业不存在');

    const questions = await this.questionRepo.find({
      where: { assignment_id: dto.assignment_id },
      order: { type: 'ASC', sort_order: 'ASC' }
    });

    return Result.success('获取详情成功', {
      ...assignment,
      questions,
    });
  }

  async getAssignmentOverview(dto: AssignmentDetailDto, userId: string) {
    await this.getTeacherId(userId); // Verify identity
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment) throw new NotFoundException('作业不存在');

    let displayStatus = '';
    if (assignment.status === CourseAssignmentStatusMap.DRAFT) {
      displayStatus = '未发布';
    } else {
      const now = Math.floor(Date.now() / 1000);
      if (now < Number(assignment.start_time)) displayStatus = '未开始';
      else if (now > Number(assignment.deadline)) displayStatus = '已结束';
      else displayStatus = '进行中';
    }

    const questions = await this.questionRepo.find({ where: { assignment_id: dto.assignment_id } });

    let totalScore = 0;
    const typeStatsMap: Record<number, { count: number; score: number }> = {
      1: { count: 0, score: 0 },
      2: { count: 0, score: 0 },
      3: { count: 0, score: 0 },
      4: { count: 0, score: 0 },
      5: { count: 0, score: 0 },
    };

    questions.forEach(q => {
      totalScore += Number(q.score) || 0;
      if (typeStatsMap[q.type]) {
        typeStatsMap[q.type].count++;
        typeStatsMap[q.type].score += Number(q.score) || 0;
      }
    });

    const typeStats = Object.keys(typeStatsMap).map(type => {
      const stat = typeStatsMap[Number(type)];
      return {
        type: Number(type),
        count: stat.count,
        score: stat.score,
        score_percentage: totalScore > 0 ? Number((stat.score / totalScore).toFixed(4)) : 0,
      };
    });

    return Result.success('获取概览成功', {
      assignment_id: assignment.id,
      title: assignment.title,
      start_time: assignment.start_time,
      deadline: assignment.deadline,
      display_status: displayStatus,
      total_score: totalScore,
      total_question_count: questions.length,
      type_stats: typeStats,
    });
  }

  async getStatistics(dto: AssignmentStatisticsDto) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment) throw new NotFoundException('作业不存在');

    const groupCondition = dto.teaching_group_id || assignment.teaching_group_id;

    // 惰性补零分
    const now = Math.floor(Date.now() / 1000);
    const studentsWhere: any = { course_id: assignment.course_id };
    if (groupCondition) studentsWhere.group_id = groupCondition;
    
    const students = await this.courseStudentRepo.find({ where: studentsWhere });
    const studentIds = students.map(s => s.student_id);

    if (Number(assignment.deadline) < now && studentIds.length > 0) {
      const submissions = await this.submissionRepo.find({ where: { assignment_id: assignment.id } });
      const submittedIds = submissions.map(s => s.student_id);
      const unsubmittedIds = studentIds.filter(id => !submittedIds.includes(id));
      
      if (unsubmittedIds.length > 0) {
        const newSubmissions = unsubmittedIds.map(stId => {
          const sub = new AssignmentSubmission();
          sub.assignment_id = assignment.id;
          sub.course_id = assignment.course_id;
          sub.student_id = stId;
          sub.status = AssignmentSubmissionStatusMap.NOT_SUBMITTED;
          sub.total_score = '0.0';
          sub.teaching_group_id = groupCondition;
          return sub;
        });
        await this.submissionRepo.save(newSubmissions);
      }
    }

    const subWhere: any = { assignment_id: dto.assignment_id };
    if (groupCondition) subWhere.teaching_group_id = groupCondition;

    const allSubmissions = await this.submissionRepo.find({ where: subWhere });
    
    const questions = await this.questionRepo.find({ where: { assignment_id: dto.assignment_id } });
    const questionStats: any[] = [];

    const submissionIds = allSubmissions.map(s => s.id);
    const details = submissionIds.length > 0 
      ? await this.answerDetailRepo.find({ where: { submission_id: In(submissionIds) } })
      : [];

    for (const q of questions) {
      const qDetails = details.filter(d => d.question_id === q.id);
      const submitQCount = qDetails.length;
      let correctRate: number | null = null;
      let scoreRate = 0;
      
      const totalScore = qDetails.reduce((sum, d) => sum + Number(d.score || 0), 0);
      if (submitQCount > 0 && q.score > 0) {
        scoreRate = totalScore / (q.score * submitQCount);
      }

      if ([1, 2, 3].includes(q.type) && submitQCount > 0) {
        const correctCount = qDetails.filter(d => d.is_correct === 1).length;
        correctRate = correctCount / submitQCount;
      }

      questionStats.push({
        question_id: q.id,
        type: q.type,
        correct_rate: correctRate,
        score_rate: scoreRate,
      });
    }

    return Result.success('获取统计成功', {
      total_students: students.length,
      questions: questionStats
    });
  }

  async getSubmissions(dto: AssignmentSubmissionsDto) {
    const { assignment_id, teaching_group_id, studentName, isGraded, page = 1, pageSize = 10 } = dto;
    
    // 1. 验证作业
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignment_id } });
    if (!assignment) throw new NotFoundException('作业不存在');

    // 2. 确定筛选方案
    // 如果没有指定教学组，则使用作业本身的教学组
    const targetGroup = teaching_group_id || assignment.teaching_group_id;

    // 3. 构建 QueryBuilder 
    // 我们从 CourseStudent 出发，确保该课程/小组的所有学生都能被列出
    const queryBuilder = this.courseStudentRepo.createQueryBuilder('cs')
      .innerJoin(Student, 'student', 'cs.student_id = student.id')
      .innerJoin(User, 'user', 'student.user_id = user.id')
      .leftJoin(AssignmentSubmission, 'submission', 'submission.student_id = cs.student_id AND submission.assignment_id = :assignment_id', { assignment_id })
      .select([
        'cs.student_id as student_id',
        'user.name as student_name',
        'submission.id as submission_id',
        'submission.status as status',
        'submission.total_score as total_score',
        'submission.submit_time as submit_time',
        'submission.grade_time as grade_time',
        'submission.teacher_comment as teacher_comment',
        'cs.group_id as group_id'
      ])
      .where('cs.course_id = :course_id', { course_id: assignment.course_id });

    // 4. 教学组过滤
    if (targetGroup) {
      queryBuilder.andWhere('cs.group_id = :group_id', { group_id: targetGroup });
    }

    // 5. 学生姓名关键字搜索
    if (studentName) {
      queryBuilder.andWhere('user.name LIKE :studentName', { studentName: `%${studentName}%` });
    }

    // 6. 批改状态过滤
    if (isGraded !== undefined) {
      if (isGraded === 1) {
        queryBuilder.andWhere('submission.status = :status', { status: AssignmentSubmissionStatusMap.REVIEWED });
      } else {
        // 待批改：包含 已提交待审 和 未提交(submission 为 null 或状态为 0)
        queryBuilder.andWhere('(submission.status IS NULL OR submission.status IN (:...statuses))', { 
          statuses: [AssignmentSubmissionStatusMap.NOT_SUBMITTED, AssignmentSubmissionStatusMap.SUBMITTED_PENDING_REVIEW] 
        });
      }
    }

    // 7. 分页与数据获取
    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .orderBy('submission.submit_time', 'DESC')
      .addOrderBy('user.name', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    // 8. 格式化数据结构以符合前端预期 (把字段名由 a_b 变为实体字段名或保持一致)
    const formattedList = list.map(item => ({
      id: item.submission_id || null, // submission UUID
      student_id: item.student_id,
      student_name: item.student_name,
      status: item.status !== null ? item.status : 0,
      total_score: item.total_score || '0.0',
      submit_time: item.submit_time,
      grade_time: item.grade_time,
      teacher_comment: item.teacher_comment,
      teaching_group_id: item.group_id
    }));

    return Result.success('获取列表成功', { list: formattedList, total });
  }

  async gradeQuestion(dto: GradeQuestionDto) {
    const detail = await this.answerDetailRepo.findOne({ where: { submission_id: dto.submission_id, question_id: dto.question_id } });
    if (!detail) throw new NotFoundException('作答明细不存在');

    const question = await this.questionRepo.findOne({ where: { id: dto.question_id } });
    if (!question) throw new NotFoundException('题目不存在');
    if (dto.score > question.score) {
      throw new BadRequestException('评分不得超过题目满分');
    }

    detail.score = String(dto.score);
    if (dto.teacher_comment) detail.teacher_comment = dto.teacher_comment;
    await this.answerDetailRepo.save(detail);

    const submission = await this.submissionRepo.findOne({ where: { id: dto.submission_id } });
    if (!submission) throw new NotFoundException('提交记录不存在');
    if (dto.overall_comment) submission.teacher_comment = dto.overall_comment;
    
    // Recalculate total_score
    const allDetails = await this.answerDetailRepo.find({ where: { submission_id: dto.submission_id } });
    const totalScore = allDetails.reduce((sum, d) => sum + Number(d.score || 0), 0);
    submission.total_score = String(totalScore);

    // Check if fully graded (all subjective questions graded)
    const questions = await this.questionRepo.find({ where: { assignment_id: submission.assignment_id } });
    const subjectiveQuestions = questions.filter(q => q.type === CourseAssignmentQuestionTypeMap.FILL_IN_THE_BLANK || q.type === CourseAssignmentQuestionTypeMap.SHORT_ANSWER);
    
    let allGraded = true;
    for (const sq of subjectiveQuestions) {
      const sqDetail = allDetails.find(d => d.question_id === sq.id);
      if (!sqDetail || sqDetail.score === null || sqDetail.score === undefined) {
        allGraded = false;
        break;
      }
    }

    if (allGraded) {
      submission.status = AssignmentSubmissionStatusMap.REVIEWED;
      submission.grade_time = String(Math.floor(Date.now() / 1000));
    }

    await this.submissionRepo.save(submission);
    return Result.success('批改成功', null);
  }

  async getSubjectiveAnswers(dto: GetSubjectiveAnswersDto) {
    const submission = await this.submissionRepo.findOne({ where: { id: dto.submission_id } });
    if (!submission) throw new NotFoundException('提交记录不存在');

    const questions = await this.questionRepo.find({
      where: {
        assignment_id: submission.assignment_id,
        type: In([CourseAssignmentQuestionTypeMap.FILL_IN_THE_BLANK, CourseAssignmentQuestionTypeMap.SHORT_ANSWER])
      },
      order: { sort_order: 'ASC' }
    });

    if (questions.length === 0) {
      return Result.success('该作业无主观题', {
        course_id: submission.course_id,
        assignment_id: submission.assignment_id,
        submission_status: submission.status,
        overall_comment: submission.teacher_comment,
        questions: []
      });
    }

    const details = await this.answerDetailRepo.find({
      where: { submission_id: submission.id, question_id: In(questions.map(q => q.id)) }
    });

    const results = questions.map(q => {
      const detail = details.find(d => d.question_id === q.id);
      return {
        question_id: q.id,
        type: q.type,
        content: q.content,
        analysis: q.analysis,
        score: q.score,
        standard_answer: q.standard_answer,
        student_answer: detail ? detail.student_answer : null,
        earned_score: detail ? detail.score : null,
        teacher_comment: detail ? detail.teacher_comment : null,
      };
    });

    return Result.success('获取主观题作答成功', {
      course_id: submission.course_id,
      assignment_id: submission.assignment_id,
      submission_status: submission.status,
      questions: results
    });
  }

  // ====================== 学生端逻辑 ======================

  async getStudentAssignmentList(dto: StudentAssignmentListDto, userId: string) {
    const studentId = await this.getStudentId(userId);
    const courseStudent = await this.courseStudentRepo.findOne({ where: { course_id: dto.course_id, student_id: studentId } });
    if (!courseStudent) throw new NotFoundException('未加入该课程');

    const assignments = await this.assignmentRepo.find({
      where: [
        { course_id: dto.course_id, status: CourseAssignmentStatusMap.PUBLISHED, teaching_group_id: courseStudent.group_id },
        { course_id: dto.course_id, status: CourseAssignmentStatusMap.PUBLISHED, teaching_group_id: null as any } 
      ]
    });

    const results = await Promise.all(assignments.map(async (a) => {
      const sub = await this.submissionRepo.findOne({ where: { assignment_id: a.id, student_id: studentId } });
      return {
        id: a.id,
        title: a.title,
        start_time: a.start_time,
        deadline: a.deadline,
        submission_status: sub ? sub.status : null,
      };
    }));

    return Result.success('获取列表成功', results);
  }

  async getStudentAssignmentDetail(dto: StudentAssignmentDetailDto, userId: string) {
    const studentId = await this.getStudentId(userId);
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment || assignment.status !== CourseAssignmentStatusMap.PUBLISHED) {
      throw new NotFoundException('作业不可用');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now < Number(assignment.start_time)) throw new BadRequestException('作业尚未开始');
    if (now > Number(assignment.deadline)) throw new BadRequestException('作业已截止，不允许作答');

    const questions = await this.questionRepo.find({
      where: { assignment_id: dto.assignment_id },
      order: { type: 'ASC', sort_order: 'ASC' }
    });

    const submission = await this.submissionRepo.findOne({ where: { assignment_id: dto.assignment_id, student_id: studentId } });
    let answers: AssignmentAnswerDetail[] = [];
    if (submission) {
      answers = await this.answerDetailRepo.find({ where: { submission_id: submission.id } });
    }

    const cleanedQuestions = questions.map(q => {
      const studentAns = answers.find(a => a.question_id === q.id);
      return {
        id: q.id,
        type: q.type,
        score: q.score,
        content: q.content,
        sort_order: q.sort_order,
        student_answer: studentAns ? studentAns.student_answer : null
      };
    });

    return Result.success('获取详情成功', {
      assignment_id: assignment.id,
      title: assignment.title,
      start_time: assignment.start_time,
      deadline: assignment.deadline,
      status: submission ? (submission.status ?? 0) : 0,
      questions: cleanedQuestions,
    });
  }

  async saveDraft(dto: SaveDraftDto, userId: string) {
    const studentId = await this.getStudentId(userId);
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment) throw new NotFoundException('作业不存在');

    const now = Math.floor(Date.now() / 1000);
    if (now > Number(assignment.deadline)) throw new BadRequestException('作业已截止');

    let submission = await this.submissionRepo.findOne({ where: { assignment_id: dto.assignment_id, student_id: studentId } });
    if (submission && (submission.status ?? 0) >= AssignmentSubmissionStatusMap.SUBMITTED_PENDING_REVIEW) {
      throw new BadRequestException('作业已提交，不可修改');
    }

    if (!submission) {
      submission = new AssignmentSubmission();
      submission.assignment_id = assignment.id;
      submission.course_id = assignment.course_id;
      submission.student_id = studentId;
      submission.status = AssignmentSubmissionStatusMap.NOT_SUBMITTED;
      submission.teaching_group_id = assignment.teaching_group_id || undefined;
      submission = await this.submissionRepo.save(submission);
    }

    if (dto.answers && dto.answers.length > 0) {
      for (const ans of dto.answers) {
        let detail = await this.answerDetailRepo.findOne({ where: { submission_id: submission.id, question_id: ans.question_id } });
        if (!detail) {
          detail = new AssignmentAnswerDetail();
          detail.submission_id = submission.id;
          detail.question_id = ans.question_id;
          detail.student_id = studentId;
        }
        detail.student_answer = ans.student_answer;
        await this.answerDetailRepo.save(detail);
      }
    }

    return Result.success('保存草稿成功', null);
  }

  async submitAssignment(dto: SubmitAssignmentDto, userId: string) {
    const studentId = await this.getStudentId(userId);
    await this.saveDraft(dto, userId);
    
    const submission = await this.submissionRepo.findOne({ where: { assignment_id: dto.assignment_id, student_id: studentId } });
    if (!submission) throw new NotFoundException('提交记录不存在');
    const questions = await this.questionRepo.find({ where: { assignment_id: dto.assignment_id } });
    const answers = await this.answerDetailRepo.find({ where: { submission_id: submission.id } });

    await this.autoGrade(submission, questions, answers);
    
    return Result.success('提交成功', { submission_id: submission.id });
  }

  private async autoGrade(submission: AssignmentSubmission, questions: CourseAssignmentQuestion[], answers: AssignmentAnswerDetail[]) {
    let hasSubjective = false;

    for (const ans of answers) {
      const q = questions.find(qu => qu.id === ans.question_id);
      if (!q) continue;

      if ([CourseAssignmentQuestionTypeMap.SINGLE_CHOICE, CourseAssignmentQuestionTypeMap.JUDGE].includes(q.type as any)) {
        const sAns = (ans.student_answer as any)?.option_index;
        const cAns = (q.standard_answer as any)?.option_index;
        if (sAns !== undefined && sAns !== null && sAns === cAns) {
          ans.is_correct = 1;
          ans.score = String(q.score);
        } else {
          ans.is_correct = 0;
          ans.score = '0';
        }
      } else if (q.type === CourseAssignmentQuestionTypeMap.MULTIPLE_CHOICE) {
        const sAnsArray: any[] = Array.isArray((ans.student_answer as any)?.option_indexes) ? (ans.student_answer as any).option_indexes : [];
        const cAnsArray: any[] = Array.isArray((q.standard_answer as any)?.option_indexes) ? (q.standard_answer as any).option_indexes : [];
        sAnsArray.sort();
        cAnsArray.sort();
        if (sAnsArray.length > 0 && sAnsArray.length === cAnsArray.length && sAnsArray.every((val, index) => val === cAnsArray[index])) {
          ans.is_correct = 1;
          ans.score = String(q.score);
        } else {
          ans.is_correct = 0;
          ans.score = '0';
        }
      } else {
        hasSubjective = true;
        ans.is_correct = undefined;
        ans.score = '0';
      }
      await this.answerDetailRepo.save(ans);
    }

    const totalScore = answers.reduce((sum, d) => sum + Number(d.score || 0), 0);
    submission.total_score = String(totalScore);
    submission.status = hasSubjective ? AssignmentSubmissionStatusMap.SUBMITTED_PENDING_REVIEW : AssignmentSubmissionStatusMap.REVIEWED;
    submission.submit_time = String(Math.floor(Date.now() / 1000));
    if (!hasSubjective) submission.grade_time = submission.submit_time;
    
    await this.submissionRepo.save(submission);
  }

  async getSubmissionResult(dto: SubmissionResultDto, userId: string) {
    const studentId = await this.getStudentId(userId);
    const submission = await this.submissionRepo.findOne({ where: { assignment_id: dto.assignment_id, student_id: studentId } });
    if (!submission) throw new NotFoundException('没有提交记录');
    if (submission.status !== AssignmentSubmissionStatusMap.REVIEWED) {
      throw new BadRequestException('成绩尚未批改完成');
    }

    const questions = await this.questionRepo.find({ where: { assignment_id: dto.assignment_id } });
    const details = await this.answerDetailRepo.find({ where: { submission_id: submission.id } });

    const resultDetails = details.map(d => {
      const q = questions.find(qu => qu.id === d.question_id);
      return {
        question_id: d.question_id,
        score_earned: d.score,
        is_correct: d.is_correct,
        teacher_comment: d.teacher_comment,
        standard_answer: q?.standard_answer,
        analysis: q?.analysis,
      };
    });

    return Result.success('获取结果成功', {
      total_score: submission.total_score,
      teacher_comment: submission.teacher_comment,
      details: resultDetails,
    });
  }

  // ====================== 资源管理 ======================
  async uploadQuestionImage(file: Express.Multer.File, dto: UploadQuestionImageDto) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('仅允许上传图片文件');
    }
    const qCount = await this.questionRepo.count({ where: { id: dto.question_id } });
    if (qCount === 0) throw new NotFoundException('题目不存在');

    // Fetch course to get school_id for correct storage path
    const course = await this.courseRepo.findOne({ where: { id: dto.course_id } });
    if (!course) throw new NotFoundException('课程不存在');

    const randomHash = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const relativeUrl = `schools/${course.school_id}/courses/${dto.course_id}/images/${randomHash}${ext}`;
    const absolutePath = path.join(getFileStoreRoot(), relativeUrl);
    
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, file.buffer);

    const resource = new CourseQuestionResource();
    resource.question_id = dto.question_id;
    resource.resource_type = dto.resource_type;
    resource.file_url = relativeUrl;
    
    const saved = await this.resourceRepo.save(resource);

    return Result.success('上传成功', { resource_id: saved.id, file_url: saved.file_url });
  }

  async uploadAnswerImage(file: Express.Multer.File, dto: UploadAnswerImageDto, userId: string) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('仅允许上传图片文件');
    }

    const studentId = await this.getStudentId(userId);
    
    // 1. 获取作业信息以拿到 course_id
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment) throw new NotFoundException('作业不存在');
    
    // 2. 获取课程信息以拿到 school_id
    const course = await this.courseRepo.findOne({ where: { id: assignment.course_id } });
    if (!course) throw new NotFoundException('课程不存在');

    // 3. 确保获取该学生的提交记录 (submit_id)
    let submission = await this.submissionRepo.findOne({ where: { assignment_id: dto.assignment_id, student_id: studentId } });
    if (!submission) {
      // 自动创建提交记录
      submission = new AssignmentSubmission();
      submission.assignment_id = dto.assignment_id;
      submission.course_id = assignment.course_id;
      submission.student_id = studentId;
      submission.status = AssignmentSubmissionStatusMap.NOT_SUBMITTED;
      submission.teaching_group_id = assignment.teaching_group_id || undefined;
      submission = await this.submissionRepo.save(submission);
    }
    
    if ((submission.status ?? 0) >= AssignmentSubmissionStatusMap.SUBMITTED_PENDING_REVIEW) {
      throw new BadRequestException('作业已提交，无法修改。');
    }

    // 4. 获取答题详情以拿到 assignment_answer_detail_id
    let detail = await this.answerDetailRepo.findOne({ where: { submission_id: submission.id, question_id: dto.question_id } });
    if (!detail) {
      detail = new AssignmentAnswerDetail();
      detail.submission_id = submission.id;
      detail.question_id = dto.question_id;
      detail.student_id = studentId;
      detail = await this.answerDetailRepo.save(detail);
    }

    // 5. 路径规则: schools\{school_id}\courses\{course_id}\homework\{homework_id}\{submit_id}\
    const ext = path.extname(file.originalname);
    const fileName = `${detail.id}${ext}`;
    const relativeUrl = `schools/${course.school_id}/courses/${course.id}/homework/${assignment.id}/${submission.id}/${fileName}`;
    const absolutePath = path.join(getFileStoreRoot(), relativeUrl);

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    // 直接覆盖上传，因为文件名固定为 detail.id
    fs.writeFileSync(absolutePath, file.buffer);

    // 6. 更新数据库记录
    detail.student_answer = { ...(detail.student_answer as object || {}), image_url: relativeUrl };
    await this.answerDetailRepo.save(detail);

    return Result.success('上传作答图片成功', { file_url: relativeUrl });
  }

}
