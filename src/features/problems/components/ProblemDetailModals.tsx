"use client";

import {
  OneButtonModal,
  TwoButtonModal,
  WarningModal,
} from "@/components/common";

interface ProblemDetailModalsProps {
  alertModal: {
    open: boolean;
    title: string;
    content: string;
  };
  chatRoomTitleConfirmOpen: boolean;
  chatRoomTitleInput: string;
  chatRoomTitleUpdating: boolean;
  emptySubmitModalOpen: boolean;
  onAlertClose: () => void;
  onBackCancel: () => void;
  onBackConfirm: () => void;
  onChatRoomTitleConfirm: () => void;
  onChatRoomTitleConfirmClose: () => void;
  onEmptySubmitClose: () => void;
  onProblemCompleteConfirm: () => void;
  onRecommendedCourseCancel: () => void;
  onRecommendedCourseConfirm: () => void;
  onSuccessClose: () => void;
  problemCompleteModalOpen: boolean;
  recommendedCourseModalOpen: boolean;
  successModalOpen: boolean;
  warningModalOpen: boolean;
}

export default function ProblemDetailModals({
  alertModal,
  chatRoomTitleConfirmOpen,
  chatRoomTitleInput,
  chatRoomTitleUpdating,
  emptySubmitModalOpen,
  onAlertClose,
  onBackCancel,
  onBackConfirm,
  onChatRoomTitleConfirm,
  onChatRoomTitleConfirmClose,
  onEmptySubmitClose,
  onProblemCompleteConfirm,
  onRecommendedCourseCancel,
  onRecommendedCourseConfirm,
  onSuccessClose,
  problemCompleteModalOpen,
  recommendedCourseModalOpen,
  successModalOpen,
  warningModalOpen,
}: ProblemDetailModalsProps) {
  return (
    <>
      <OneButtonModal
        isOpen={successModalOpen}
        modalContent="해당 문제의 해설을 확인할 수 있습니다."
        modalTitle="정답입니다"
        onClose={onSuccessClose}
      />
      <OneButtonModal
        isOpen={problemCompleteModalOpen}
        modalContent="모든 문제 풀이를 완료했습니다. 확인을 누르면 문제풀이 목록으로 이동합니다."
        modalTitle="축하합니다!"
        onClose={onProblemCompleteConfirm}
      />
      <OneButtonModal
        isOpen={emptySubmitModalOpen}
        modalContent="실행하거나 제출할 코드를 입력해 주세요."
        modalTitle="내용을 입력해 주세요"
        onClose={onEmptySubmitClose}
      />
      <OneButtonModal
        isOpen={alertModal.open}
        modalContent={alertModal.content}
        modalTitle={alertModal.title}
        onClose={onAlertClose}
      />
      <TwoButtonModal
        cancelDisabled={chatRoomTitleUpdating}
        confirmDisabled={chatRoomTitleUpdating || !chatRoomTitleInput.trim()}
        isOpen={chatRoomTitleConfirmOpen}
        modalContent={`채팅방 이름을 "${chatRoomTitleInput.trim()}"(으)로 변경합니다.`}
        modalTitle="채팅방 이름을 수정하시겠습니까?"
        onClose={onChatRoomTitleConfirmClose}
        onConfirm={onChatRoomTitleConfirm}
      />
      <WarningModal
        isOpen={warningModalOpen}
        modalContent="작성한 내용은 저장되지 않습니다."
        modalTitle="정말 나가시겠습니까?"
        onClose={onBackCancel}
        onConfirm={onBackConfirm}
      />
      <WarningModal
        isOpen={recommendedCourseModalOpen}
        modalContent="작성한 내용은 저장되지 않습니다."
        modalTitle="정말 나가시겠습니까?"
        onClose={onRecommendedCourseCancel}
        onConfirm={onRecommendedCourseConfirm}
      />
    </>
  );
}
