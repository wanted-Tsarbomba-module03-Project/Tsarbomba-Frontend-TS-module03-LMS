export type ProblemDifficulty = "EASY" | "MEDIUM" | "HARD";

export type ProblemCategoryId = string;

export interface ProblemCategory {
  categoryId: ProblemCategoryId;
  categoryName: string;
  description?: string;
}

export interface ProblemInfo {
  title: string;
  categoryId: ProblemCategoryId;
  difficulty: ProblemDifficulty;
  description: string;
}

export interface ProblemTestCase {
  testCode: string;
  isHidden: boolean;
  timeoutMs: number;
}

export interface SubProblem {
  problemId?: number;
  hintId?: number;
  questionTitle: string;
  context: string;
  point: number;
  startCode?: string | null;
  hint: string;
  solution: string;
  testCases: ProblemTestCase[];
  recommendedCourseIds?: number[];
}

export interface ExistingDatasetFile {
  name: string;
  isExisting: true;
}

export type ProblemDatasetFile = File | ExistingDatasetFile;

export interface CreateProblemRequest {
  title: string;
  categoryName: string;
  difficulty: ProblemDifficulty;
  description: string;
  dataFileName: string;
  problems: Array<{
    title: string;
    content: string;
    point: number;
    startCode: string | null;
    hint: string;
    explanation: string;
    testCases: ProblemTestCase[];
  }>;
}

export interface RecommendedCourse {
  courseId: number;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
}

export interface SelectableRecommendedCourse extends RecommendedCourse {
  categoryId?: number | null;
  categoryName?: string | null;
}

export interface EditableRecommendedCourse extends SelectableRecommendedCourse {
  selected?: boolean;
  displayOrder?: number | null;
}

export interface ProblemRecommendedCoursesResponse {
  courses: RecommendedCourse[];
}

export interface SelectableRecommendedCoursesResponse {
  courses: SelectableRecommendedCourse[];
}

export interface EditableRecommendedCoursesResponse {
  problemId: number;
  selectedCourseIds: number[];
  courses: EditableRecommendedCourse[];
}

export interface UpdateProblemRequest {
  title: string;
  categoryName: string;
  difficulty: ProblemDifficulty;
  description: string;
  dataFileName: string;
  datasetId?: number | null;
  problems: Array<{
    problemId?: number;
    title: string;
    content: string;
    point: number;
    startCode: string | null;
    hintId?: number;
    hint: string;
    explanation: string;
    testCases: ProblemTestCase[];
  }>;
}

export interface ProblemSetSummary {
  problemSetId: number;
  problemNumber?: number;
  title: string;
  description: string;
  difficulty: ProblemDifficulty | string;
  accuracyRate?: number;
  createdAt?: string;
}

export interface RawProblemDetail {
  title?: string;
  categoryName?: string;
  difficulty?: ProblemDifficulty;
  description?: string;
  dataFileName?: string;
  datasetId?: number;
  problems?: Array<{
    problemId?: number;
    hintId?: number;
    title?: string;
    content?: string;
    point?: number;
    startCode?: string | null;
    hint?: string;
    explanation?: string;
    testCases?: ProblemTestCase[];
  }>;
}

export interface NormalizedProblemDetail {
  problemInfo: ProblemInfo;
  problems: SubProblem[];
  file: ExistingDatasetFile | null;
  datasetId: number | null;
}

export type ProblemStatus = "LOCKED" | "UNSOLVED" | "CORRECT" | "WRONG";

export type ProblemResultTab = "result" | "hint" | "recommendedCourses" | "solution";

export interface ProblemSetDetailProblem {
  problemId: number;
  problemNumber?: number;
  title: string;
  content: string;
  point?: number;
  startCode?: string | null;
  answer?: string;
  explanation?: string;
  solution?: string;
  status?: ProblemStatus;
}

export interface ProblemSetDetail {
  id: number;
  problemSetId?: number;
  title?: string;
  currentProblemId?: number;
  currentProblemNumber?: number;
  problems: ProblemSetDetailProblem[];
}

export interface ProblemSetResultSubmission {
  problemId: number;
  problemNumber?: number;
  title?: string;
  content?: string;
  submittedAnswer: string;
  isCorrect: boolean;
  submittedAt?: string;
  explanation?: string;
}

export interface ProblemSetResult {
  problemSetId: number;
  title?: string;
  isCompleted: boolean;
  accuracyRate: number;
  totalCompletedUserCount: number;
  correctCompletedUserCount: number;
  submissions: ProblemSetResultSubmission[];
}

export interface ProblemDatasetDownloadUrl {
  fileName: string;
  downloadUrl: string;
}

export interface ProblemSetRecommendation {
  recommendationId: number;
  problemSetId: number;
  rankNo: number;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  accuracyRate?: number | null;
  categoryId?: number | null;
  categoryName?: string | null;
}

export interface ProblemSetRecommendationResponse {
  hidden: boolean;
  hiddenUntil?: string | null;
  problemSets: ProblemSetRecommendation[];
}

export interface ProblemSetRecommendationHideResponse {
  hidden: boolean;
  hiddenUntil?: string | null;
}

export interface ProblemHint {
  hintId: number;
  hintOrder: number;
  hintContent: string;
}

export interface ExecutionResult {
  executionStatus?: string;
  output?: string;
  stdout?: string;
  result?: string;
  message?: string;
  errorMessage?: string;
  stderr?: string;
}

export interface SubmissionResult {
  isCorrect?: boolean;
  passedTestCount?: number;
  totalTestCount?: number;
  executionStatus?: string;
  errorMessage?: string;
  explanation?: string;
  nextProblemId?: number;
  submittedAt?: string;
}

export interface ChatMessage {
  role: "USER" | "ASSISTANT";
  content: string;
  error?: boolean;
  clientId?: string;
}

export interface ChatResponse {
  answer: string;
  roomId?: number;
}

export interface ChatRoomTitleUpdate {
  roomId: number;
  title: string;
  updatedAt: string;
}

export interface ProblemChatRoom {
  roomId: number;
  title: string;
  updatedAt: string;
  problemSetId?: number | string | null;
  problemId?: number | string | null;
  problemSet?: {
    id?: number | string | null;
    problemSetId?: number | string | null;
  } | null;
  problem?: {
    id?: number | string | null;
    problemId?: number | string | null;
  } | null;
}
